import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 打卡
router.post('/clock', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { type, location, latitude, longitude } = req.body;

    if (!type || !['in', 'out'].includes(type)) {
      return res.json({ code: 400, msg: '打卡类型无效' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 检查是否已打卡
    const existingRecord = await prisma.oa_attendance.findFirst({
      where: {
        user_id: BigInt(user.id),
        attend_date: today
      }
    });

    if (type === 'in') {
      if (existingRecord && existingRecord.clock_in_time) {
        return res.json({ code: 400, msg: '今日已打上班卡' });
      }

      // 判断是否迟到
      const workStartTime = new Date(today);
      workStartTime.setHours(9, 0, 0, 0);
      let status = 'normal';
      if (now > workStartTime) {
        status = 'late';
      }

      // 创建或更新打卡记录
      if (existingRecord) {
        await prisma.oa_attendance.update({
          where: { id: existingRecord.id },
          data: {
            clock_in_time: now,
            clock_in_location: location || '',
            clock_in_latitude: latitude || null,
            clock_in_longitude: longitude || null,
            status,
            update_time: now
          }
        });
      } else {
        await prisma.oa_attendance.create({
          data: {
            user_id: BigInt(user.id),
            attend_date: today,
            clock_in_time: now,
            clock_in_location: location || '',
            clock_in_latitude: latitude || null,
            clock_in_longitude: longitude || null,
            status,
            create_time: now,
            update_time: now
          }
        });
      }

      res.json({ code: 200, msg: '上班打卡成功', data: { status, time: now } });
    } else {
      // 下班打卡
      if (!existingRecord || !existingRecord.clock_in_time) {
        return res.json({ code: 400, msg: '请先打上班卡' });
      }

      if (existingRecord.clock_out_time) {
        return res.json({ code: 400, msg: '今日已打下班卡' });
      }

      // 判断是否早退
      const workEndTime = new Date(today);
      workEndTime.setHours(18, 0, 0, 0);
      let outStatus = 'normal';
      if (now < workEndTime) {
        outStatus = 'early_leave';
      }

      // 计算工作时长
      const clockInTime = new Date(existingRecord.clock_in_time);
      const workHours = (now.getTime() - clockInTime.getTime()) / 3600000;

      await prisma.oa_attendance.update({
        where: { id: existingRecord.id },
        data: {
          clock_out_time: now,
          clock_out_location: location || '',
          clock_out_latitude: latitude || null,
          clock_out_longitude: longitude || null,
          work_hours: Math.round(workHours * 100) / 100,
          update_time: now
        }
      });

      res.json({ code: 200, msg: '下班打卡成功', data: { status: outStatus, time: now, workHours } });
    }
  } catch (error) {
    console.error('[Clock Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取考勤记录
router.get('/records', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { start_date, end_date, status, page = 1, pageSize = 20 } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = {};

    // 非管理员只能看到自己的记录
    if (!isAdmin) {
      where.user_id = BigInt(userId);
    }

    if (start_date && end_date) {
      where.attend_date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [records, total] = await Promise.all([
      prisma.oa_attendance.findMany({
        where,
        orderBy: { attend_date: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.oa_attendance.count({ where })
    ]);

    // 获取用户信息
    const userIds = [...new Set(records.map(r => r.user_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    const data = records.map(r => ({
      ...r,
      user_name: userMap.get(r.user_id) || ''
    }));

    res.json({
      code: 200,
      data: {
        list: data,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Records Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 考勤统计
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { month } = req.query;
    const userId = user.id;

    const monthStart = new Date(month as string + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const records = await prisma.oa_attendance.findMany({
      where: {
        user_id: BigInt(userId),
        attend_date: { gte: monthStart, lt: monthEnd }
      }
    });

    const totalDays = records.length;
    const normalDays = records.filter(r => r.status === 'normal').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;
    const totalWorkHours = records.reduce((sum, r) => sum + Number(r.work_hours || 0), 0);

    res.json({
      code: 200,
      data: {
        total_days: totalDays,
        normal_days: normalDays,
        late_days: lateDays,
        absent_days: absentDays,
        leave_days: leaveDays,
        work_hours: Math.round(totalWorkHours * 100) / 100,
        attendance_rate: totalDays > 0 ? Math.round((normalDays / totalDays) * 100) : 0
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Statistics Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 请假申请
router.post('/leave', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { type, start_date, end_date, reason, days } = req.body;

    if (!type || !start_date || !end_date || !reason) {
      return res.json({ code: 400, msg: '请假信息不完整' });
    }

    // 创建请假审批
    const approvalNo = 'LEA' + Date.now().toString().slice(-8);

    const approval = await prisma.oa_approval.create({
      data: {
        approval_no: approvalNo,
        type: 'leave',
        title: `${type}请假申请`,
        content: reason,
        applicant_id: BigInt(user.id),
        dept_id: BigInt(1),
        status: 'pending',
        create_time: new Date(),
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: approval, msg: '请假申请已提交' });
  } catch (error) {
    console.error('[Leave Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 加班申请
router.post('/overtime', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { date, start_time, end_time, reason } = req.body;

    if (!date || !start_time || !end_time || !reason) {
      return res.json({ code: 400, msg: '加班信息不完整' });
    }

    const approvalNo = 'OVT' + Date.now().toString().slice(-8);

    const approval = await prisma.oa_approval.create({
      data: {
        approval_no: approvalNo,
        type: 'overtime',
        title: '加班申请',
        content: reason,
        applicant_id: BigInt(user.id),
        dept_id: BigInt(1),
        status: 'pending',
        create_time: new Date(),
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: approval, msg: '加班申请已提交' });
  } catch (error) {
    console.error('[Overtime Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 外勤申请
router.post('/fieldwork', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { date, location, reason } = req.body;

    if (!date || !location || !reason) {
      return res.json({ code: 400, msg: '外勤信息不完整' });
    }

    const approvalNo = 'FLD' + Date.now().toString().slice(-8);

    const approval = await prisma.oa_approval.create({
      data: {
        approval_no: approvalNo,
        type: 'fieldwork',
        title: '外勤申请',
        content: `地点: ${location}\n原因: ${reason}`,
        applicant_id: BigInt(user.id),
        dept_id: BigInt(1),
        status: 'pending',
        create_time: new Date(),
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: approval, msg: '外勤申请已提交' });
  } catch (error) {
    console.error('[Fieldwork Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
