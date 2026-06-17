import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getParam = (req: Request, name: string): string => {
  const val = req.params[name];
  if (Array.isArray(val)) return val[0] ?? '';
  return val ?? '';
};

// 获取考勤详情
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req, 'id');
    const reqUser = (req as any).user;

    const attendance = await prisma.oa_attendance.findUnique({
      where: { id: BigInt(String(id)) }
    });

    if (!attendance) {
      return res.json({ code: 404, msg: '考勤记录不存在' });
    }

    // 获取用户信息
    const user = await prisma.sys_user.findUnique({
      where: { id: attendance.user_id }
    });

    const detail = {
      ...attendance,
      user_name: user?.real_name || '',
      penalties: [],
      appeals: []
    };

    res.json({ code: 200, data: detail, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取用户考勤汇总（首页和我的页面使用）
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;

    const userId = reqUser?.id ? BigInt(reqUser.id) : BigInt(1);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // 获取本月考勤记录
    const attendanceRecords = await prisma.oa_attendance.findMany({
      where: {
        user_id: userId,
        attend_date: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      orderBy: { attend_date: 'desc' }
    });

    // 获取今日考勤
    const todayStr = today.toISOString().split('T')[0];
    const todayRecord = attendanceRecords.find((r: any) => {
      const rDate = new Date(r.attend_date).toISOString().split('T')[0];
      return rDate === todayStr;
    });

    // 统计本月数据
    const totalDays = attendanceRecords.length;
    const normalDays = attendanceRecords.filter((r: any) => r.status === 'normal').length;
    const lateDays = attendanceRecords.filter((r: any) => r.status === 'late' || r.status === 'late_early').length;
    const earlyDays = attendanceRecords.filter((r: any) => r.status === 'early' || r.status === 'late_early').length;
    const absentDays = attendanceRecords.filter((r: any) => r.status === 'absent').length;
    const overtimeDays = attendanceRecords.filter((r: any) => {
      if (!r.clock_out_time || !r.clock_in_time) return false;
      const workHours = Number(r.work_hours || 0);
      return workHours > 8;
    }).length;

    // 计算总工时
    const totalWorkHours = attendanceRecords.reduce((sum: number, r: any) => sum + Number(r.work_hours || 0), 0);

    // 最近考勤记录（最近5条）
    const recentRecords = attendanceRecords.slice(0, 5).map((r: any) => ({
      id: String(r.id),
      date: r.attend_date,
      clockIn: r.clock_in_time,
      clockOut: r.clock_out_time,
      workHours: Number(r.work_hours || 0),
      status: r.status
    }));

    res.json({
      code: 200,
      data: {
        today: todayRecord ? {
          id: String(todayRecord.id),
          clockIn: todayRecord.clock_in_time,
          clockOut: todayRecord.clock_out_time,
          workHours: Number(todayRecord.work_hours || 0),
          status: todayRecord.status
        } : null,
        monthStats: {
          totalDays,
          normalDays,
          lateDays,
          earlyDays,
          absentDays,
          overtimeDays,
          totalWorkHours: Math.round(totalWorkHours * 100) / 100
        },
        recentRecords
      },
      msg: 'success'
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 计算工资影响
function calculateSalaryImpact(attendance: any) {
  const workHours = Number(attendance.work_hours || 0);
  const baseHourlyRate = 50;

  let impact = {
    type: 'normal',
    amount: 0,
    description: ''
  };

  if (workHours > 8) {
    const overtimeHours = workHours - 8;
    const overtimeRate = 1.5;
    impact = {
      type: 'bonus',
      amount: Math.round(overtimeHours * baseHourlyRate * overtimeRate * 100) / 100,
      description: `加班${overtimeHours}小时`
    };
  }

  return impact;
}

export default router;
