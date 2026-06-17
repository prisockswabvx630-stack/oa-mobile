import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/employees', async (req: Request, res: Response) => {
  try {
    const users = await prisma.sys_user.findMany({
      where: { is_deleted: 0 },
      include: { sys_department: { select: { dept_name: true } }, sys_position: { select: { pos_name: true } } },
      orderBy: { id: 'asc' }
    });
    const data = users.map(u => {
      const { password, ...rest } = u;
      return { ...rest, dept_name: u.sys_department?.dept_name || '', pos_name: u.sys_position?.pos_name || '' };
    });
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
