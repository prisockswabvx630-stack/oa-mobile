import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取培训列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = String(status);

    const trainings = await prisma.hr_training.findMany({ where, orderBy: { create_time: 'desc' } });
    res.json({ code: 200, data: trainings, msg: 'success' });
  } catch (error) {
    console.error('[Trainings Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 创建培训
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const training_name = body.training_name || body.name;
    const training_type = body.training_type || body.type || '技能培训';
    const instructor = body.instructor || null;
    const start_date = body.start_date || body.startDate;
    const end_date = body.end_date || body.endDate;
    const location = body.location || null;
    const hours = body.hours || 0;
    const participants = body.participants || 0;
    const remark = body.remark || null;
    const statusMap: Record<string, string> = { '未开始': 'not_started', '进行中': 'in_progress', '已完成': 'completed', '已取消': 'cancelled' };
    const status = statusMap[body.status] || body.status || 'not_started';

    if (!training_name) {
      return res.json({ code: 400, msg: '培训名称不能为空' });
    }

    const training = await prisma.hr_training.create({
      data: {
        training_no: 'TRN' + Date.now().toString().slice(-8),
        training_name,
        training_type,
        instructor,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        location,
        hours: hours ? Number(hours) : 0,
        participants: participants ? Number(participants) : 0,
        remark,
        status
      }
    });

    res.json({ code: 200, data: training, msg: '创建成功' });
  } catch (error) {
    console.error('[Create Training Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 更新培训
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { training_name, training_type, instructor, start_date, end_date, location, hours, participants, status, score, remark } = req.body;

    const updateData: any = { update_time: new Date() };
    if (training_name !== undefined) updateData.training_name = training_name;
    if (training_type !== undefined) updateData.training_type = training_type;
    if (instructor !== undefined) updateData.instructor = instructor;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (location !== undefined) updateData.location = location;
    if (hours !== undefined) updateData.hours = Number(hours);
    if (participants !== undefined) updateData.participants = Number(participants);
    if (status !== undefined) {
      const statusMap: Record<string, string> = { '未开始': 'not_started', '进行中': 'in_progress', '已完成': 'completed', '已取消': 'cancelled' };
      updateData.status = statusMap[status] || status;
    }
    if (score !== undefined) updateData.score = Number(score);
    if (remark !== undefined) updateData.remark = remark;

    const updated = await prisma.hr_training.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新成功' });
  } catch (error) {
    console.error('[Update Training Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 删除培训
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.hr_training.delete({ where: { id: BigInt(String(id)) } });
    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    console.error('[Delete Training Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
