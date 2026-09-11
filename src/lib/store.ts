import { AssessmentResult, AdminMetrics, UserProfile } from '../types';

// Default current user with comprehensive identity & location
export const initialUser: UserProfile = {
  id: 'usr_guest_01',
  name: 'Velayutham S.',
  email: 'velayutham7286@gmail.com',
  role: 'USER',
  phone: '+91 98401 23456',
  emergencyPhone: '6379234471',
  emergencyContactName: 'Dr. A. Ramanathan',
  emergencyContactRelationship: 'Primary Care Physician / Family',
  city: 'Chennai',
  region: 'Tamil Nadu',
  country: 'India',
  currentHostCountry: 'India',
  passportCountry: 'India',
  location: {
    lat: 13.0827,
    lng: 80.2707,
    accuracy: 12,
    city: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    address: 'Anna Salai, Guindy, Chennai, TN 600032',
    ip: '157.48.21.14'
  },
  registeredAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  lastActive: new Date().toISOString(),
  deviceInfo: 'Chrome 128 / macOS Sequoia',
  ipAddress: '157.48.21.14 (Airtel Broadband, Chennai)',
  status: 'ACTIVE',
  isOriginalUser: true,
  notes: 'Original registered primary account holder for automated acoustic voice stress analysis and crisis monitoring.'
};

