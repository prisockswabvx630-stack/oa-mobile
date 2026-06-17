import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';
    
    const where: any = { is_deleted: 0 };
    
    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      where.OR = [
        { initiator_id: userId },
        { receiver_id: userId }
      ];
    }
    
    const handovers = await prisma.oa_handover.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set([...handovers.map(h => h.initiator_id), ...handovers.map(h => h.receiver_id)])];
    const users = await prisma.sys_user.findMany({ where: { id: { in: userIds } }, select: { id: true, real_name: true } });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));
    const data = handovers.map(h => ({ ...h, initiator_name: userMap.get(h.initiator_id) || '', receiver_name: userMap.get(h.receiver_id) || '' }));
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, sender, receiver, progress, status } = req.body;
    let initiatorId: bigint = BigInt(1); let receiverId: bigint = BigInt(1);
    if (sender) { const dbSender = await prisma.sys_user.findFirst({ where: { real_name: sender, is_deleted: 0 } }); if (dbSender) initiatorId = dbSender.id; }
    if (receiver) { const dbReceiver = await prisma.sys_user.findFirst({ where: { real_name: receiver, is_deleted: 0 } }); if (dbReceiver) receiverId = dbReceiver.id; }
    const dbStatus = status === '待确认' ? 'pending' : (status === '交接中' ? 'in_progress' : (status === '已完成' ? 'completed' : 'pending'));
    const record = await prisma.oa_handover.create({
      data: { handover_no: 'HO_' + Date.now(), title: title || '工作交接', initiator_id: initiatorId, receiver_id: receiverId, content: title || '工作交接内容', progress: progress || 0, status: dbStatus }
    });
    res.json({ code: 200, data: record, msg: '新增交接成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;
    const dbStatus = status ? (status === '待确认' ? 'pending' : (status === '交接中' ? 'in_progress' : (status === '已完成' ? 'completed' : 'pending'))) : undefined;
    const updateData: any = { update_time: new Date() };
    if (progress !== undefined) updateData.progress = progress;
    if (dbStatus !== undefined) updateData.status = dbStatus;
    if (dbStatus === 'completed') { updateData.confirm_time = new Date(); updateData.complete_time = new Date(); }
    const updated = await prisma.oa_handover.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新交接成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
