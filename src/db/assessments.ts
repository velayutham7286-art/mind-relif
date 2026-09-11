import { db } from './index.ts';
import { assessments, emergencyAlerts, users } from './schema.ts';
import { desc, eq } from 'drizzle-orm';
import { AssessmentResult } from '../types.ts';

export async function saveAssessmentToDb(asm: AssessmentResult) {
  try {
    // Find relational user ID by Firebase Auth UID if exists
    let userRelationalId: number | undefined;
    try {
      const foundUser = await db.select({ id: users.id }).from(users).where(eq(users.uid, asm.userId)).limit(1);
      if (foundUser.length > 0) {
        userRelationalId = foundUser[0].id;
      }
    } catch {
      // Non-blocking if users table lookup fails
    }

    const inserted = await db.insert(assessments)
      .values({
        id: asm.id,
        userId: userRelationalId,
        uid: asm.userId,
        userEmail: asm.userEmail || 'user@mind-ease.org',
        userName: asm.userName || 'User',
        stressScore: asm.stressScore,
        stressCategory: asm.stressCategory,
        transcript: asm.transcript,
        audioDuration: asm.audioDuration,
        speakingWpm: asm.acousticMetrics?.speakingWpm,
        pauseLengthSeconds: asm.acousticMetrics?.pauseLengthSeconds,
        pitchFluctuationHz: asm.acousticMetrics?.pitchFluctuationHz,
        vocalTensionScore: asm.acousticMetrics?.vocalTensionScore,
        tempoRhythm: asm.acousticMetrics?.tempoRhythm,
        sentimentScore: asm.sentimentMetrics?.sentimentScore,
        anxietyLexiconScore: asm.sentimentMetrics?.anxietyLexiconScore,
        primaryEmotion: asm.sentimentMetrics?.primaryEmotion,
        breakdownJson: JSON.stringify(asm.breakdown || []),
        locationJson: asm.location ? JSON.stringify(asm.location) : undefined,
        highRiskFlag: asm.highRiskFlag,
        smsStatus: asm.smsStatus,
        smsSid: asm.smsSid,
        smsRecipient: asm.smsRecipient,
        smsDispatchedAt: asm.smsDispatchedAt,
        emergencyAlertTriggered: asm.emergencyAlertTriggered || false,
        createdAt: asm.createdAt ? new Date(asm.createdAt) : new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database saveAssessment failed:', error);
    throw new Error('Database operation failed while saving voice assessment.', { cause: error });
  }
}

export async function getAllAssessmentsFromDb() {
  try {
    return await db.select().from(assessments).orderBy(desc(assessments.createdAt));
  } catch (error) {
    console.error('Database getAllAssessments failed:', error);
    throw new Error('Database query failed while fetching assessments.', { cause: error });
  }
}

export async function getAssessmentsByUidFromDb(uid: string) {
  try {
    return await db.select().from(assessments).where(eq(assessments.uid, uid)).orderBy(desc(assessments.createdAt));
  } catch (error) {
    console.error('Database getAssessmentsByUid failed:', error);
    throw new Error('Database query failed while fetching user assessments.', { cause: error });
  }
}

export async function saveEmergencyAlertToDb(alert: {
  userId?: number;
  recipientPhone: string;
  recipientName: string;
  alertMessage: string;
  stressScore?: number;
  status?: string;
}) {
  try {
    const inserted = await db.insert(emergencyAlerts)
      .values({
        userId: alert.userId,
        recipientPhone: alert.recipientPhone,
        recipientName: alert.recipientName,
        alertMessage: alert.alertMessage,
        stressScore: alert.stressScore,
        status: alert.status || 'SENT',
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database saveEmergencyAlert failed:', error);
    throw new Error('Database operation failed while logging emergency alert dispatch.', { cause: error });
  }
}
