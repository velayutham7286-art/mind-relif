import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { AssessmentResult, UserProfile } from '../types';

// Initialize Firebase App
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID from config if present
export const db = firebaseConfigData.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Connection test as required by skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();

// Sign In with Google OAuth Popup
export async function signInWithGoogle(emergencyPhone?: string): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Check if profile exists in Firestore, or create new
  const userRef = doc(db, 'users', fbUser.uid);
  let existingProfile: UserProfile | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingProfile = snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore:', err);
  }

  const resolvedPhone = emergencyPhone?.trim() || existingProfile?.phone || fbUser.phoneNumber || '';
  const resolvedName = fbUser.displayName || existingProfile?.name || (fbUser.email ? fbUser.email.split('@')[0] : 'Google User');
  const resolvedEmail = fbUser.email || existingProfile?.email || 'user@gmail.com';

  const profile: UserProfile = {
    id: fbUser.uid,
    name: resolvedName,
    email: resolvedEmail,
    role: 'USER',
    phone: resolvedPhone,
    emergencyPhone: resolvedPhone || existingProfile?.emergencyPhone || '6379234471',
    emergencyContactName: existingProfile?.emergencyContactName || 'Emergency Support Helpline',
    emergencyContactRelationship: existingProfile?.emergencyContactRelationship || 'Direct Care',
    city: existingProfile?.city || 'Chennai',
    region: existingProfile?.region || 'Tamil Nadu',
    country: existingProfile?.country || 'India',
    currentHostCountry: existingProfile?.currentHostCountry || 'India',
    passportCountry: existingProfile?.passportCountry || 'India',
    status: 'ACTIVE',
    location: existingProfile?.location,
    photoURL: fbUser.photoURL || undefined,
    isOriginalUser: resolvedEmail === 'velayutham7286@gmail.com'
  };

  try {
    await setDoc(userRef, {
      ...profile,
      photoURL: fbUser.photoURL || '',
      updatedAt: new Date().toISOString(),
      ...(existingProfile ? {} : { createdAt: new Date().toISOString() })
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to Firestore:', err);
  }

  // Also sync to Cloud SQL / backend store
  try {
    await fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
  } catch (syncErr) {
    console.warn('Sync to backend store:', syncErr);
  }

  return { user: profile, firebaseUser: fbUser };
}

// Direct Sign In with Gmail / Email Address
export async function signInWithGmailAddress(
  email: string,
  name?: string,
  phone?: string
): Promise<{ user: UserProfile }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid Gmail address (e.g. name@gmail.com).');
  }

  // Deterministic user ID for email-based login
  const emailUid = `usr_gmail_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const userRef = doc(db, 'users', emailUid);

  let existingProfile: UserProfile | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingProfile = snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Firestore read error during Gmail login:', err);
  }

  const nameFromEmail = cleanEmail
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  const resolvedName = name?.trim() || existingProfile?.name || nameFromEmail || 'MindEase User';
  const resolvedPhone = phone?.trim() || existingProfile?.phone || '';

  const profile: UserProfile = {
    id: existingProfile?.id || emailUid,
    name: resolvedName,
    email: cleanEmail,
    role: 'USER',
    phone: resolvedPhone,
    emergencyPhone: resolvedPhone || existingProfile?.emergencyPhone || '6379234471',
    emergencyContactName: existingProfile?.emergencyContactName || 'Emergency Support Helpline',
    emergencyContactRelationship: existingProfile?.emergencyContactRelationship || 'Direct Care',
    city: existingProfile?.city || 'Chennai',
    region: existingProfile?.region || 'Tamil Nadu',
    country: existingProfile?.country || 'India',
    currentHostCountry: existingProfile?.currentHostCountry || 'India',
    passportCountry: existingProfile?.passportCountry || 'India',
    status: 'ACTIVE',
    location: existingProfile?.location,
    isOriginalUser: cleanEmail === 'velayutham7286@gmail.com'
  };

  try {
    await setDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
      ...(existingProfile ? {} : { createdAt: new Date().toISOString() })
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }

  // Also sync to Cloud SQL / backend store
  try {
    await fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
  } catch (syncErr) {
    console.warn('Sync to backend store:', syncErr);
  }

  return { user: profile };
}

// Sign out
export async function signOutUser() {
  await signOut(auth);
}

// Save or update user profile
export async function syncUserProfile(profile: UserProfile) {
  const effectiveUid = auth.currentUser?.uid || profile.id;
  if (!effectiveUid) return;
  try {
    const userRef = doc(db, 'users', effectiveUid);
    await setDoc(userRef, {
      ...profile,
      id: effectiveUid,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    console.warn("Notice: Profile synchronization to Firestore:", err?.message || err);
  }
}

// Save Voice Stress Assessment to Firestore
export async function persistAssessment(userId: string, assessment: AssessmentResult) {
  const effectiveUid = auth.currentUser?.uid || userId || 'usr_guest_01';
  try {
    const collRef = collection(db, 'users', effectiveUid, 'assessments');
    await addDoc(collRef, {
      id: assessment.id,
      userId: effectiveUid,
      userName: assessment.userName || '',
      userEmail: assessment.userEmail || '',
      stressScore: assessment.stressScore,
      stressCategory: assessment.stressCategory,
      transcript: assessment.transcript || '',
      audioDuration: assessment.audioDuration || 0,
      acousticMetrics: assessment.acousticMetrics || null,
      sentimentMetrics: assessment.sentimentMetrics || null,
      breakdown: assessment.breakdown || [],
      highRiskFlag: Boolean(assessment.highRiskFlag),
      smsStatus: assessment.smsStatus || 'SIMULATED',
      createdAt: assessment.createdAt || new Date().toISOString()
    });
  } catch (err: any) {
    console.warn("Notice: Assessment persistence to Firestore:", err?.message || err);
  }
}

// Retrieve past assessments for a user
export async function loadUserAssessments(userId: string): Promise<AssessmentResult[]> {
  const effectiveUid = auth.currentUser?.uid || userId || 'usr_guest_01';
  try {
    const collRef = collection(db, 'users', effectiveUid, 'assessments');
    const q = query(collRef, orderBy('createdAt', 'desc'), limit(15));
    const snap = await getDocs(q);
    const results: AssessmentResult[] = [];
    snap.forEach((d) => {
      const data = d.data();
      results.push({
        id: data.id || d.id,
        userId: data.userId || userId,
        userName: data.userName || 'User',
        userEmail: data.userEmail || '',
        stressScore: Number(data.stressScore) || 0,
        stressCategory: data.stressCategory || 'LOW',
        transcript: data.transcript || '',
        audioDuration: Number(data.audioDuration) || 0,
        acousticMetrics: data.acousticMetrics || {
          speakingWpm: 120,
          pauseLengthSeconds: 0.5,
          pitchFluctuationHz: 15,
          vocalTensionScore: 30,
          tempoRhythm: 'Regular'
        },
        sentimentMetrics: data.sentimentMetrics || {
          sentimentScore: 0,
          anxietyLexiconScore: 10,
          fatigueKeywords: [],
          primaryEmotion: 'Calm'
        },
        breakdown: data.breakdown || [],
        highRiskFlag: Boolean(data.highRiskFlag),
        smsStatus: data.smsStatus || 'SIMULATED',
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    return results;
  } catch (err) {
    console.warn("Failed to load assessments from Firestore:", err);
    return [];
  }
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  model: string;
  taskType: 'fast' | 'general' | 'complex';
  timestamp: string;
}

// Save Chat Message to Firestore
export async function persistChatMessage(userId: string, message: ChatHistoryMessage) {
  const effectiveUid = auth.currentUser?.uid || userId || 'usr_guest_01';
  try {
    const collRef = collection(db, 'users', effectiveUid, 'chatMessages');
    await addDoc(collRef, {
      ...message,
      createdAt: message.timestamp || new Date().toISOString()
    });
  } catch (err: any) {
    console.warn("Notice: Chat message persistence to Firestore:", err?.message || err);
  }
}

// Load Chat Messages from Firestore
export async function loadChatHistory(userId: string): Promise<ChatHistoryMessage[]> {
  const effectiveUid = auth.currentUser?.uid || userId || 'usr_guest_01';
  try {
    const collRef = collection(db, 'users', effectiveUid, 'chatMessages');
    const q = query(collRef, orderBy('createdAt', 'asc'), limit(50));
    const snap = await getDocs(q);
    const messages: ChatHistoryMessage[] = [];
    snap.forEach((d) => {
      const data = d.data();
      messages.push({
        id: data.id || d.id,
        role: data.role,
        content: data.content,
        model: data.model || 'gemini-3.5-flash',
        taskType: data.taskType || 'general',
        timestamp: data.createdAt
      });
    });
    return messages;
  } catch (err: any) {
    console.warn("Notice: Load chat history from Firestore:", err?.message || err);
    return [];
  }
}

// Clear Chat History for user
export async function clearChatHistory(userId: string) {
  const effectiveUid = auth.currentUser?.uid || userId || 'usr_guest_01';
  try {
    const collRef = collection(db, 'users', effectiveUid, 'chatMessages');
    const snap = await getDocs(collRef);
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err: any) {
    console.warn("Notice: Clear chat history:", err?.message || err);
  }
}