// Initial realistic assessments for instant analysis & admin dashboard viewing
export const initialAssessments: AssessmentResult[] = [
  {
    id: 'asm_7718',
    userId: 'usr_guest_01',
    userName: 'Velayutham S.',
    userEmail: 'velayutham7286@gmail.com',
    location: {
      lat: 13.0827,
      lng: 80.2707,
      accuracy: 12,
      city: 'Chennai',
      region: 'Tamil Nadu',
      country: 'India',
      address: 'Anna Salai, Guindy, Chennai, TN 600032'
    },
    stressScore: 28,
    stressCategory: 'LOW',
    transcript: "Enjoying a tranquil Sunday morning. Completed my morning meditation and feeling completely at ease with my schedule.",
    audioDuration: 7.2,
    acousticMetrics: {
      speakingWpm: 124,
      pauseLengthSeconds: 1.4,
      pitchFluctuationHz: 19.5,
      vocalTensionScore: 22,
      tempoRhythm: 'Smooth, rhythmic phonation with natural relaxed cadences'
    },
    sentimentMetrics: {
      sentimentScore: 0.86,
      anxietyLexiconScore: 8,
      fatigueKeywords: [],
      primaryEmotion: 'Calm & Contentment'
    },
    breakdown: [
      {
        id: 'bk-1',
        title: 'Speech Velocity & Pacing',
        metric: '124 WPM',
        observation: 'Ideal conversational cadence with deep diaphragmatic respiratory support.',
        indicator: 'low',
        detail: 'Normal vocal fold vibration with steady harmonics.'
      },
      {
        id: 'bk-2',
        title: 'Vocal Pitch Fluctuation',
        metric: '19.5 Hz Variance',
        observation: 'Harmonic pitch stability within optimal conversational registers.',
        indicator: 'low',
        detail: 'Absence of acoustic vocal tremor or pitch instability.'
      }
    ],
    highRiskFlag: false,
    smsStatus: 'SKIPPED',
    consularAlertTriggered: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
  },
  {
    id: 'asm_7719_user',
    userId: 'usr_guest_01',
    userName: 'Velayutham S.',
    userEmail: 'velayutham7286@gmail.com',
    location: {
      lat: 13.0827,
      lng: 80.2707,
      accuracy: 15,
      city: 'Chennai',
      region: 'Tamil Nadu',
      country: 'India',
      address: 'Anna Salai, Guindy, Chennai, TN 600032'
    },
    stressScore: 56,
    stressCategory: 'MEDIUM',
    transcript: "Busy workday with back-to-back reviews. Pacing myself, but feeling some cognitive fatigue and neck stiffness starting to build up.",
    audioDuration: 8.0,
    acousticMetrics: {
      speakingWpm: 158,
      pauseLengthSeconds: 1.8,
      pitchFluctuationHz: 39.2,
      vocalTensionScore: 54,
      tempoRhythm: 'Slightly hurried articulation with mild vocal cord strain'
    },
    sentimentMetrics: {
      sentimentScore: -0.25,
      anxietyLexiconScore: 46,
      fatigueKeywords: ['fatigue', 'stiffness', 'busy'],
      primaryEmotion: 'Workplace Strain & Fatigue'
    },
    breakdown: [
      {
        id: 'bk-1',
        title: 'Speech Pacing',
        metric: '158 WPM',
        observation: 'Accelerated articulation reflecting task load and deadline focus.',
        indicator: 'medium',
        detail: 'Moderate reduction in breath pause intervals.'
      },
      {
        id: 'bk-2',
        title: 'Pitch Contour',
        metric: '39.2 Hz Fluctuation',
        observation: 'Slight pitch jitter detected during emphasis on workload words.',
        indicator: 'medium',
        detail: 'Vocal cords demonstrate mild strain.'
      }
    ],
    highRiskFlag: false,
    smsStatus: 'SKIPPED',
    consularAlertTriggered: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 24 hours ago
  },
  {
    id: 'asm_7720_user',
    userId: 'usr_guest_01',
    userName: 'Velayutham S.',
    userEmail: 'velayutham7286@gmail.com',
    location: {
      lat: 13.0827,
      lng: 80.2707,
      accuracy: 10,
      city: 'Chennai',
      region: 'Tamil Nadu',
      country: 'India',
      address: 'T. Nagar, Chennai, TN 600017'
    },
    stressScore: 42,
    stressCategory: 'MEDIUM',
    transcript: "Taking an evening break after dinner. Did some box breathing exercises, tension has decreased significantly.",
    audioDuration: 6.8,
    acousticMetrics: {
      speakingWpm: 136,
      pauseLengthSeconds: 1.6,
      pitchFluctuationHz: 27.8,
      vocalTensionScore: 38,
      tempoRhythm: 'Balanced evening cadence with steady exhalations'
    },
    sentimentMetrics: {
      sentimentScore: 0.35,
      anxietyLexiconScore: 24,
      fatigueKeywords: ['tension'],
      primaryEmotion: 'Active Grounding & Recovery'
    },
    breakdown: [
      {
        id: 'bk-1',
        title: 'Speech Cadence',
        metric: '136 WPM',
        observation: 'Recovery to steady baseline speech rhythm.',
        indicator: 'low',
        detail: 'Effective physiological down-regulation.'
      }
    ],
    highRiskFlag: false,
    smsStatus: 'SKIPPED',
    consularAlertTriggered: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  },
  {
    id: 'asm_7721',
    userId: 'usr_78912',
    userName: 'Alexander Wright',
    userEmail: 'alex.wright@crisiscare.uk',
    location: {
      lat: 51.5074,
      lng: -0.1278,
      accuracy: 18,
      city: 'London',
      region: 'Greater London',
      country: 'United Kingdom',
      address: 'Holborn Viaduct, Camden, London EC1A 2FD'
    },
    stressScore: 82,
    stressCategory: 'HIGH',
    transcript: "I am experiencing intense pressure with upcoming deadlines. My chest feels tight, my pulse is racing, and I'm struggling to breathe evenly. I feel overwhelmed and anxious.",
    audioDuration: 9.4,
    acousticMetrics: {
      speakingWpm: 198,
      pauseLengthSeconds: 2.8,
      pitchFluctuationHz: 68.4,
      vocalTensionScore: 84,
      tempoRhythm: 'Hurried, frequent micro-pauses with elevated pitch jitter'
    },
    sentimentMetrics: {
      sentimentScore: -0.78,
      anxietyLexiconScore: 88,
      fatigueKeywords: ['overwhelmed', 'tight', 'anxious', 'pressure'],
      primaryEmotion: 'Acute Anxiety & Distress'
    },
    breakdown: [
      {
        id: 'bk-1',
        title: 'Speech Velocity & Pacing',
        metric: '198 WPM',
        observation: 'Substantially elevated speech rate (+38% above baseline), indicative of acute sympathetic nervous system arousal.',
        indicator: 'high',
        detail: 'Rapid sentence delivery combined with shallow breath cadences.'
      },
      {
        id: 'bk-2',
        title: 'Vocal Cord Tension & Pitch Variance',
        metric: '68.4 Hz Fluctuation',
        observation: 'High frequency jitter and vocal tremor detected across syllable transitions.',
        indicator: 'high',
        detail: 'Micro-tremor in vowel phonemes corresponds to vocal fold hyper-adduction.'
      },
      {
        id: 'bk-3',
        title: 'Linguistic Distress Markers',
        metric: '88% Anxiety Index',
        observation: 'Prevalence of vulnerability terminology and acute panic cues.',
        indicator: 'high',
        detail: 'Repeated mentions of physical constriction, racing heart, and cognitive overwhelm.'
      },
      {
        id: 'bk-4',
        title: 'Emergency Contact & Helpline Alert',
        metric: 'Helpline Dispatched',
        observation: 'Emergency contact alerted via Twilio SMS protocol. Immediate helpline and grounding protocols activated.',
        indicator: 'high',
        detail: 'Direct access provided to 24/7 Helpline (6379234471) and physiological sigh reset.'
      }
    ],
    highRiskFlag: true,
    smsStatus: 'SIMULATED',
    smsSid: 'SM_SIM_992014881023',
    smsRecipient: '6379234471',
    smsDispatchedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    consularAlertTriggered: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'asm_7720',
    userId: 'usr_33109',
    userName: 'David Miller',
    userEmail: 'd.miller@caremail.org',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      accuracy: 16,
      city: 'San Francisco',
      region: 'California',
      country: 'United States',
      address: 'Market St, Financial District, SF, CA 94103'
    },
    stressScore: 54,
    stressCategory: 'MEDIUM',
    transcript: "Checking in after 12 hours of back-to-back presentations. Feeling tired and my voice is raspy, but taking a hydration break now.",
    audioDuration: 8.1,
    acousticMetrics: {
      speakingWpm: 142,
      pauseLengthSeconds: 1.9,
      pitchFluctuationHz: 34.2,
      vocalTensionScore: 52,
      tempoRhythm: 'Slightly irregular tempo with vocal fatigue dips'
    },
    sentimentMetrics: {
      sentimentScore: -0.32,
      anxietyLexiconScore: 48,
      fatigueKeywords: ['exhausted', 'tired', 'presentations'],
      primaryEmotion: 'Physical Fatigue & Mild Cognitive Strain'
    },
    breakdown: [
      {
        id: 'bk-1',
        title: 'Speech Velocity & Pacing',
        metric: '142 WPM',
        observation: 'Normal to slightly sluggish delivery punctuated by long exhalations.',
        indicator: 'medium',
        detail: 'Cadence reflects cognitive tiredness rather than acute crisis.'
      },
      {
        id: 'bk-2',
        title: 'Vocal Cord Tension',
        metric: '34.2 Hz Pitch Spread',
        observation: 'Flattened pitch contour characteristic of prolonged physical fatigue.',
        indicator: 'medium',
        detail: 'Moderate vocal fry and lowered fundamental frequency.'
      },
      {
        id: 'bk-3',
        title: 'Linguistic Tone',
        metric: '48% Strain',
        observation: 'Fatigue keywords detected, but situational coping remains intact.',
        indicator: 'medium',
        detail: 'Speaker expressing exhaustion without panic or immediate crisis.'
      }
    ],
    highRiskFlag: false,
    smsStatus: 'SKIPPED',
    consularAlertTriggered: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'asm_7719',
    userId: 'usr_44018',
    userName: 'Kavita Rao',
    userEmail: 'kavita.rao@healthnet.in',
    location: {
      lat: 12.9716,
      lng: 77.5946,
      accuracy: 14,
      city: 'Bengaluru',
      region: 'Karnataka',
      country: 'India',
      address: 'Koramangala 4th Block, Bengaluru, KA 560034'
    },
    stressScore: 22,
    stressCategory: 'LOW',
    transcript: "Finished my morning mindfulness routine and ready for the day ahead. Speaking calmly and feeling centered.",
    audioDuration: 6.8,
    acousticMetrics: {
      speakingWpm: 126,
      pauseLengthSeconds: 1.1,
      pitchFluctuationHz: 18.1,
      vocalTensionScore: 20,
      tempoRhythm: 'Steady, relaxed cadence with rhythmic pauses'
    },
    sentimentMetrics: {
      sentimentScore: 0.82,
      anxietyLexiconScore: 12,
      fatigueKeywords: [],
      primaryEmotion: 'Calm & Reassured'
    },
    breakdown: [
      {
        id: 'bk-1',
        title: 'Speech Velocity & Pacing',
        metric: '126 WPM',
        observation: 'Equable, steady speech tempo consistent with relaxed breathing.',
        indicator: 'low',
        detail: 'Natural pause placement at syntactic boundaries.'
      },
      {
        id: 'bk-2',
        title: 'Vocal Cord Tension',
        metric: '18.1 Hz Pitch Variance',
        observation: 'Harmonious formant distribution with no detectable jitter or tremor.',
        indicator: 'low',
        detail: 'Relaxed larynx posture and smooth phonation.'
      },
      {
        id: 'bk-3',
        title: 'Linguistic Sentiment',
        metric: 'Positive (0.82)',
        observation: 'Content reflects positive emotional orientation and confidence.',
        indicator: 'low',
        detail: 'No distress or anxiety cues reported.'
      }
    ],
    highRiskFlag: false,
    smsStatus: 'SKIPPED',
    consularAlertTriggered: false,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

// Global in-memory storage singleton for runtime
class AssessmentStore {
  private assessments: AssessmentResult[] = [...initialAssessments];
  private users: UserProfile[] = [
    initialUser,
    {
      id: 'usr_78912',
      name: 'Alexander Wright',
      email: 'alex.wright@crisiscare.uk',
      role: 'USER',
      phone: '+44 7700 900821',
      emergencyPhone: '6379234471',
      emergencyContactName: 'Elena Wright',
      emergencyContactRelationship: 'Mother / Emergency Guardian',
      city: 'London',
      region: 'Greater London',
      country: 'United Kingdom',
      currentHostCountry: 'United Kingdom',
      passportCountry: 'United Kingdom',
      location: {
        lat: 51.5074,
        lng: -0.1278,
        accuracy: 18,
        city: 'London',
        region: 'Greater London',
        country: 'United Kingdom',
        address: 'Holborn Viaduct, Camden, London EC1A 2FD',
        ip: '82.165.197.10'
      },
      registeredAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
      lastActive: new Date(Date.now() - 3600000 * 2).toISOString(),
      deviceInfo: 'Firefox 130 / Ubuntu Linux 24.04',
      ipAddress: '82.165.197.10 (BT Internet, London)',
      status: 'HIGH_RISK',
      notes: 'Acute stress alert triggered. Twilio SMS dispatched to 6379234471.'
    },
    {
      id: 'usr_33109',
      name: 'David Miller',
      email: 'd.miller@caremail.org',
      role: 'USER',
      phone: '+1 (415) 890-3321',
      emergencyPhone: '6379234471',
      emergencyContactName: 'Sarah Miller',
      emergencyContactRelationship: 'Spouse',
      city: 'San Francisco',
      region: 'California',
      country: 'United States',
      currentHostCountry: 'United States',
      passportCountry: 'United States',
      location: {
        lat: 37.7749,
        lng: -122.4194,
        accuracy: 16,
        city: 'San Francisco',
        region: 'California',
        country: 'United States',
        address: 'Market St, Financial District, SF, CA 94103',
        ip: '104.132.89.54'
      },
      registeredAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
      lastActive: new Date(Date.now() - 3600000 * 18).toISOString(),
      deviceInfo: 'Safari 18 / iOS 18 (iPhone 16 Pro)',
      ipAddress: '104.132.89.54 (Comcast Cable, San Francisco)',
      status: 'MONITORED',
      notes: 'Frequent presentations, vocal fatigue recorded periodically.'
    },
    {
      id: 'usr_44018',
      name: 'Kavita Rao',
      email: 'kavita.rao@healthnet.in',
      role: 'USER',
      phone: '+91 94440 88219',
      emergencyPhone: '6379234471',
      emergencyContactName: 'Rajesh Rao',
      emergencyContactRelationship: 'Brother',
      city: 'Bengaluru',
      region: 'Karnataka',
      country: 'India',
      currentHostCountry: 'India',
      passportCountry: 'India',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        accuracy: 14,
        city: 'Bengaluru',
        region: 'Karnataka',
        country: 'India',
        address: 'Koramangala 4th Block, Bengaluru, KA 560034',
        ip: '49.207.182.90'
      },
      registeredAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
      lastActive: new Date(Date.now() - 3600000 * 36).toISOString(),
      deviceInfo: 'Edge 128 / Windows 11',
      ipAddress: '49.207.182.90 (Jio Fiber, Bengaluru)',
      status: 'ACTIVE',
      notes: 'Mindfulness practitioner, consistent low vocal tension.'
    },
    {
      id: 'usr_admin',
      name: 'Admin Clinician (Master Supervisor)',
      email: 'admin@mindease.care',
      role: 'ADMIN',
      phone: '6379234471',
      emergencyPhone: '6379234471',
      emergencyContactName: 'Clinical Operations Duty Desk',
      emergencyContactRelationship: 'Institutional Operations',
      city: 'Chennai',
      region: 'Tamil Nadu',
      country: 'India',
      currentHostCountry: 'India',
      passportCountry: 'India',
      location: {
        lat: 13.0827,
        lng: 80.2707,
        accuracy: 5,
        city: 'Chennai',
        region: 'Tamil Nadu',
        country: 'India',
        address: 'Medical Operations Hub, Chennai, TN',
        ip: '157.48.21.1'
      },
      registeredAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
      lastActive: new Date().toISOString(),
      deviceInfo: 'Chrome 128 / macOS Sequoia',
      ipAddress: '157.48.21.1 (Static Clinic Gateway)',
      status: 'ACTIVE',
      notes: 'System administrator with crisis intervention and SMS dispatch authority.'
    }
  ];

  getAllAssessments(): AssessmentResult[] {
    return this.assessments;
  }

  getAssessmentById(id: string): AssessmentResult | undefined {
    return this.assessments.find(a => a.id === id);
  }

  addAssessment(assessment: AssessmentResult): void {
    this.assessments.unshift(assessment);
  }

  getAllUsers(): UserProfile[] {
    return this.users;
  }

  getUserById(id: string): UserProfile | undefined {
    return this.users.find(u => u.id === id);
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      return this.users[idx];
    }
    return undefined;
  }

  upsertUser(user: UserProfile): UserProfile {
    const idx = this.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...user };
      return this.users[idx];
    } else {
      this.users.unshift(user);
      return user;
    }
  }

  getMetrics(): AdminMetrics {
    const totalUsers = this.users.length;
    const completedAssessments = this.assessments.length;
    const highRiskFlags = this.assessments.filter(a => a.highRiskFlag).length;
    const averageStressScore = completedAssessments > 0
      ? Math.round(this.assessments.reduce((acc, curr) => acc + curr.stressScore, 0) / completedAssessments)
      : 0;

    return {
      totalUsers,
      completedAssessments,
      highRiskFlags,
      averageStressScore
    };
  }
}

export const store = new AssessmentStore();
