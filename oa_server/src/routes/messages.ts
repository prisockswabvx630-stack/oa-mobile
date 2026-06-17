import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { receiver_id } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';
    
    const where: any = {};
    
    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      where.OR = [
        { receiver_id: userId },
        { sender_id: userId }
      ];
    } else if (receiver_id) {
      where.receiver_id = BigInt(String(receiver_id));
    }
    
    const messages = await prisma.sys_message.findMany({ where, orderBy: { create_time: 'desc' } });
    res.json({ code: 200, data: messages, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await prisma.sys_message.findFirst({
      where: { id: BigInt(String(id)) }
    });
    if (!message) {
      return res.json({ code: 404, msg: '消息不存在' });
    }
    const updated = await prisma.sys_message.update({
      where: { id: BigInt(String(id)) },
      data: {
        is_read: 1,
        read_time: new Date()
      }
    });
    // Serialize BigInt values
    const serialized = {
      ...updated,
      id: String(updated.id),
      sender_id: updated.sender_id ? String(updated.sender_id) : null,
      receiver_id: String(updated.receiver_id),
      related_id: updated.related_id ? String(updated.related_id) : null
    };
    res.json({ code: 200, data: serialized, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
