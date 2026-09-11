import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';
import { UserProfile } from '../types.ts';

export async function getOrCreateUser(profile: Partial<UserProfile> & { id: string; email: string }) {
  try {
    const result = await db.insert(users)
      .values({
        uid: profile.id,
        name: profile.name || 'Anonymous User',
        email: profile.email,
        role: profile.role || 'USER',
        phone: profile.phone,
        emergencyPhone: profile.emergencyPhone || '6379234471',
        emergencyContactName: profile.emergencyContactName,
        emergencyContactRelationship: profile.emergencyContactRelationship,
        passportCountry: profile.passportCountry,
        city: profile.city || profile.location?.city,
        region: profile.region || profile.location?.region,
        country: profile.country || profile.location?.country,
        address: profile.location?.address,
        latitude: profile.location?.lat,
        longitude: profile.location?.lng,
        deviceInfo: profile.deviceInfo,
        ipAddress: profile.ipAddress,
        status: profile.status || 'ACTIVE',
        isOriginalUser: profile.isOriginalUser || profile.email === 'velayutham7286@gmail.com',
        notes: profile.notes,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          name: profile.name || undefined,
          email: profile.email,
          phone: profile.phone || undefined,
          emergencyPhone: profile.emergencyPhone || undefined,
          emergencyContactName: profile.emergencyContactName || undefined,
          emergencyContactRelationship: profile.emergencyContactRelationship || undefined,
          city: profile.city || profile.location?.city || undefined,
          region: profile.region || profile.location?.region || undefined,
          country: profile.country || profile.location?.country || undefined,
          address: profile.location?.address || undefined,
          latitude: profile.location?.lat || undefined,
          longitude: profile.location?.lng || undefined,
          deviceInfo: profile.deviceInfo || undefined,
          ipAddress: profile.ipAddress || undefined,
          status: profile.status || undefined,
          isOriginalUser: profile.isOriginalUser !== undefined ? profile.isOriginalUser : undefined,
          notes: profile.notes || undefined,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Database operation failed while synchronizing user.', { cause: error });
  }
}

export async function getAllUsersFromDb() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database getAllUsers failed:', error);
    throw new Error('Database query failed while fetching users.', { cause: error });
  }
}

export async function getUserByUidFromDb(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Database getUserByUid failed:', error);
    throw new Error('Database query failed while fetching user profile.', { cause: error });
  }
}
