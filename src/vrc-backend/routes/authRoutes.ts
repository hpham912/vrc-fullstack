import { randomInt } from 'crypto';
import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { adminUsers } from '../../vrc-db/schema.ts';
import { eq, asc, sql } from 'drizzle-orm';
import { AuthService } from '../services/authService.ts';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { authRateLimiter } from '../middleware/securityMiddleware.ts';

const router = Router();

// POST /api/auth/login - Admin Login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    let user: any = null;

    try {
      const existing = await db
        .select()
        .from(adminUsers)
        .where(sql`LOWER(${adminUsers.username}) = ${cleanUsername} OR LOWER(${adminUsers.email}) = ${cleanUsername}`)
        .limit(1);

      if (existing.length > 0) {
        user = existing[0];
      }
    } catch (dbErr) {
      console.warn('DB lookup warning during login:', dbErr);
    }

    // Verify DB user if passwordHash is present
    if (user && user.passwordHash && user.passwordSalt) {
      const isMatch = AuthService.verifyPassword(cleanPassword, user.passwordHash, user.passwordSalt);
      if (isMatch) {
        const token = AuthService.createToken({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        });

        return res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
          },
        });
      }
    }

    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác / Invalid username or password.' });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Đăng nhập thất bại / Login failed' });
  }
});

// GET /api/auth/me - Verify session
router.get('/me', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const admin = req.adminUser!;
    try {
      const user = await db
        .select({
          id: adminUsers.id,
          username: adminUsers.username,
          email: adminUsers.email,
          displayName: adminUsers.displayName,
          role: adminUsers.role,
          createdAt: adminUsers.createdAt,
        })
        .from(adminUsers)
        .where(eq(adminUsers.id, admin.id))
        .limit(1);

      if (user.length > 0) {
        return res.json({ user: user[0] });
      }
    } catch (e) {
      console.warn('DB lookup in /me warning:', e);
    }

    res.json({
      user: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName || 'Administrator',
        email: admin.username === 'vrcadmin' ? 'ngochoang5111@gmail.com' : 'admin@vrcfamily.org',
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// GET /api/auth/admins - List administrators from PostgreSQL
router.get('/admins', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const list = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .orderBy(asc(adminUsers.id));

    res.json(list);
  } catch (error: any) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Failed to list admin accounts' });
  }
});

// POST /api/auth/create-admin - Provision new administrator in PostgreSQL
router.post('/create-admin', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { username, password, email, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Username, password, and display name are required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await db
      .select()
      .from(adminUsers)
      .where(sql`LOWER(${adminUsers.username}) = ${cleanUsername}`)
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại / Username already exists.' });
    }

    const { hash, salt } = AuthService.hashPassword(password);
    const inserted = await db
      .insert(adminUsers)
      .values({
        username: cleanUsername,
        email: email ? String(email).trim() : '',
        displayName: String(displayName).trim().slice(0, 100),
        passwordHash: hash,
        passwordSalt: salt,
        role: 'admin',
      })
      .returning({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        createdAt: adminUsers.createdAt,
      });

    res.status(201).json({
      message: 'Admin account created successfully in PostgreSQL',
      user: inserted[0],
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

// DELETE /api/auth/admins/:id - Remove administrator from PostgreSQL
router.delete('/admins/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = Number(req.params.id);
    const currentAdminId = req.adminUser!.id;

    if (targetId === currentAdminId) {
      return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của chính mình / Cannot delete your own account.' });
    }

    const count = await db.select().from(adminUsers);
    if (count.length <= 1) {
      return res.status(400).json({ error: 'Cần ít nhất một tài khoản quản trị / Must have at least one admin account.' });
    }

    await db.delete(adminUsers).where(eq(adminUsers.id, targetId));
    res.json({ message: 'Đã xóa tài khoản quản trị / Admin account removed' });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin account' });
  }
});

// POST /api/auth/admins/:id/reset-password - Reset another admin's
// password to a random 6-digit temporary code. Admin-only, and an admin
// cannot reset their own password this way (use Change Password, which
// requires the old password, instead).
// The code is generated fresh for each reset and returned once in the
// response, so the resetting admin can share it with the reset admin.
// Only the hash is stored — the plain code is never saved. The reset
// admin logs in with the code, then must change their password right
// after logging in.
router.post('/admins/:id/reset-password', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = Number(req.params.id);
    const currentAdminId = req.adminUser!.id;

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'Invalid admin id' });
    }

    if (targetId === currentAdminId) {
      return res.status(400).json({ error: 'Bạn không thể đặt lại mật khẩu của chính mình — hãy dùng Đổi Mật Khẩu / Cannot reset your own password — use Change Password instead.' });
    }

    const target = await db.select().from(adminUsers).where(eq(adminUsers.id, targetId)).limit(1);
    if (target.length === 0) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    // 6 digits, 100000-999999. crypto.randomInt is uniform and
    // unpredictable, unlike Math.random.
    const tempCode = String(randomInt(100000, 1000000));
    const { hash, salt } = AuthService.hashPassword(tempCode);
    await db
      .update(adminUsers)
      .set({
        passwordHash: hash,
        passwordSalt: salt,
      })
      .where(eq(adminUsers.id, targetId));

    res.json({ message: 'Đặt lại mật khẩu thành mã tạm thời thành công / Password reset to a temporary code successfully', tempCode });
  } catch (error: any) {
    console.error('Reset admin password error:', error);
    res.status(500).json({ error: 'Failed to reset admin password' });
  }
});

// POST /api/auth/change-password - Change password in PostgreSQL
router.post('/change-password', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự / New password must be at least 6 characters' });
    }

    const currentAdminId = req.adminUser!.id;
    const userResult = await db.select().from(adminUsers).where(eq(adminUsers.id, currentAdminId)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];
    const isOldMatch = AuthService.verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
    if (!isOldMatch) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng / Old password is incorrect.' });
    }

    const { hash, salt } = AuthService.hashPassword(newPassword);
    await db
      .update(adminUsers)
      .set({
        passwordHash: hash,
        passwordSalt: salt,
      })
      .where(eq(adminUsers.id, currentAdminId));

    res.json({ message: 'Đổi mật khẩu thành công / Password updated successfully!' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
