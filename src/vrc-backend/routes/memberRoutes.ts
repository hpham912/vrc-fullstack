import { randomInt } from 'crypto';
import { Router } from 'express';
import { and, desc, eq, lt } from 'drizzle-orm';
import { db } from '../../vrc-db/index.ts';
import { members, phoneVerifications } from '../../vrc-db/schema.ts';
import { AuthService } from '../services/authService.ts';
import { SmsService } from '../services/smsService.ts';
import { rateLimiter } from '../middleware/securityMiddleware.ts';
import { normalizeEmail, normalizeName, normalizePhone } from '../utils/memberValidation.ts';

const router = Router();

// Sending a code is the abuse-sensitive step (SMS bombing), so it is
// rate-limited tighter than login: 5 code sends per 15 minutes per IP.
const codeRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many code requests. Please wait 15 minutes before trying again.',
});

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const CODE_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// Delete every verification code whose expiry has passed, so expired
// codes never sit in the table. Runs whenever a code is issued or
// checked — a single cheap query. Never throws: a prune failure must
// not block issuing or checking a code.
async function pruneExpiredCodes(): Promise<void> {
  try {
    await db.delete(phoneVerifications).where(lt(phoneVerifications.expiresAt, new Date()));
  } catch (err) {
    console.warn('Verification code prune warning:', err);
  }
}

// Stores a fresh hashed code for the phone + purpose, deleting any older
// ones so only the latest code is valid. Returns the plain code (to text
// it) or null when the resend cooldown is still active.
async function issueCode(phone: string, purpose: 'register' | 'reset'): Promise<string | null> {
  // Sweep every expired code first, so an abandoned code never sits
  // in the table once its 10 minutes are up.
  await pruneExpiredCodes();
  const latest = await db
    .select()
    .from(phoneVerifications)
    .where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.purpose, purpose)))
    .orderBy(desc(phoneVerifications.createdAt))
    .limit(1);
  if (latest.length > 0) {
    const createdAt = latest[0].createdAt ? new Date(latest[0].createdAt).getTime() : 0;
    if (Date.now() - createdAt < RESEND_COOLDOWN_MS) return null;
  }

  const code = String(randomInt(100000, 1000000));
  const { hash, salt } = AuthService.hashPassword(code);
  await db
    .delete(phoneVerifications)
    .where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.purpose, purpose)));
  await db.insert(phoneVerifications).values({
    phone,
    codeHash: hash,
    codeSalt: salt,
    purpose,
    expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
    attempts: 0,
  });
  return code;
}

// Checks the latest code for the phone + purpose. Returns 'ok', or a
// bilingual error string when the code is missing, expired, used up,
// or wrong (a wrong guess counts as an attempt).
async function checkCode(
  phone: string,
  purpose: 'register' | 'reset',
  code: string,
): Promise<'ok' | string> {
  const latest = await db
    .select()
    .from(phoneVerifications)
    .where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.purpose, purpose)))
    .orderBy(desc(phoneVerifications.createdAt))
    .limit(1);
  if (latest.length === 0) {
    return 'Mã xác minh không tồn tại. Vui lòng yêu cầu mã mới. / No verification code found. Please request a new code.';
  }
  const row = latest[0];
  if (row.attempts >= CODE_MAX_ATTEMPTS) {
    return 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới. / Too many wrong attempts. Please request a new code.';
  }
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
    // Expired — remove this row now so it never sits in the table,
    // then tell the user to request a fresh code.
    await db.delete(phoneVerifications).where(eq(phoneVerifications.id, row.id));
    return 'Mã đã hết hạn. Vui lòng yêu cầu mã mới. / This code has expired. Please request a new code.';
  }
  const isMatch = AuthService.verifyPassword(code, row.codeHash, row.codeSalt);
  if (!isMatch) {
    await db
      .update(phoneVerifications)
      .set({ attempts: row.attempts + 1 })
      .where(eq(phoneVerifications.id, row.id));
    return 'Mã không đúng. Vui lòng thử lại. / Incorrect code. Please try again.';
  }
  return 'ok';
}

async function clearCodes(phone: string, purpose: 'register' | 'reset') {
  await db
    .delete(phoneVerifications)
    .where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.purpose, purpose)));
}

