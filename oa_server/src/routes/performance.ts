import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/performance — 绩效列表（基于员工数据生成）
router.get('/', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const users = await prisma.sys_user.findMany({
      where: { is_deleted: 0, status: 1 },
      include: {
        sys_department: { select: { dept_name: true } },
        sys_position: { select: { pos_name: true } },
      },
      orderBy: { id: 'asc' },
    });

    const data = users.map(u => ({
      user_id: Number(u.id),
      emp_no: u.emp_no,
      name: u.real_name,
      dept: u.sys_department?.dept_name || '',
      position: u.sys_position?.pos_name || '',
      work_score: 80,
      attitude_score: 80,
      teamwork_score: 80,
      total_score: 80,
      grade: 'B',
      period: new Date().toISOString().slice(0, 7),
    }));

    // 非管理员只返回自己的绩效
    if (!isAdmin && reqUser?.id) {
      const own = data.filter(d => d.user_id === reqUser.id);
      return res.json({ code: 200, data: own, msg: 'success' });
    }

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[GET /performance]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
