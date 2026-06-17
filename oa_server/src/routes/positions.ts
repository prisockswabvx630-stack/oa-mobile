import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const positions = await prisma.sys_position.findMany({ where: { is_deleted: 0 }, orderBy: { sort: 'asc' } });
    res.json({ code: 200, data: positions, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