function toPublicMember(member: typeof members.$inferSelect) {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone,
    email: member.email,
    phoneVerified: member.phoneVerified,
    role: member.role,
    createdAt: member.createdAt,
    lastLoginAt: member.lastLoginAt,
  };
}

function toToken(member: typeof members.$inferSelect) {
  return AuthService.createToken({
    id: member.id,
    username: member.phone,
    displayName: `${member.firstName} ${member.lastName}`,
    role: member.role,
  });
}

// POST /api/members/register — start registration. Validates the fields,
// creates (or refreshes) an unverified member row, and texts a 6-digit
// code to the phone. Email is OPTIONAL (contact only, never verified).
// If the phone (or the provided email) already belongs to a VERIFIED
// member, the registration is refused; if it belongs to an UNVERIFIED
// member (a registration that was never finished), the row is updated
// and a fresh code is sent.
router.post('/register', codeRateLimiter, async (req, res) => {
  try {
    const firstName = normalizeName(req.body?.firstName);
    const lastName = normalizeName(req.body?.lastName);
    const phone = normalizePhone(req.body?.phone);
    const emailRaw = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    // Email is optional: blank is fine, but a provided email must be valid.
    const email = emailRaw === '' ? null : normalizeEmail(emailRaw);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!firstName || !lastName || !phone || password.length < 6) {
      return res.status(400).json({
        error:
          'Vui lòng nhập họ tên (chỉ chữ cái), số điện thoại Mỹ và mật khẩu từ 6 ký tự. / Please enter a first and last name (letters only), a US phone number and a password of at least 6 characters.',
      });
    }
    if (emailRaw !== '' && email === null) {
      return res.status(400).json({
        error: 'Vui lòng nhập email hợp lệ hoặc để trống. / Please enter a valid email or leave it blank.',
      });
    }

    const byPhone = await db.select().from(members).where(eq(members.phone, phone)).limit(1);
    const byEmail =
      email !== null
        ? await db.select().from(members).where(eq(members.email, email)).limit(1)
        : [];
    const existing = byPhone[0] ?? byEmail[0];
    if (existing?.phoneVerified) {
      return res.status(409).json({
        error: 'Số điện thoại hoặc email này đã được đăng ký. / This phone number or email is already registered.',
      });
    }

    const code = await issueCode(phone, 'register');
    if (code === null) {
      return res.status(429).json({
        error: 'Vui lòng đợi một phút trước khi yêu cầu mã mới. / Please wait a minute before requesting a new code.',
      });
    }
    const sent = await SmsService.sendVerificationCode(phone, code, 'register');
    if (!sent) {
      return res.status(500).json({
        error: 'Không thể gửi tin nhắn xác minh. Vui lòng thử lại sau. / Could not send the verification text. Please try again later.',
      });
    }

    const { hash, salt } = AuthService.hashPassword(password);
    if (existing) {
      await db
        .update(members)
        .set({
          firstName,
          lastName,
          phone,
          email,
          passwordHash: hash,
          passwordSalt: salt,
          updatedAt: new Date(),
        })
        .where(eq(members.id, existing.id));
    } else {
      await db.insert(members).values({
        firstName,
        lastName,
        phone,
        email,
        passwordHash: hash,
        passwordSalt: salt,
        phoneVerified: false,
        role: 'member',
      });
    }

    res.status(201).json({ message: 'Mã xác minh đã được gửi đến số điện thoại của bạn. / A verification code was sent to your phone.' });
  } catch (error) {
    console.error('Member register error:', error);
    res.status(500).json({ error: 'Đăng ký thất bại / Registration failed' });
  }
});

// POST /api/members/verify — confirm the registration code. Marks the
// phone verified and logs the member in (returns a token).
router.post('/verify', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!phone || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Số điện thoại và mã 6 số là bắt buộc. / Phone number and a 6-digit code are required.' });
    }

    const result = await checkCode(phone, 'register', code);
    if (result !== 'ok') return res.status(400).json({ error: result });

    const found = await db.select().from(members).where(eq(members.phone, phone)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản. / Account not found.' });
    }
    const member = found[0];
    await db
      .update(members)
      .set({ phoneVerified: true, updatedAt: new Date() })
      .where(eq(members.id, member.id));
    await clearCodes(phone, 'register');

    res.json({ token: toToken(member), user: toPublicMember({ ...member, phoneVerified: true }) });
  } catch (error) {
    console.error('Member verify error:', error);
    res.status(500).json({ error: 'Xác minh thất bại / Verification failed' });
  }
});

