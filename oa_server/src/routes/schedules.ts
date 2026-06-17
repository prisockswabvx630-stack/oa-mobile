import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';
    
    const where: any = { is_deleted: 0 };
    
    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      const user = await prisma.sys_user.findUnique({ where: { id: userId } });
      const realName = user?.real_name;
      where.OR = [
        { user_id: userId },
        { attendees: { contains: String(userId) } },
        ...(realName ? [{ attendees: { contains: realName } }] : [])
      ];
    } else if (user_id) {
      where.user_id = BigInt(String(user_id));
    }
    
    const schedules = await prisma.oa_schedule.findMany({ where, orderBy: { start_time: 'asc' } });
    res.json({ code: 200, data: schedules, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, start_time, end_time, location, type, attendees, user_id } = req.body;
    const dbUserId = user_id ? BigInt(user_id) : BigInt(1);
    const schedule = await prisma.oa_schedule.create({
      data: { title: title || '', description: description || '', user_id: dbUserId, start_time: start_time ? new Date(start_time) : new Date(), end_time: end_time ? new Date(end_time) : new Date(), location: location || '', type: type || 'purple', attendees: attendees ? String(attendees) : null }
    });
    res.json({ code: 200, data: schedule, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, start_time, end_time, location, type, attendees } = req.body;
    const updateData: any = { update_time: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = new Date(start_time);
    if (end_time !== undefined) updateData.end_time = new Date(end_time);
    if (location !== undefined) updateData.location = location;
    if (type !== undefined) updateData.type = type;
    if (attendees !== undefined) updateData.attendees = attendees ? String(attendees) : null;
    const updated = await prisma.oa_schedule.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.oa_schedule.update({ where: { id: BigInt(String(id)) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
