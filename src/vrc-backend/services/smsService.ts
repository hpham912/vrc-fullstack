import twilio, { type Twilio } from 'twilio';
import { ConfigService } from './configService.ts';

// Sends verification-code SMS via Twilio. Configuration is read from
// the church_info document in Postgres (twilioAccountSid,
// twilioAuthToken, twilioPhoneNumber — set via SQL, see
// src/vrc-db/sql/twilio-config-set-values.sql), with environment
// variables as a fallback when set:
//
//   TWILIO_ACCOUNT_SID   — the Twilio account SID
//   TWILIO_AUTH_TOKEN    — the Twilio auth token (keep it secret)
//   TWILIO_PHONE_NUMBER  — the Twilio phone number that sends the
//                          texts (E.164, e.g. +14805550199)
//
// The database is the source of truth because the Cloud Run service
// cannot be updated with env vars from this account (deployments
// using end-user credentials are not allowed). The credentials are
// never in code, and never sent to the app — the public
// GET /api/church-info response strips them. They are loaded once
// and cached in memory for the life of the server process, so the
// database is only read on the first SMS send.
//
// The service is transport-isolated: if the SMS provider ever
// changes, only this file needs to change — the routes and callers
// stay the same.

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

// Loaded once and kept in the server's memory for the life of the
// process ("current session") — the secrets are fetched a single time
// (env vars + church_info) and reused, so later sends never go back
// to the database. A changed value in church_info takes effect on
// the next server restart. An incomplete result is NOT cached, so a
// send attempted before the values are set retries the database on
// the next send instead of staying disabled.
let cachedConfig: TwilioConfig | null = null;

async function getTwilioConfig(): Promise<TwilioConfig> {
  if (cachedConfig) return cachedConfig;
  // Env vars win when set; any missing value is read from church_info.
  let accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  let authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  let phoneNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  if (!accountSid || !authToken || !phoneNumber) {
    const churchInfo = await ConfigService.getChurchInfo();
    if (churchInfo) {
      if (!accountSid) accountSid = (churchInfo.twilioAccountSid || '').trim();
      if (!authToken) authToken = (churchInfo.twilioAuthToken || '').trim();
      if (!phoneNumber) phoneNumber = (churchInfo.twilioPhoneNumber || '').trim();
    }
  }
  const config = { accountSid, authToken, phoneNumber };
  if (config.accountSid && config.authToken && config.phoneNumber) {
    cachedConfig = config;
  }
  return config;
}

let cachedClient: Twilio | null = null;

async function getTwilio(): Promise<{ client: Twilio; phoneNumber: string } | null> {
  if (cachedClient && cachedConfig) {
    return { client: cachedClient, phoneNumber: cachedConfig.phoneNumber };
  }
  const config = await getTwilioConfig();
  if (!config.accountSid || !config.authToken || !config.phoneNumber) {
    console.warn(
      'SmsService: Twilio is not configured — set the twilio fields in church_info (or the TWILIO_* env vars) — verification SMS is disabled.',
    );
    return null;
  }
  cachedClient = twilio(config.accountSid, config.authToken);
  return { client: cachedClient, phoneNumber: config.phoneNumber };
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
  async sendVerificationCode(phone: string, code: string, purpose: VerificationPurpose): Promise<boolean> {
    const twilioConn = await getTwilio();
    if (!twilioConn) return false;
    try {
      await twilioConn.client.messages.create({
        from: twilioConn.phoneNumber,
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
