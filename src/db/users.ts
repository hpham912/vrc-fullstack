import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  photoUrl?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
        role: 'admin', // Authenticated admin users can manage church events and content
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Database user sync failed', { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.uid, uid),
    });
    return user;
  } catch (error) {
    console.error('Database getUserProfile failed:', error);
    throw new Error('Database query failed', { cause: error });
  }
}
