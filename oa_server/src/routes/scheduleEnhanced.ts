import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 获取日程列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { start_date, end_date, type } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = { is_deleted: 0 };

    // 非管理员只能看到自己的日程
    if (!isAdmin) {
      where.user_id = BigInt(userId);
    }

    if (type) where.type = type;

    if (start_date && end_date) {
      where.start_time = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    } else if (start_date) {
      where.start_time = { gte: new Date(start_date as string) };
    }

    const schedules = await prisma.oa_schedule.findMany({
      where,
      orderBy: { start_time: 'asc' }
    });

    res.json({ code: 200, data: schedules, msg: 'success' });
  } catch (error) {
    console.error('[Get Schedules Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 创建日程
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { title, description, start_time, end_time, type, location, is_all_day, remind_minutes } = req.body;

    if (!title || !start_time) {
      return res.json({ code: 400, msg: '标题和开始时间不能为空' });
    }

    const schedule = await prisma.oa_schedule.create({
      data: {
        user_id: BigInt(user.id),
        title,
        description: description || '',
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : new Date(new Date(start_time).getTime() + 3600000),
        type: type || 'personal',
        location: location || '',
        remind_minutes: remind_minutes || 0,
        create_time: new Date(),
        update_time: new Date()
      }
    });

    // 创建提醒
    if (remind_minutes) {
      const remindTime = new Date(new Date(start_time).getTime() - remind_minutes * 60000);
      if (remindTime > new Date()) {
        await prisma.oa_schedule_reminder.create({
          data: {
            schedule_id: schedule.id,
            user_id: BigInt(user.id),
            remind_time: remindTime,
            remind_type: 'system',
            is_sent: 0,
            create_time: new Date()
          }
        });
      }
    }

    res.json({ code: 200, data: schedule, msg: '创建成功' });
  } catch (error) {
    console.error('[Create Schedule Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 更新日程
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { title, description, start_time, end_time, type, location, is_all_day, status, remind_minutes } = req.body;

    const schedule = await prisma.oa_schedule.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!schedule) {
      return res.json({ code: 404, msg: '日程不存在' });
    }

    // 权限检查
    if (String(schedule.user_id) !== String(user.id) && user.username !== 'admin') {
      return res.json({ code: 403, msg: '权限不足' });
    }

    const updateData: any = { update_time: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = new Date(start_time);
    if (end_time !== undefined) updateData.end_time = new Date(end_time);
    if (type !== undefined) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (is_all_day !== undefined) updateData.is_all_day = is_all_day ? 1 : 0;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.oa_schedule.update({
      where: { id: BigInt(String(id)) },
      data: updateData
    });

    // 更新提醒
    if (remind_minutes && start_time) {
      // 删除旧提醒
      await prisma.oa_schedule_reminder.deleteMany({
        where: { schedule_id: BigInt(String(id)) }
      });

      // 创建新提醒
      const remindTime = new Date(new Date(start_time).getTime() - remind_minutes * 60000);
      if (remindTime > new Date()) {
        await prisma.oa_schedule_reminder.create({
          data: {
            schedule_id: BigInt(String(id)),
            user_id: BigInt(String(user.id)),
            remind_time: remindTime,
            remind_type: 'system',
            is_sent: 0,
            create_time: new Date()
          }
        });
      }
    }

    res.json({ code: 200, data: updated, msg: '更新成功' });
  } catch (error) {
    console.error('[Update Schedule Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 删除日程
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const schedule = await prisma.oa_schedule.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!schedule) {
      return res.json({ code: 404, msg: '日程不存在' });
    }

    // 权限检查
    if (String(schedule.user_id) !== String(user.id) && user.username !== 'admin') {
      return res.json({ code: 403, msg: '权限不足' });
    }

    // 软删除
    await prisma.oa_schedule.update({
      where: { id: BigInt(String(id)) },
      data: { is_deleted: 1, update_time: new Date() }
    });

    // 删除相关提醒
    await prisma.oa_schedule_reminder.deleteMany({
      where: { schedule_id: BigInt(String(id)) }
    });

    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    console.error('[Delete Schedule Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取待提醒的日程
router.get('/reminders/pending', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const now = new Date();

    // 获取需要提醒的日程
    const reminders = await prisma.oa_schedule_reminder.findMany({
      where: {
        user_id: BigInt(String(user.id)),
        is_sent: 0,
        remind_time: { lte: now }
      }
    });

    // 获取关联的日程信息
    const scheduleIds = [...new Set(reminders.map(r => r.schedule_id))];
    const schedules = await prisma.oa_schedule.findMany({
      where: { id: { in: scheduleIds } }
    });
    const scheduleMap = new Map(schedules.map(s => [s.id, s]));

    // 标记为已发送
    const reminderIds = reminders.map(r => r.id);
    if (reminderIds.length > 0) {
      await prisma.oa_schedule_reminder.updateMany({
        where: { id: { in: reminderIds } },
        data: { is_sent: 1 }
      });
    }

    const data = reminders.map(r => ({
      ...r,
      schedule: scheduleMap.get(r.schedule_id) || null
    }));

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Reminders Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取日程统计
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { month } = req.query;
    const userId = user.id;

    const monthStart = new Date(month as string + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const schedules = await prisma.oa_schedule.findMany({
      where: {
        user_id: BigInt(userId),
        is_deleted: 0,
        start_time: { gte: monthStart, lt: monthEnd }
      }
    });

    const total = schedules.length;
    const byType = {
      personal: schedules.filter(s => s.type === 'personal').length,
      meeting: schedules.filter(s => s.type === 'meeting').length,
      project: schedules.filter(s => s.type === 'project').length,
      company: schedules.filter(s => s.type === 'company').length
    };

    res.json({
      code: 200,
      data: {
        total,
        by_type: byType
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Schedule Statistics Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
