import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient() as any;

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 考勤规则配置
const ATTENDANCE_RULES = {
  work_start: '09:00',
  work_end: '18:00',
  flexible_minutes: 30,
  late_threshold: 30,
  early_leave_threshold: 30
};

// 打卡
router.post('/clock', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { type, location, latitude, longitude, device_info } = req.body;

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
      const flexibleTime = new Date(workStartTime);
      flexibleTime.setMinutes(flexibleTime.getMinutes() + ATTENDANCE_RULES.flexible_minutes);

      let status = 'normal';
      if (now > flexibleTime) {
        const lateMinutes = Math.floor((now.getTime() - workStartTime.getTime()) / 60000);
        if (lateMinutes > ATTENDANCE_RULES.late_threshold) {
          status = 'late';
        }
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
            clock_in_device: device_info || '',
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
            clock_in_device: device_info || '',
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
      const flexibleEndTime = new Date(workEndTime);
      flexibleEndTime.setMinutes(flexibleEndTime.getMinutes() - ATTENDANCE_RULES.flexible_minutes);

      let outStatus = 'normal';
      if (now < flexibleEndTime) {
        const earlyMinutes = Math.floor((workEndTime.getTime() - now.getTime()) / 60000);
        if (earlyMinutes > ATTENDANCE_RULES.early_leave_threshold) {
          outStatus = 'early_leave';
        }
      }

      // 计算工作时长
      const workHours = (now.getTime() - existingRecord.clock_in_time.getTime()) / 3600000;

      await prisma.oa_attendance.update({
        where: { id: existingRecord.id },
        data: {
          clock_out_time: now,
          clock_out_location: location || '',
          clock_out_latitude: latitude || null,
          clock_out_longitude: longitude || null,
          clock_out_device: device_info || '',
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
    } else if (start_date) {
      where.attend_date = { gte: new Date(start_date as string) };
    } else if (end_date) {
      where.attend_date = { lte: new Date(end_date as string) };
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
    const userIds = [...new Set(records.map((r: any) => r.user_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true, dept_id: true }
    });
    const userMap = new Map(users.map((u: any) => [u.id, u.real_name]));

    const data = records.map((r: any) => ({
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
    console.error('[Get Attendance Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 考勤统计
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { month, user_id } = req.query;
    const targetUserId = user_id ? BigInt(user_id as string) : BigInt(user.id);
    const isAdmin = user.username === 'admin';

    // 非管理员只能查看自己的统计
    if (!isAdmin && user_id && BigInt(user_id as string) !== BigInt(user.id)) {
      return res.json({ code: 403, msg: '权限不足' });
    }

    const monthStart = new Date(month as string + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const records = await prisma.oa_attendance.findMany({
      where: {
        user_id: targetUserId,
        attend_date: {
          gte: monthStart,
          lt: monthEnd
        }
      }
    });

    const totalDays = records.length;
    const normalDays = records.filter((r: any) => r.status === 'normal').length;
    const lateDays = records.filter((r: any) => r.status === 'late').length;
    const absentDays = records.filter((r: any) => r.status === 'absent').length;
    const leaveDays = records.filter((r: any) => r.status === 'leave').length;
    const totalWorkHours = records.reduce((sum: number, r: any) => sum + Number(r.work_hours || 0), 0);

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
        status: 'pending'
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
    const { date, start_time, end_time, reason, hours } = req.body;

    if (!date || !start_time || !end_time || !reason) {
      return res.json({ code: 400, msg: '加班信息不完整' });
    }

    // 创建加班审批
    const approvalNo = 'OVT' + Date.now().toString().slice(-8);

    const approval = await prisma.oa_approval.create({
      data: {
        approval_no: approvalNo,
        type: 'overtime',
        title: '加班申请',
        content: reason,
        applicant_id: BigInt(user.id),
        dept_id: BigInt(1),
        status: 'pending'
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
    const { date, location, reason, start_time, end_time } = req.body;

    if (!date || !location || !reason) {
      return res.json({ code: 400, msg: '外勤信息不完整' });
    }

    // 创建外勤审批
    const approvalNo = 'FLD' + Date.now().toString().slice(-8);

    const approval = await prisma.oa_approval.create({
      data: {
        approval_no: approvalNo,
        type: 'fieldwork',
        title: '外勤申请',
        content: `地点: ${location}\n原因: ${reason}`,
        applicant_id: BigInt(user.id),
        dept_id: BigInt(1),
        status: 'pending'
      }
    });

    res.json({ code: 200, data: approval, msg: '外勤申请已提交' });
  } catch (error) {
    console.error('[Fieldwork Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
