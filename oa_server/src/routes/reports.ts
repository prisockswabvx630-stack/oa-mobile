import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 考勤报表
router.get('/attendance', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { month, dept_id } = req.query;
    const isAdmin = user.username === 'admin';

    if (!month) {
      return res.json({ code: 400, msg: '月份参数不能为空' });
    }

    const monthStart = new Date(month as string + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    // 获取部门下的用户
    let userWhere: any = { is_deleted: 0, status: 1 };
    if (dept_id) {
      userWhere.dept_id = BigInt(dept_id as string);
    }

    const users = await prisma.sys_user.findMany({
      where: userWhere,
      select: { id: true, real_name: true, dept_id: true }
    });

    const userIds = users.map(u => u.id);

    // 获取考勤记录
    const attendanceRecords = await prisma.oa_attendance.findMany({
      where: {
        user_id: { in: userIds },
        attend_date: { gte: monthStart, lt: monthEnd }
      }
    });

    // 统计每个用户的考勤情况
    const userStats = users.map(u => {
      const userRecords = attendanceRecords.filter(r => r.user_id === u.id);
      const totalDays = userRecords.length;
      const normalDays = userRecords.filter(r => r.status === 'normal').length;
      const lateDays = userRecords.filter(r => r.status === 'late').length;
      const absentDays = userRecords.filter(r => r.status === 'absent').length;
      const leaveDays = userRecords.filter(r => r.status === 'leave').length;
      const totalWorkHours = userRecords.reduce((sum, r) => sum + Number(r.work_hours || 0), 0);

      return {
        user_id: u.id,
        user_name: u.real_name,
        dept_id: u.dept_id,
        total_days: totalDays,
        normal_days: normalDays,
        late_days: lateDays,
        absent_days: absentDays,
        leave_days: leaveDays,
        work_hours: Math.round(totalWorkHours * 100) / 100,
        attendance_rate: totalDays > 0 ? Math.round((normalDays / totalDays) * 100) : 0
      };
    });

    // 汇总统计
    const summary = {
      total_users: users.length,
      total_days: userStats.reduce((sum, s) => sum + s.total_days, 0),
      total_normal: userStats.reduce((sum, s) => sum + s.normal_days, 0),
      total_late: userStats.reduce((sum, s) => sum + s.late_days, 0),
      total_absent: userStats.reduce((sum, s) => sum + s.absent_days, 0),
      total_leave: userStats.reduce((sum, s) => sum + s.leave_days, 0),
      total_work_hours: Math.round(userStats.reduce((sum, s) => sum + s.work_hours, 0) * 100) / 100
    };

    res.json({
      code: 200,
      data: {
        summary,
        details: userStats
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Attendance Report Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 人事报表
router.get('/hr', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { dept_id } = req.query;

    // 获取部门下的用户
    let userWhere: any = { is_deleted: 0 };
    if (dept_id) {
      userWhere.dept_id = BigInt(dept_id as string);
    }

    const users = await prisma.sys_user.findMany({
      where: userWhere,
      include: {
        sys_department: { select: { id: true, dept_name: true } },
        sys_position: { select: { id: true, pos_name: true } }
      }
    });

    // 人员结构统计
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 1).length;
    const inactiveUsers = users.filter(u => u.status === 0).length;

    // 按部门统计
    const deptStats = new Map();
    users.forEach(u => {
      const deptName = u.sys_department?.dept_name || '未分配';
      if (!deptStats.has(deptName)) {
        deptStats.set(deptName, { dept_name: deptName, count: 0 });
      }
      deptStats.get(deptName).count++;
    });

    // 按岗位统计
    const posStats = new Map();
    users.forEach(u => {
      const posName = u.sys_position?.pos_name || '未分配';
      if (!posStats.has(posName)) {
        posStats.set(posName, { pos_name: posName, count: 0 });
      }
      posStats.get(posName).count++;
    });

    // 按性别统计
    const genderStats = {
      male: users.filter(u => u.gender === 1).length,
      female: users.filter(u => u.gender === 0).length,
      unknown: users.filter(u => u.gender === null || u.gender === undefined).length
    };

    // 入职时间分布（按月）
    const entryStats = new Map();
    users.forEach(u => {
      if (u.entry_date) {
        const month = u.entry_date.toISOString().slice(0, 7);
        if (!entryStats.has(month)) {
          entryStats.set(month, { month, count: 0 });
        }
        entryStats.get(month).count++;
      }
    });

    res.json({
      code: 200,
      data: {
        summary: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        by_department: Array.from(deptStats.values()),
        by_position: Array.from(posStats.values()),
        by_gender: genderStats,
        by_entry_date: Array.from(entryStats.values()).sort((a, b) => a.month.localeCompare(b.month))
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[HR Report Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 薪资报表
router.get('/salary', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { month, dept_id } = req.query;
    const isAdmin = user.username === 'admin';

    if (!month) {
      return res.json({ code: 400, msg: '月份参数不能为空' });
    }

    // 获取薪资记录
    let salaryWhere: any = { period: month as string };
    if (dept_id) {
      // 需要关联用户表来过滤部门
      const deptUsers = await prisma.sys_user.findMany({
        where: { dept_id: BigInt(dept_id as string), is_deleted: 0 },
        select: { id: true }
      });
      const deptUserIds = deptUsers.map(u => u.id);
      salaryWhere.user_id = { in: deptUserIds };
    }

    const salaries = await prisma.oa_salary.findMany({
      where: salaryWhere
    });

    // 获取用户信息
    const userIds = [...new Set(salaries.map(s => s.user_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true, dept_id: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    // 薪资统计
    const totalBase = salaries.reduce((sum, s) => sum + Number(s.base_salary || 0), 0);
    const totalBonus = salaries.reduce((sum, s) => sum + Number(s.performance_bonus || 0), 0);
    const totalDeduction = salaries.reduce((sum, s) => sum + Number(s.social_security || 0) + Number(s.housing_fund || 0) + Number(s.income_tax || 0), 0);
    const totalNet = salaries.reduce((sum, s) => sum + Number(s.net_salary || 0), 0);

    const details = salaries.map(s => ({
      ...s,
      user_name: userMap.get(s.user_id) || ''
    }));

    res.json({
      code: 200,
      data: {
        summary: {
          total_records: salaries.length,
          total_base: Math.round(totalBase * 100) / 100,
          total_bonus: Math.round(totalBonus * 100) / 100,
          total_deduction: Math.round(totalDeduction * 100) / 100,
          total_net: Math.round(totalNet * 100) / 100,
          average_net: salaries.length > 0 ? Math.round((totalNet / salaries.length) * 100) / 100 : 0
        },
        details
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Salary Report Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 任务报表
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { project_id, month } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    let taskWhere: any = { is_deleted: 0 };
    if (project_id) {
      taskWhere.project_id = BigInt(project_id as string);
    }
    if (month) {
      const monthStart = new Date(month as string + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      taskWhere.create_time = { gte: monthStart, lt: monthEnd };
    }

    // 非管理员只能看到自己的任务
    if (!isAdmin) {
      taskWhere.OR = [
        { assignee_id: BigInt(userId) },
        { creator_id: BigInt(userId) }
      ];
    }

    const tasks = await prisma.oa_task.findMany({
      where: taskWhere
    });

    // 任务统计
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

    // 按优先级统计
    const priorityStats = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    // 按负责人统计
    const assigneeStats = new Map();
    tasks.forEach(t => {
      const assigneeId = String(t.assignee_id);
      if (!assigneeStats.has(assigneeId)) {
        assigneeStats.set(assigneeId, { assignee_id: assigneeId, total: 0, completed: 0 });
      }
      assigneeStats.get(assigneeId).total++;
      if (t.status === 'completed') {
        assigneeStats.get(assigneeId).completed++;
      }
    });

    res.json({
      code: 200,
      data: {
        summary: {
          total: totalTasks,
          completed: completedTasks,
          in_progress: inProgressTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
          completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        by_priority: priorityStats,
        by_assignee: Array.from(assigneeStats.values())
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Task Report Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 资产报表
router.get('/assets', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);

    const assets = await prisma.oa_asset.findMany({
      where: { is_deleted: 0 }
    });

    // 资产统计
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, a) => sum + Number(a.current_value || a.original_value || 0), 0);

    // 按状态统计
    const statusStats = {
      idle: assets.filter(a => a.status === 'idle').length,
      in_use: assets.filter(a => a.status === 'in_use').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length,
      scrapped: assets.filter(a => a.status === 'scrapped').length
    };

    // 按类型统计
    const typeStats = new Map();
    assets.forEach(a => {
      const type = a.category || '未分类';
      if (!typeStats.has(type)) {
        typeStats.set(type, { type, count: 0, value: 0 });
      }
      typeStats.get(type).count++;
      typeStats.get(type).value += Number(a.current_value || a.original_value || 0);
    });

    res.json({
      code: 200,
      data: {
        summary: {
          total: totalAssets,
          total_value: Math.round(totalValue * 100) / 100
        },
        by_status: statusStats,
        by_type: Array.from(typeStats.values())
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Asset Report Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
