import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Registered Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('USER'),
  phone: text('phone'),
  emergencyPhone: text('emergency_phone').notNull().default('6379234471'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactRelationship: text('emergency_contact_relationship'),
  passportCountry: text('passport_country'),
  city: text('city'),
  region: text('region'),
  country: text('country'),
  address: text('address'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  deviceInfo: text('device_info'),
  ipAddress: text('ip_address'),
  status: text('status').notNull().default('ACTIVE'),
  isOriginalUser: boolean('is_original_user').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Acoustic Voice Stress Assessments Table
export const assessments = pgTable('assessments', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  uid: text('uid').notNull(), // Firebase Auth UID for direct matching
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  stressScore: integer('stress_score').notNull(),
  stressCategory: text('stress_category').notNull(),
  transcript: text('transcript').notNull(),
  audioDuration: real('audio_duration').notNull(),
  speakingWpm: real('speaking_wpm'),
  pauseLengthSeconds: real('pause_length_seconds'),
  pitchFluctuationHz: real('pitch_fluctuation_hz'),
  vocalTensionScore: real('vocal_tension_score'),
  tempoRhythm: text('tempo_rhythm'),
  sentimentScore: real('sentiment_score'),
  anxietyLexiconScore: real('anxiety_lexicon_score'),
  primaryEmotion: text('primary_emotion'),
  breakdownJson: text('breakdown_json'),
  locationJson: text('location_json'),
  highRiskFlag: boolean('high_risk_flag').notNull().default(false),
  smsStatus: text('sms_status').notNull().default('PENDING'),
  smsSid: text('sms_sid'),
  smsRecipient: text('sms_recipient'),
  smsDispatchedAt: text('sms_dispatched_at'),
  emergencyAlertTriggered: boolean('emergency_alert_triggered').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Emergency Alert Dispatch Log
export const emergencyAlerts = pgTable('emergency_alerts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  recipientPhone: text('recipient_phone').notNull(),
  recipientName: text('recipient_name').notNull(),
  alertMessage: text('alert_message').notNull(),
  stressScore: integer('stress_score'),
  status: text('status').notNull().default('SENT'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
  emergencyAlerts: many(emergencyAlerts),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
}));

export const emergencyAlertsRelations = relations(emergencyAlerts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyAlerts.userId],
    references: [users.id],
  }),
}));
