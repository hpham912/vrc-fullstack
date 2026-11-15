import nodemailer, { type Transporter } from 'nodemailer';

// Sends verification-code emails from the church's Microsoft 365 account
// (htph@vrcfamily.org) via SMTP. Configuration comes from environment
// variables — the credentials are never in code:
//
//   SMTP_USER  — the church email address (htph@vrcfamily.org)
//   SMTP_PASS  — an app password for that mailbox (MFA must be on;
//                create it on the account's Security info page)
//   SMTP_FROM  — optional display name + address for the From header
//
// NOTE (2026-11-15): Microsoft is retiring Basic Auth for SMTP AUTH —
// it works today, is disabled by default at the end of December 2026
// (an admin can re-enable it), and a final removal date will be
// announced in the second half of 2027. If sending starts failing,
// the fix is to move to OAuth 2.0 / Microsoft Graph, or to switch
// this service to another provider (e.g. Resend) — only this file
// needs to change, the routes and callers stay the same.

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.office365.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('EmailService: SMTP_USER / SMTP_PASS are not set — verification emails are disabled.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // STARTTLS on port 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export type VerificationPurpose = 'register' | 'reset';

const SUBJECTS: Record<VerificationPurpose, string> = {
  register: 'Mã xác minh đăng ký PhucHung AZ / Your PhucHung AZ verification code',
  reset: 'Mã đặt lại mật khẩu PhucHung AZ / Your PhucHung AZ password reset code',
};

function buildBody(code: string, purpose: VerificationPurpose): { text: string; html: string } {
  const introVi =
    purpose === 'register'
      ? 'Cảm ơn bạn đã đăng ký PhucHung AZ. Mã xác minh của bạn là:'
      : 'Bạn đã yêu cầu đặt lại mật khẩu PhucHung AZ. Mã xác minh của bạn là:';
  const introEn =
    purpose === 'register'
      ? 'Thank you for registering for PhucHung AZ. Your verification code is:'
      : 'You requested a password reset for PhucHung AZ. Your verification code is:';
  const text = [
    introVi,
    '',
    code,
    '',
    'Mã này có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.',
    '',
    introEn,
    '',
    code,
    '',
    'This code is valid for 10 minutes. If you did not request this code, please ignore this email.',
    '',
    'Hội Thánh Phục Hưng Việt Nam / Vietnamese Revival Church, Tempe, AZ',
  ].join('\n');
  const html = [
    `<p>${introVi}</p>`,
    `<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>`,
    '<p>Mã này có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>',
    '<hr />',
    `<p>${introEn}</p>`,
    `<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>`,
    '<p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>',
    '<p>Hội Thánh Phục Hưng Việt Nam / Vietnamese Revival Church, Tempe, AZ</p>',
  ].join('\n');
  return { text, html };
}

export const EmailService = {
  isConfigured(): boolean {
    return Boolean(SMTP_USER && SMTP_PASS);
  },

  async sendVerificationCode(email: string, code: string, purpose: VerificationPurpose): Promise<boolean> {
    const transport = getTransporter();
    if (!transport) return false;
    try {
      await transport.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: SUBJECTS[purpose],
        ...buildBody(code, purpose),
      });
      return true;
    } catch (err) {
      console.error('EmailService: failed to send verification email:', err);
      return false;
    }
  },
};
