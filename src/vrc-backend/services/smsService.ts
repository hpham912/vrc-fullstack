import twilio, { type Twilio } from 'twilio';

// Sends verification-code SMS via Twilio. Configuration comes from
// environment variables — the credentials are never in code:
//
//   TWILIO_ACCOUNT_SID   — the Twilio account SID
//   TWILIO_AUTH_TOKEN    — the Twilio auth token (keep it secret)
//   TWILIO_PHONE_NUMBER  — the Twilio phone number that sends the
//                          texts (E.164, e.g. +14805550199)
//
// The service is transport-isolated: if the SMS provider ever
// changes, only this file needs to change — the routes and callers
// stay the same.

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

let client: Twilio | null = null;

function getClient(): Twilio | null {
  if (client) return client;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn(
      'SmsService: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER are not set — verification SMS is disabled.',
    );
    return null;
  }
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client;
}

export type VerificationPurpose = 'register' | 'reset';

function buildMessage(code: string, purpose: VerificationPurpose): string {
  const intro =
    purpose === 'register' ? 'Your verification code is' : 'Your password reset code is';
  const introVi =
    purpose === 'register' ? 'Mã xác minh của bạn là' : 'Mã đặt lại mật khẩu của bạn là';
  return (
    `PhucHung AZ: ${intro} ${code}. Valid for 10 minutes. / ` +
    `${introVi} ${code}. Có hiệu lực trong 10 phút.`
  );
}

export const SmsService = {
  isConfigured(): boolean {
    return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
  },

  async sendVerificationCode(phone: string, code: string, purpose: VerificationPurpose): Promise<boolean> {
    const twilioClient = getClient();
    if (!twilioClient) return false;
    try {
      await twilioClient.messages.create({
        from: TWILIO_PHONE_NUMBER,
        to: phone,
        body: buildMessage(code, purpose),
      });
      return true;
    } catch (err) {
      console.error('SmsService: failed to send verification SMS:', err);
      return false;
    }
  },
};
