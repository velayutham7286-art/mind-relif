export type UserRole = 'USER' | 'ADMIN';
export type StressCategory = 'LOW' | 'MEDIUM' | 'HIGH';
export type SmsStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SIMULATED' | 'SKIPPED';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
  postalCode?: string;
  ip?: string;
  source?: 'GPS' | 'NETWORK_IP' | 'MANUAL' | 'DEFAULT';
  detectedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  photoURL?: string;
  phone?: string;
  emergencyPhone: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  passportCountry?: string;
  currentHostCountry?: string;
  city?: string;
  region?: string;
  country?: string;
  location?: LocationData;
  registeredAt?: string;
  lastActive?: string;
  deviceInfo?: string;
  ipAddress?: string;
  status?: 'ACTIVE' | 'HIGH_RISK' | 'MONITORED';
  isOriginalUser?: boolean;
  notes?: string;
}

export interface AcousticMetrics {
  speakingWpm: number;
  pauseLengthSeconds: number;
  pitchFluctuationHz: number;
  vocalTensionScore: number;
  tempoRhythm: string;
}

export interface SentimentMetrics {
  sentimentScore: number; // -1 to +1
  anxietyLexiconScore: number; // 0 to 100
  fatigueKeywords: string[];
  primaryEmotion: string;
}

export interface ExplanationCard {
  id: string;
  title: string;
  metric: string;
  observation: string;
  indicator: 'low' | 'medium' | 'high';
  detail: string;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location?: LocationData;
  stressScore: number; // 0 - 100
  stressCategory: StressCategory;
  transcript: string;
  audioDuration: number;
  acousticMetrics: AcousticMetrics;
  sentimentMetrics: SentimentMetrics;
  breakdown: ExplanationCard[];
  highRiskFlag: boolean;
  smsStatus: SmsStatus;
  smsSid?: string;
  smsRecipient?: string;
  smsDispatchedAt?: string;
  smsError?: string;
  smsBody?: string;
  emergencyAlertTriggered?: boolean;
  consularAlertTriggered?: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  notifyOnHighRisk: boolean;
}

export interface AdminMetrics {
  totalUsers: number;
  completedAssessments: number;
  highRiskFlags: number;
  averageStressScore: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestions?: string[];
  isGroundingAction?: boolean;
}
