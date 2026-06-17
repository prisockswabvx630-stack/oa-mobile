import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.sys_user.findMany({
      where: { is_deleted: 0, status: 1 },
      include: { sys_department: { select: { dept_name: true } }, sys_position: { select: { pos_name: true } } },
      orderBy: { id: 'asc' }
    });
    const data = users.map(u => ({
      id: String(u.id), name: u.real_name, dept: u.sys_department?.dept_name || '', role: u.sys_position?.pos_name || '',
      avatar: u.avatar || `https://i.pravatar.cc/150?img=${u.id}`, mobile: u.mobile, email: u.email
    }));
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
