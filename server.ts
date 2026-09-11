import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { store } from './src/lib/store';
import { processAssessment, triggerTwilioSms, toE164 } from './app/api/assess/route';
import { getOrCreateUser, getAllUsersFromDb } from './src/db/users.ts';
import { 
  saveAssessmentToDb, 
  getAllAssessmentsFromDb, 
  getAssessmentsByUidFromDb, 
  saveEmergencyAlertToDb 
} from './src/db/assessments.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsers with support for base64 audio payloads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Voice Stress Assessment Route
app.post('/api/assess', async (req, res) => {
  try {
    const data = await processAssessment(req.body);

    if (data && data.id) {
      try {
        await saveAssessmentToDb(data);
        if (data.highRiskFlag) {
          await saveEmergencyAlertToDb({
            recipientPhone: data.smsRecipient || '6379234471',
            recipientName: data.userName || 'High Risk Patient',
            alertMessage: `[HIGH RISK STRESS ALERT] Score: ${data.stressScore}/100. Dispatched via Twilio to 6379234471.`,
            stressScore: data.stressScore,
            status: data.smsStatus || 'SENT'
          });
        }
      } catch (dbErr) {
        console.error('Failed to persist assessment to Cloud SQL:', dbErr);
      }
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error('API /api/assess error:', error);
    res.status(500).json({ error: error.message || 'Assessment pipeline failed' });
  }
});

// Circuit-breaker for temporary 503 / high-demand models
const modelCooldownMap = new Map<string, number>();

function isModelInCooldown(model: string): boolean {
  const expiry = modelCooldownMap.get(model);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    modelCooldownMap.delete(model);
    return false;
  }
  return true;
}

function flagModelCooldown(model: string, ms: number = 60000) {
  modelCooldownMap.set(model, Date.now() + ms);
}

