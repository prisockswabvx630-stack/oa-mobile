import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, authMiddleware } from '../utils/authMiddleware';
import { kickedUsers } from '../utils/onlineTracker';

const router = Router();
const prisma = new PrismaClient();

// 登录失败记录
const loginAttempts: { [key: string]: { count: number; firstAttempt: number } } = {};

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 输入验证
    if (!username || !password) {
      return res.json({ code: 400, msg: '用户名和密码不能为空' });
    }

    // 登录失败锁定检查
    const key = username.toLowerCase();
    const now = Date.now();

    if (!loginAttempts[key]) {
      loginAttempts[key] = { count: 0, firstAttempt: now };
    }

    const attempt = loginAttempts[key];

    // 15分钟内失败5次则锁定
    if (attempt.count >= 5) {
      const timePassed = now - attempt.firstAttempt;
      if (timePassed < 15 * 60 * 1000) {
        const remainMinutes = Math.ceil((15 * 60 * 1000 - timePassed) / 60000);
        return res.json({ code: 429, msg: `登录失败次数过多，请${remainMinutes}分钟后再试` });
      } else {
        // 超过15分钟，重置计数
        attempt.count = 0;
        attempt.firstAttempt = now;
      }
    }

    const user = await prisma.sys_user.findFirst({
      where: { username, is_deleted: 0 },
      include: {
        sys_department: { select: { id: true, dept_name: true } },
        sys_position: { select: { id: true, pos_name: true } }
      }
    });

    if (!user) {
      // 登录失败，增加计数
      attempt.count++;
      if (attempt.count === 1) {
        attempt.firstAttempt = now;
      }
      return res.json({ code: 401, msg: '用户名或密码不正确' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // 登录失败，增加计数
      attempt.count++;
      if (attempt.count === 1) {
        attempt.firstAttempt = now;
      }
      return res.json({ code: 401, msg: '用户名或密码不正确' });
    }

    if (user.status !== 1) {
      return res.json({ code: 403, msg: '账号已被禁用' });
    }

    // 登录成功，重置计数
    attempt.count = 0;

    // 登录成功，从踢出黑名单中移除
    kickedUsers.delete(String(user.id));

    // 生成JWT Token
    const token = generateToken({
      id: Number(user.id),
      username: user.username,
      emp_no: user.emp_no,
      real_name: user.real_name
    });

    const { password: _, ...userInfo } = user;

    res.json({
      code: 200,
      data: {
        id: Number(user.id),
        username: user.username,
        real_name: user.real_name,
        emp_no: user.emp_no,
        mobile: user.mobile,
        sys_department: user.sys_department,
        sys_position: user.sys_position,
        token
      },
      msg: '登录成功'
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  res.json({ code: 200, msg: '登出成功' });
});

router.get('/permissions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.json({ code: 401, msg: '未登录' });
    }

    const userId = BigInt(user.id);

    const userRole = await prisma.sys_user_role.findFirst({
      where: { user_id: userId },
      include: { sys_role: true }
    });

    if (!userRole || !userRole.sys_role) {
      return res.json({
        code: 200,
        data: { roleCode: 'ROLE_USER', roleName: '普通员工', permissions: [] },
        msg: 'success'
      });
    }

    const role = userRole.sys_role;

    if (role.role_code === 'ROLE_ADMIN') {
      const allPerms = await prisma.sys_permission.findMany({
        where: { is_deleted: 0, status: 1 }
      });
      return res.json({
        code: 200,
        data: {
          roleCode: role.role_code,
          roleName: role.role_name,
          permissions: allPerms.map(p => p.permission_code)
        },
        msg: 'success'
      });
    }

    const rolePerms = await prisma.sys_role_permission.findMany({
      where: { role_id: role.id },
      include: { sys_permission: true }
    });

    const permissions = rolePerms
      .filter(rp => rp.sys_permission && rp.sys_permission.is_deleted === 0 && rp.sys_permission.status === 1)
      .map(rp => rp.sys_permission.permission_code);

    res.json({
      code: 200,
      data: {
        roleCode: role.role_code,
        roleName: role.role_name,
        permissions
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Permissions Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
