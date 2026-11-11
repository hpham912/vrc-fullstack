import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { eq } from 'drizzle-orm';
import { db } from '../../vrc-db/index.ts';
import { deviceTokens } from '../../vrc-db/schema.ts';

// Push notifications via Firebase Cloud Messaging (FCM), Android only for
// now (iOS needs the Apple Developer Program). Firebase is used ONLY to
// deliver push messages — all app data stays in Postgres.
//
// Credentials: the server needs a Firebase service account to send FCM
// messages. Two ways, in order:
//   1. FIREBASE_SERVICE_ACCOUNT env var — the service-account JSON as a
//      string (set it in Cloud Run).
//   2. Application Default Credentials — when running on Cloud Run with a
//      service account that has the Firebase Cloud Messaging Admin role.
// If neither is available, push is disabled (logged) and the app keeps
// working — notifications still appear in the in-app list.

let messaging: Messaging | null = null;
let pushInitWarningLogged = false;

function getMessenger(): Messaging | null {
  if (messaging) return messaging;
  try {
    let app: App;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (getApps().length > 0) {
      app = getApps()[0];
    } else if (serviceAccountJson) {
      app = initializeApp({
        credential: cert(JSON.parse(serviceAccountJson)),
      });
    } else {
      // Application Default Credentials (Cloud Run service account).
      app = initializeApp();
    }
    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    if (!pushInitWarningLogged) {
      pushInitWarningLogged = true;
      console.warn(
        'Push notifications disabled: Firebase credentials not available.',
        err instanceof Error ? err.message : err
      );
    }
    return null;
  }
}

export const PushService = {
  // Store (or refresh) a phone's FCM token. Called by the app on launch.
  async registerToken(token: string, platform: string): Promise<boolean> {
    const cleanToken = typeof token === 'string' ? token.trim() : '';
    if (!cleanToken) return false;
    const cleanPlatform = platform === 'ios' ? 'ios' : 'android';
    try {
      await db
        .insert(deviceTokens)
        .values({ token: cleanToken, platform: cleanPlatform, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: deviceTokens.token,
          set: { platform: cleanPlatform, updatedAt: new Date() },
        });
      return true;
    } catch (err) {
      console.error('Failed to register push token:', err);
      return false;
    }
  },

  // Send a push to every registered phone. Called when a notification is
  // created (event, verse, announcement). Fire-and-forget: a push failure
  // never breaks notification creation. Invalid tokens (app uninstalled)
  // are removed so they stop being retried.
  //
  // Android and iOS share this one send path — FCM multicast delivers to
  // both (on iOS it routes through Apple Push). The `platform` column in
  // device_tokens is the record of which phone is which; use
  // sendPushToPlatform to target just one side (for example, to test
  // iOS alone when it is added).
  async sendPushToAll(
    title: string,
    body: string,
    data: Record<string, string>
  ): Promise<void> {
    await this.sendPushToPlatform(null, title, body, data);
  },

  async sendPushToPlatform(
    platform: 'android' | 'ios' | null,
    title: string,
    body: string,
    data: Record<string, string>
  ): Promise<void> {
    const messenger = getMessenger();
    if (!messenger) return;
    try {
      const rows = platform
        ? await db
            .select({ token: deviceTokens.token })
            .from(deviceTokens)
            .where(eq(deviceTokens.platform, platform))
        : await db.select({ token: deviceTokens.token }).from(deviceTokens);
      const tokens = rows.map((row) => row.token).filter(Boolean);
      if (tokens.length === 0) return;

      const response = await messenger.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
        android: { priority: 'high' },
      });

      // Drop tokens FCM says are gone (app uninstalled / token expired).
      const invalidTokens: string[] = [];
      response.responses.forEach((result: { success: boolean; error?: { code?: string } }, index: number) => {
        if (!result.success) {
          const code = result.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(tokens[index]);
          }
        }
      });
      if (invalidTokens.length > 0) {
        for (const token of invalidTokens) {
          await db.delete(deviceTokens).where(eq(deviceTokens.token, token));
        }
      }
      if (response.failureCount > 0) {
        console.warn(
          `Push: ${response.successCount} sent, ${response.failureCount} failed.`
        );
      }
    } catch (err) {
      console.error('Failed to send push notifications:', err);
    }
  },
};