// Multi-Turn AI Context-Aware Support Chat Route with Model & Role Configuration
app.post('/api/chat', async (req, res) => {
  const { message, history = [], taskType = 'general', context } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!message && (!Array.isArray(history) || history.length === 0)) {
    return res.status(400).json({ error: 'Message or history is required' });
  }

  // Model selection tailored to task type with resilient fallbacks:
  // - 'complex': gemini-3.1-pro-preview -> gemini-3.8-flash -> gemini-3.5-flash
  // - 'general': gemini-3.8-flash / gemini-3.5-flash -> gemini-3.1-flash-lite
  // - 'fast': gemini-3.1-flash-lite -> gemini-3.8-flash -> gemini-3.5-flash
  let candidateModels: string[];

  if (taskType === 'complex') {
    candidateModels = ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  } else if (taskType === 'fast') {
    candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash'];
  } else {
    // For general tasks, prioritize gemini-3.8-flash and gemini-3.5-flash
    candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  }

  // Sort candidate models so any model currently in 503 cooldown is tried last
  candidateModels.sort((a, b) => {
    const aCool = isModelInCooldown(a) ? 1 : 0;
    const bCool = isModelInCooldown(b) ? 1 : 0;
    return aCool - bCool;
  });

  const isHigh = context?.highRisk || (context?.stressScore && context.stressScore >= 70);

  // Define tailored role-based system instructions
  let systemInstruction = '';
  if (taskType === 'fast') {
    systemInstruction = `You are the MindEase Rapid Grounding Specialist.
Your specific role: Deliver ultra-fast, direct physiological sensory grounding and anxiety de-escalation in 2 to 3 punchy, soothing sentences.
Directives:
- Guide immediate somatic action: 5-4-3-2-1 sensory checks, 4-7-8 breathing counts, unclenching the jaw, lowering shoulders.
- Do not provide long preamble. Jump straight to calming the nervous system.
- Emergency Helpline: 6379234471 available 24/7 if acute crisis.
- Current User: ${context?.userName || 'User'} | Stress Score: ${context?.stressScore ?? 'N/A'}/100 (${context?.stressCategory || 'Normal'}).`;
  } else if (taskType === 'complex') {
    systemInstruction = `You are the MindEase Senior Cognitive & Clinical Wellbeing Specialist.
Your specific role: Conduct in-depth mental wellbeing reflection, analyze speech biomarker contexts, identify underlying cognitive friction (such as catastrophizing, burnout, overthinking), and provide structured cognitive reframing.
Directives:
- Deliver thoughtful, empathetic, multi-layered responses with psychologically sound grounding.
- Provide reflective questions that help the user untangle their emotions.
- Include actionable next steps for emotional resilience and self-compassion.
- Emergency Helpline: 6379234471 available 24/7.
- Current User: ${context?.userName || 'User'} | Stress Score: ${context?.stressScore ?? 'N/A'}/100 (${context?.stressCategory || 'Normal'}).`;
  } else {
    systemInstruction = `You are the MindEase Compassionate Wellbeing Counselor.
Your specific role: Provide empathetic, active listening, gentle validation, and holistic stress-relief strategies.
Directives:
- Validate emotions with genuine warmth, dignity, and care.
- Offer practical everyday stress coping tips (breathwork, pacing, progressive relaxation).
- Keep replies structured, soothing, and easy to read.
- Emergency Helpline: 6379234471 available 24/7.
- Current User: ${context?.userName || 'User'} | Stress Score: ${context?.stressScore ?? 'N/A'}/100 (${context?.stressCategory || 'Normal'}).`;
  }

  // Attempt generation via Gemini API if key is present
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Construct multi-turn contents array preserving full conversation history
      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          if (item && item.content) {
            formattedContents.push({
              role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(item.content) }]
            });
          }
        }
      }

      if (message) {
        formattedContents.push({
          role: 'user',
          parts: [{ text: String(message) }]
        });
      }

      let reply: string | undefined;
      let usedModel = candidateModels[0];

      for (const model of candidateModels) {
        try {
          const generatePromise = ai.models.generateContent({
            model,
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: taskType === 'complex' ? 0.6 : 0.7
            }
          });

          const timeoutMs = model.includes('pro') ? 14000 : 10000;
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout on ${model}`)), timeoutMs)
          );

          const response: any = await Promise.race([generatePromise, timeoutPromise]);
          if (response?.text) {
            reply = response.text;
            usedModel = model;
            break;
          }
        } catch (mErr: any) {
          const errMsg = mErr?.message || String(mErr);
          const isHighDemand = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');
          const isTimeout = errMsg.includes('Timeout') || errMsg.includes('timeout');
          
          if (isHighDemand) {
            flagModelCooldown(model, 90000); // 90s cooldown
            console.info(`Gemini model ${model} temporarily unavailable (503 high demand), smoothly routing to alternate model...`);
          } else if (isTimeout) {
            flagModelCooldown(model, 45000); // 45s cooldown
            console.info(`Gemini model ${model} request exceeded response window, checking next candidate...`);
          } else {
            console.info(`Gemini candidate ${model} note: ${errMsg.slice(0, 100)}`);
          }
        }
      }

      if (reply) {
        const suggestions = isHigh
          ? ['Start 4-7-8 Breathing Guide', 'Try Physiological Sigh', 'Call Helpline: 6379234471']
          : taskType === 'fast'
          ? ['Count 4-7-8 with me', 'Guide 5-4-3-2-1 grounding', 'Release body tension']
          : taskType === 'complex'
          ? ['Help me reframe this thought', 'What are my vocal biomarker trends?', 'Build evening wind-down routine']
          : ['How do my stress metrics look?', 'Give me a 2-minute breathing exercise', 'Explain my pitch stability'];

        return res.json({ 
          reply, 
          model: usedModel,
          taskType,
          suggestions 
        });
      }
    } catch (apiErr) {
      console.error('Gemini chat execution error:', apiErr);
    }
  }

  // Graceful rule-based fallback if offline or quota limit hit
  let fallbackReply = "I am right here with you. Let's take a slow, deep breath together: Inhale for 4 seconds, gently hold for 7, and exhale smoothly for 8.";
  
  const textCheck = (message || '').toLowerCase();
  if (textCheck.includes('help') || textCheck.includes('crisis') || textCheck.includes('emergency')) {
    fallbackReply = "If you are experiencing overwhelming distress, please know you are supported. Call our 24/7 dedicated helpline at 6379234471 immediately for direct compassionate care.";
  } else if (textCheck.includes('breathe') || textCheck.includes('ground') || taskType === 'fast') {
    fallbackReply = "Place both feet flat on the floor. Take a double inhale through the nose, then one long slow sigh out the mouth. Repeat twice to instantly slow heart rate.";
  } else if (taskType === 'complex') {
    fallbackReply = "When stress accumulates, our minds often predict the worst outcomes. Let's separate what is within your direct control today from what isn't, and address each step one by one.";
  }

  return res.json({
    reply: fallbackReply,
    model: 'offline-coping-engine',
    taskType,
    suggestions: isHigh
      ? ['Start 4-7-8 Breathing Guide', 'Call 6379234471', 'Try 5-4-3-2-1 Sensory Grounding']
      : ['Count 4-7-8 with me', 'Explain voice biomarkers', 'Help me relax my mind']
  });
});

// Admin Authentication with Security Token Verification
app.post('/api/admin/login', (req, res) => {
  const { token, name, email, missionPost } = req.body;
  if (!token || String(token).trim() !== '99766') {
    return res.status(401).json({
      success: false,
      error: 'Invalid security token code. Access denied.'
    });
  }

  const existingAdmin = store.getAllUsers().find(u => u.role === 'ADMIN');
  const adminUser = existingAdmin || {
    id: 'usr_admin',
    name: name?.trim() || 'Admin Clinician (Master Supervisor)',
    email: email?.trim() || 'admin@mindease.care',
    role: 'ADMIN',
    phone: '6379234471',
    emergencyPhone: '6379234471',
    emergencyContactName: 'Clinical Operations Duty Desk',
    emergencyContactRelationship: 'Institutional Operations',
    city: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    currentHostCountry: missionPost?.trim() || 'India',
    passportCountry: 'India',
    status: 'ACTIVE'
  };

  res.json({
    success: true,
    user: adminUser
  });
});

// Admin Metrics API
app.get('/api/admin/metrics', (req, res) => {
  res.json(store.getMetrics());
});

// Admin Assessments Log API
app.get('/api/admin/assessments', async (req, res) => {
  try {
    const dbAssessments = await getAllAssessmentsFromDb();
    if (dbAssessments && dbAssessments.length > 0) {
      const mapped = dbAssessments.map(a => ({
        id: a.id,
        userId: a.uid,
        userName: a.userName,
        userEmail: a.userEmail,
        stressScore: a.stressScore,
        stressCategory: a.stressCategory as any,
        transcript: a.transcript,
        audioDuration: (typeof a.audioDuration === 'number' && !isNaN(a.audioDuration)) ? a.audioDuration : 6.5,
        acousticMetrics: {
          speakingWpm: a.speakingWpm || 120,
          pauseLengthSeconds: a.pauseLengthSeconds || 0.8,
          pitchFluctuationHz: a.pitchFluctuationHz || 24,
          vocalTensionScore: a.vocalTensionScore || 45,
          tempoRhythm: a.tempoRhythm || 'Moderate Steady'
        },
        sentimentMetrics: {
          sentimentScore: a.sentimentScore || 0,
          anxietyLexiconScore: a.anxietyLexiconScore || 30,
          fatigueKeywords: [],
          primaryEmotion: a.primaryEmotion || 'Neutral'
        },
        breakdown: a.breakdownJson ? JSON.parse(a.breakdownJson) : [],
        location: a.locationJson ? JSON.parse(a.locationJson) : undefined,
        highRiskFlag: a.highRiskFlag,
        smsStatus: (a.smsStatus || 'PENDING') as any,
        smsSid: a.smsSid || undefined,
        smsRecipient: a.smsRecipient || undefined,
        smsDispatchedAt: a.smsDispatchedAt || undefined,
        emergencyAlertTriggered: a.emergencyAlertTriggered,
        consularAlertTriggered: false,
        createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
      }));
      return res.json(mapped);
    }
  } catch (dbErr) {
    console.error('Failed to load assessments from Cloud SQL:', dbErr);
  }
  const all = store.getAllAssessments();
  res.json(all);
});

// User Assessments Log API
app.get('/api/user/assessments/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const dbAssessments = await getAssessmentsByUidFromDb(userId);
    if (dbAssessments && dbAssessments.length > 0) {
      const mapped = dbAssessments.map(a => ({
        id: a.id,
        userId: a.uid,
        userName: a.userName,
        userEmail: a.userEmail,
        stressScore: a.stressScore,
        stressCategory: a.stressCategory as any,
        transcript: a.transcript,
        audioDuration: (typeof a.audioDuration === 'number' && !isNaN(a.audioDuration)) ? a.audioDuration : 6.5,
        acousticMetrics: {
          speakingWpm: a.speakingWpm || 120,
          pauseLengthSeconds: a.pauseLengthSeconds || 0.8,
          pitchFluctuationHz: a.pitchFluctuationHz || 24,
          vocalTensionScore: a.vocalTensionScore || 45,
          tempoRhythm: a.tempoRhythm || 'Moderate Steady'
        },
        sentimentMetrics: {
          sentimentScore: a.sentimentScore || 0,
          anxietyLexiconScore: a.anxietyLexiconScore || 30,
          fatigueKeywords: [],
          primaryEmotion: a.primaryEmotion || 'Neutral'
        },
        breakdown: a.breakdownJson ? JSON.parse(a.breakdownJson) : [],
        location: a.locationJson ? JSON.parse(a.locationJson) : undefined,
        highRiskFlag: a.highRiskFlag,
        smsStatus: (a.smsStatus || 'PENDING') as any,
        smsSid: a.smsSid || undefined,
        smsRecipient: a.smsRecipient || undefined,
        smsDispatchedAt: a.smsDispatchedAt || undefined,
        emergencyAlertTriggered: a.emergencyAlertTriggered,
        consularAlertTriggered: false,
        createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
      }));
      return res.json(mapped);
    }
  } catch (dbErr) {
    console.error('Failed to load user assessments from Cloud SQL:', dbErr);
  }
  const all = store.getAllAssessments().filter(a => a.userId === userId);
  res.json(all);
});

// Admin Users List API
app.get('/api/admin/users', async (req, res) => {
  try {
    const dbUsers = await getAllUsersFromDb();
    if (dbUsers && dbUsers.length > 0) {
      const mapped = dbUsers.map(u => ({
        id: u.uid,
        name: u.name,
        email: u.email,
        role: (u.role || 'USER') as any,
        phone: u.phone || undefined,
        emergencyPhone: u.emergencyPhone,
        emergencyContactName: u.emergencyContactName || undefined,
        emergencyContactRelationship: u.emergencyContactRelationship || undefined,
        passportCountry: u.passportCountry || undefined,
        city: u.city || undefined,
        region: u.region || undefined,
        country: u.country || undefined,
        location: (u.latitude && u.longitude) ? {
          lat: u.latitude,
          lng: u.longitude,
          accuracy: 12,
          city: u.city || undefined,
          region: u.region || undefined,
          country: u.country || undefined,
          address: u.address || undefined
        } : undefined,
        deviceInfo: u.deviceInfo || undefined,
        ipAddress: u.ipAddress || undefined,
        status: (u.status || 'ACTIVE') as any,
        isOriginalUser: u.isOriginalUser,
        notes: u.notes || undefined,
        registeredAt: u.createdAt ? u.createdAt.toISOString() : undefined
      }));
      return res.json(mapped);
    }
  } catch (dbErr) {
    console.error('Failed to load users from Cloud SQL:', dbErr);
  }
  res.json(store.getAllUsers());
});

// User Sync API - syncs authenticated or modified user profile to in-memory store & Cloud SQL
app.post('/api/user/sync', async (req, res) => {
  const user = req.body as any;
  if (!user || !user.id) {
    return res.status(400).json({ error: 'User data required' });
  }
  const updated = store.upsertUser(user);
  try {
    await getOrCreateUser(user);
  } catch (dbErr) {
    console.error('Failed to sync user to Cloud SQL:', dbErr);
  }
  res.json({ success: true, user: updated });
});

// Twilio Integration Readiness Status
app.get('/api/twilio/status', (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim();
  const isConfigured = !!(accountSid && authToken && fromPhone);

  res.json({
    isConfigured,
    accountSidConfigured: !!accountSid,
    authTokenConfigured: !!authToken,
    phoneNumberConfigured: !!fromPhone,
    fromPhone: fromPhone ? (fromPhone.length > 6 ? `${fromPhone.slice(0, 3)}***${fromPhone.slice(-3)}` : '***') : null,
    crisisRecipient: '+916379234471',
    missing: [
      !accountSid && 'TWILIO_ACCOUNT_SID',
      !authToken && 'TWILIO_AUTH_TOKEN',
      !fromPhone && 'TWILIO_PHONE_NUMBER'
    ].filter(Boolean)
  });
});

// Admin Test Alert Dispatch
app.post('/api/admin/test-alert', async (req, res) => {
  const { phone = '6379234471', name = 'Velayutham S.' } = req.body;
  const formattedTo = toE164(phone || '6379234471');

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

  const testBody = `🚨 [MINDEASE TEST CRISIS ALERT] Test dispatch for user ${name}. Emergency communication link verified with recipient ${formattedTo}. Twilio SMS dispatch test.`;

  if (accountSid && authToken && fromPhone) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', formattedTo);
      if (fromPhone.startsWith('MG')) {
        params.append('MessagingServiceSid', fromPhone);
      } else {
        params.append('From', fromPhone);
      }
      params.append('Body', testBody);

      const twilioRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data: any = await twilioRes.json();
      if (twilioRes.ok) {
        return res.json({
          success: true,
          sid: data.sid,
          message: `Live cellular SMS dispatched successfully to ${formattedTo} (Twilio SID: ${data.sid})`,
          status: 'SENT'
        });
      } else {
        const twilioCode = data.code ? `(Error Code ${data.code}) ` : '';
        const errMsg = `${twilioCode}${data.message || 'Twilio delivery error'}`;
        console.warn('Twilio test alert error:', data);
        return res.json({
          success: false,
          sid: `SM_ERR_${Date.now()}`,
          message: `Twilio delivery failed: ${errMsg}`,
          status: 'FAILED',
          directSmsUri: `sms:${formattedTo}?&body=${encodeURIComponent(testBody)}`
        });
      }
    } catch (err: any) {
      console.error('Twilio network error:', err);
      return res.json({
        success: false,
        sid: `SM_ERR_${Date.now()}`,
        message: `Network error reaching Twilio: ${err.message}`,
        status: 'FAILED',
        directSmsUri: `sms:${formattedTo}?&body=${encodeURIComponent(testBody)}`
      });
    }
  }

  // Not configured in environment variables / Settings
  const sid = `SM_SIM_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  res.json({
    success: false,
    sid,
    message: `Twilio credentials are not configured in Settings / environment. No live cellular SMS was delivered to ${formattedTo}. To enable automatic dispatch, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER. Alternatively, send directly from your device below.`,
    status: 'SIMULATED',
    directSmsUri: `sms:${formattedTo}?&body=${encodeURIComponent(testBody)}`
  });
});