// POST /api/members/resend-code — send a fresh registration code by SMS.
router.post('/resend-code', codeRateLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ error: 'Số điện thoại là bắt buộc. / Phone number is required.' });

    const found = await db.select().from(members).where(eq(members.phone, phone)).limit(1);
    if (found.length === 0 || found[0].phoneVerified) {
      return res.status(404).json({ error: 'Không tìm thấy đăng ký chưa xác minh. / No unverified registration found.' });
    }

    const code = await issueCode(phone, 'register');
    if (code === null) {
      return res.status(429).json({
        error: 'Vui lòng đợi một phút trước khi yêu cầu mã mới. / Please wait a minute before requesting a new code.',
      });
    }
    const sent = await SmsService.sendVerificationCode(phone, code, 'register');
    if (!sent) {
      return res.status(500).json({
        error: 'Không thể gửi tin nhắn xác minh. Vui lòng thử lại sau. / Could not send the verification text. Please try again later.',
      });
    }
    res.json({ message: 'Mã xác minh mới đã được gửi. / A new verification code was sent.' });
  } catch (error) {
    console.error('Member resend-code error:', error);
    res.status(500).json({ error: 'Gửi mã thất bại / Failed to send code' });
  }
});

// POST /api/members/forgot-password — send a reset code by SMS to the
// member's phone. Only verified members can reset this way.
router.post('/forgot-password', codeRateLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ error: 'Số điện thoại là bắt buộc. / Phone number is required.' });

    const found = await db.select().from(members).where(eq(members.phone, phone)).limit(1);
    if (found.length === 0 || !found[0].phoneVerified) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với số điện thoại này. / No account found with this phone number.' });
    }

    const code = await issueCode(phone, 'reset');
    if (code === null) {
      return res.status(429).json({
        error: 'Vui lòng đợi một phút trước khi yêu cầu mã mới. / Please wait a minute before requesting a new code.',
      });
    }
    const sent = await SmsService.sendVerificationCode(phone, code, 'reset');
    if (!sent) {
      return res.status(500).json({
        error: 'Không thể gửi tin nhắn. Vui lòng thử lại sau. / Could not send the text. Please try again later.',
      });
    }
    res.json({ message: 'Mã đặt lại mật khẩu đã được gửi đến số điện thoại của bạn. / A password reset code was sent to your phone.' });
  } catch (error) {
    console.error('Member forgot-password error:', error);
    res.status(500).json({ error: 'Gửi mã thất bại / Failed to send code' });
  }
});

// POST /api/members/reset-password — verify the reset code and set a new
// password for the member.
router.post('/reset-password', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!phone || !/^\d{6}$/.test(code) || newPassword.length < 6) {
      return res.status(400).json({
        error: 'Số điện thoại, mã 6 số và mật khẩu mới từ 6 ký tự là bắt buộc. / Phone number, a 6-digit code and a new password of at least 6 characters are required.',
      });
    }

    const result = await checkCode(phone, 'reset', code);
    if (result !== 'ok') return res.status(400).json({ error: result });

    const found = await db.select().from(members).where(eq(members.phone, phone)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản. / Account not found.' });
    }
    const { hash, salt } = AuthService.hashPassword(newPassword);
    await db
      .update(members)
      .set({ passwordHash: hash, passwordSalt: salt, updatedAt: new Date() })
      .where(eq(members.id, found[0].id));
    await clearCodes(phone, 'reset');

    res.json({ message: 'Đổi mật khẩu thành công. / Password updated successfully.' });
  } catch (error) {
    console.error('Member reset-password error:', error);
    res.status(500).json({ error: 'Đặt lại mật khẩu thất bại / Password reset failed' });
  }
});

export default router;
