import { randomInt } from 'crypto';
import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../vrc-db/index.ts';
import { members } from '../../vrc-db/schema.ts';
import { AuthService } from '../services/authService.ts';
import { AuthRequest, requireAdmin } from '../middleware/authMiddleware.ts';

const router = Router();

// GET /api/admin/members — list all registered members (admin only).
router.get('/members', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const list = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
        email: members.email,
        emailVerified: members.emailVerified,
        role: members.role,
        createdAt: members.createdAt,
        lastLoginAt: members.lastLoginAt,
      })
      .from(members)
      .orderBy(asc(members.id));

    res.json(list);
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Failed to list members' });
  }
});

// POST /api/admin/members/:id/reset-password — reset a member's password
// to a random 6-digit temporary code (same pattern as the admin reset).
// The code is returned once so the admin can share it with the member;
// only the hash is stored. The member logs in with the code, then
// changes it (via forgot-password or a future change-password screen).
router.post('/members/:id/reset-password', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'Invalid member id' });
    }

    const target = await db.select().from(members).where(eq(members.id, targetId)).limit(1);
    if (target.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // 6 digits, 100000-999999. crypto.randomInt is uniform and
    // unpredictable, unlike Math.random.
    const tempCode = String(randomInt(100000, 1000000));
    const { hash, salt } = AuthService.hashPassword(tempCode);
    await db
      .update(members)
      .set({
        passwordHash: hash,
        passwordSalt: salt,
        updatedAt: new Date(),
      })
      .where(eq(members.id, targetId));

    res.json({ message: 'Đặt lại mật khẩu thành mã tạm thời thành công / Password reset to a temporary code successfully', tempCode });
  } catch (error) {
    console.error('Reset member password error:', error);
    res.status(500).json({ error: 'Failed to reset member password' });
  }
});

// DELETE /api/admin/members/:id — remove a member (admin only).
router.delete('/members/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'Invalid member id' });
    }

    const target = await db.select().from(members).where(eq(members.id, targetId)).limit(1);
    if (target.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await db.delete(members).where(eq(members.id, targetId));
    res.json({ message: 'Đã xóa thành viên / Member removed' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

export default router;
