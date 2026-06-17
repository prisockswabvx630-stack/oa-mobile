import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 会议室列表
const MEETING_ROOMS = [
  { id: 1, name: '会议室A', capacity: 10, location: '3楼东区', equipment: ['投影仪', '白板', '视频会议'] },
  { id: 2, name: '会议室B', capacity: 20, location: '3楼西区', equipment: ['投影仪', '白板', '音响'] },
  { id: 3, name: '会议室C', capacity: 6, location: '5楼北区', equipment: ['电视屏', '白板'] },
  { id: 4, name: '线上会议', capacity: 100, location: '远程', equipment: ['腾讯会议', '钉钉'] }
];

// 获取会议室列表
router.get('/rooms', async (_req: Request, res: Response) => {
  try {
    res.json({ code: 200, data: MEETING_ROOMS, msg: 'success' });
  } catch (error) {
    console.error('[Get Rooms Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取会议室预订列表
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { room_id, date, status } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = {};

    if (room_id) where.room_id = Number(room_id);
    if (status) where.status = status;

    // 按日期筛选
    if (date) {
      const queryDate = new Date(date as string);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.start_time = { gte: queryDate, lt: nextDay };
    }

    // 非管理员只能看到自己的预订
    if (!isAdmin) {
      where.booker_id = BigInt(userId);
    }

    const bookings = await prisma.oa_meeting_booking.findMany({
      where,
      orderBy: { start_time: 'desc' }
    });

    // 获取预订人信息
    const bookerIds = [...new Set(bookings.map(b => b.booker_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: bookerIds } },
      select: { id: true, real_name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    // 添加会议室名称和预订人名称
    const roomMap = new Map(MEETING_ROOMS.map(r => [r.id, r.name]));

    const data = bookings.map(b => ({
      ...b,
      room_name: roomMap.get(Number(b.room_id)) || '',
      booker_name: userMap.get(b.booker_id) || ''
    }));

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Bookings Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 预订会议室
router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { room_id, start_time, end_time, purpose, meeting_id } = req.body;

    if (!room_id || !start_time || !end_time) {
      return res.json({ code: 400, msg: '会议室、开始时间和结束时间不能为空' });
    }

    // 验证时间
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    if (startTime >= endTime) {
      return res.json({ code: 400, msg: '结束时间必须大于开始时间' });
    }

    // 检查会议室是否存在
    const room = MEETING_ROOMS.find(r => r.id === room_id);
    if (!room) {
      return res.json({ code: 404, msg: '会议室不存在' });
    }

    // 检查时间冲突
    const conflictingBooking = await prisma.oa_meeting_booking.findFirst({
      where: {
        room_id: room_id,
        status: { notIn: ['cancelled'] },
        OR: [
          {
            start_time: { lt: endTime },
            end_time: { gt: startTime }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.json({ code: 400, msg: '该时间段会议室已被预订' });
    }

    const booking = await prisma.oa_meeting_booking.create({
      data: {
        room_id: room_id,
        meeting_id: meeting_id ? BigInt(meeting_id) : null,
        booker_id: BigInt(user.id),
        start_time: startTime,
        end_time: endTime,
        status: 'booked',
        create_time: new Date(),
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: booking, msg: '预订成功' });
  } catch (error) {
    console.error('[Create Booking Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 取消预订
router.put('/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const userId = user.id;
    const username = user.username;

    const booking = await prisma.oa_meeting_booking.findFirst({
      where: { id: BigInt(String(id)) }
    });

    if (!booking) {
      return res.json({ code: 404, msg: '预订记录不存在' });
    }

    // 权限检查：只有预订人或管理员可以取消
    if (String(booking.booker_id) !== String(userId) && username !== 'admin') {
      return res.json({ code: 403, msg: '权限不足，只能取消自己的预订' });
    }

    if (booking.status === 'cancelled') {
      return res.json({ code: 400, msg: '该预订已取消' });
    }

    const updated = await prisma.oa_meeting_booking.update({
      where: { id: BigInt(String(id)) },
      data: {
        status: 'cancelled',
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: updated, msg: '取消成功' });
  } catch (error) {
    console.error('[Cancel Booking Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取会议室可用时间段
router.get('/rooms/:id/available', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.json({ code: 400, msg: '日期参数不能为空' });
    }

    const room = MEETING_ROOMS.find(r => r.id === Number(id));
    if (!room) {
      return res.json({ code: 404, msg: '会议室不存在' });
    }

    // 获取当天的预订记录
    const queryDate = new Date(date as string);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await prisma.oa_meeting_booking.findMany({
      where: {
        room_id: Number(id),
        status: { notIn: ['cancelled'] },
        start_time: { gte: queryDate, lt: nextDay }
      },
      orderBy: { start_time: 'asc' }
    });

    // 生成可用时间段（9:00-18:00，每小时一个时间段）
    const availableSlots = [];
    const workStart = 9;
    const workEnd = 18;

    for (let hour = workStart; hour < workEnd; hour++) {
      const slotStart = new Date(queryDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(queryDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // 检查是否与已有预订冲突
      const isBooked = bookings.some(b => {
        const bookingStart = new Date(b.start_time);
        const bookingEnd = new Date(b.end_time);
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });

      availableSlots.push({
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        available: !isBooked
      });
    }

    res.json({
      code: 200,
      data: {
        room,
        date: date,
        available_slots: availableSlots
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Available Slots Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