// Reverse Geocoding API (converts GPS coordinates to exact place, address, city, country)
app.get('/api/reverse-geocode', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng query parameters are required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MindEaseWellbeing/1.0 (Clinical Voice Distress & Crisis Geolocation Verification)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }

    const data: any = await response.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county || 'Identified City';
    const region = addr.state || addr.region || addr.state_district || '';
    const country = addr.country || 'India';
    const postalCode = addr.postcode || '';
    const road = addr.road || addr.neighbourhood || addr.suburb || '';
    const formattedAddress = data.display_name || [road, city, region, country].filter(Boolean).join(', ');

    res.json({
      success: true,
      lat,
      lng,
      city,
      region,
      country,
      postalCode,
      address: formattedAddress,
      displayName: data.display_name
    });
  } catch (err: any) {
    console.error('Reverse geocode error:', err);
    res.status(500).json({ error: err.message || 'Reverse geocoding failed' });
  }
});

// IP Geolocation Detection Fallback Endpoint
app.get('/api/detect-ip-location', async (req, res) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '';
    
    // Direct call to IP location service
    const isLocal = !clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
    const ipQueryUrl = isLocal ? 'https://freeipapi.com/api/json' : `https://freeipapi.com/api/json/${clientIp}`;

    const response = await fetch(ipQueryUrl, {
      headers: { 'User-Agent': 'MindEaseWellbeing/1.0' }
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data.latitude && data.longitude) {
        return res.json({
          success: true,
          lat: data.latitude,
          lng: data.longitude,
          city: data.cityName || 'Identified Region',
          region: data.regionName || '',
          country: data.countryName || 'India',
          postalCode: data.zipCode || '',
          address: [data.cityName, data.regionName, data.countryName].filter(Boolean).join(', '),
          ip: data.ipAddress || clientIp,
          accuracy: 5000,
          source: 'NETWORK_IP'
        });
      }
    }
  } catch (e) {
    // Proceed to fallback
  }

  // Sensible default location fallback
  res.json({
    success: true,
    lat: 13.0827,
    lng: 80.2707,
    city: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    address: 'Chennai, Tamil Nadu, India',
    accuracy: 10000,
    source: 'DEFAULT'
  });
});

// Update or Sync User Location in Store
app.post('/api/user/location', (req, res) => {
  const { userId, location } = req.body;
  if (!userId || !location) {
    return res.status(400).json({ error: 'userId and location are required' });
  }

  const existing = store.getUserById(userId);
  if (existing) {
    const updated = store.updateUser(userId, {
      location,
      city: location.city || existing.city,
      region: location.region || existing.region,
      country: location.country || existing.country,
      currentHostCountry: location.country || existing.currentHostCountry,
      lastActive: new Date().toISOString()
    });
    return res.json({ success: true, user: updated });
  } else {
    // Upsert new user record
    const newUser = {
      id: userId,
      name: 'User',
      email: `${userId}@mindease.care`,
      role: 'USER' as const,
      emergencyPhone: '6379234471',
      city: location.city || 'Chennai',
      region: location.region || 'Tamil Nadu',
      country: location.country || 'India',
      currentHostCountry: location.country || 'India',
      passportCountry: location.country || 'India',
      location,
      lastActive: new Date().toISOString()
    };
    store.upsertUser(newUser);
    return res.json({ success: true, user: newUser });
  }
});

// Vite middleware in dev or static serving in prod
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Voice Stress Identification Platform running on port ${PORT}`);
  });
}

setupVite();
