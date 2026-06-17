import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 获取工资条列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { period, user_id, page = 1, pageSize = 20 } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = {};
    if (period) where.month = period;

    // 非管理员只能看到自己的工资条
    if (!isAdmin) {
      where.user_id = BigInt(userId);
    } else if (user_id) {
      where.user_id = BigInt(user_id as string);
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [salaries, total] = await Promise.all([
      prisma.oa_salary.findMany({
        where,
        orderBy: { month: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.oa_salary.count({ where })
    ]);

    // 获取用户信息
    const userIds = [...new Set(salaries.map(s => s.user_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true, dept_id: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    const data = salaries.map(s => ({
      ...s,
      user_name: userMap.get(s.user_id) || ''
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
    console.error('[Get Salary Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 确认工资条
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { salary_id } = req.body;

    if (!salary_id) {
      return res.json({ code: 400, msg: '工资条ID不能为空' });
    }

    // 检查工资条
    const salary = await prisma.oa_salary.findFirst({
      where: { id: BigInt(salary_id) }
    });

    if (!salary) {
      return res.json({ code: 404, msg: '工资条不存在' });
    }

    // 权限检查：只能确认自己的工资条
    if (String(salary.user_id) !== String(user.id)) {
      return res.json({ code: 403, msg: '权限不足，只能确认自己的工资条' });
    }

    // 更新工资条确认状态
    await prisma.oa_salary.update({
      where: { id: BigInt(salary_id) },
      data: {
        status: 'paid',
        update_time: new Date()
      }
    });

    res.json({ code: 200, msg: '确认成功' });
  } catch (error) {
    console.error('[Confirm Salary Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 提出异议
router.post('/objection', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { salary_id, content } = req.body;

    if (!salary_id || !content) {
      return res.json({ code: 400, msg: '工资条ID和异议内容不能为空' });
    }

    // 检查工资条
    const salary = await prisma.oa_salary.findFirst({
      where: { id: BigInt(salary_id) }
    });

    if (!salary) {
      return res.json({ code: 404, msg: '工资条不存在' });
    }

    // 权限检查
    if (String(salary.user_id) !== String(user.id)) {
      return res.json({ code: 403, msg: '权限不足' });
    }

    // 更新工资条状态
    await prisma.oa_salary.update({
      where: { id: BigInt(salary_id) },
      data: {
        status: 'draft',
        update_time: new Date()
      }
    });

    res.json({ code: 200, msg: '异议已提交' });
  } catch (error) {
    console.error('[Salary Objection Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取工资条详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const salary = await prisma.oa_salary.findFirst({
      where: { id: BigInt(String(id)) }
    });

    if (!salary) {
      return res.json({ code: 404, msg: '工资条不存在' });
    }

    // 权限检查：只能查看自己的工资条（管理员除外）
    if (String(salary.user_id) !== String(user.id) && user.username !== 'admin') {
      return res.json({ code: 403, msg: '权限不足' });
    }

    // 获取用户信息
    const userInfo = await prisma.sys_user.findFirst({
      where: { id: salary.user_id, is_deleted: 0 },
      select: { id: true, real_name: true, dept_id: true }
    });

    const data = {
      ...salary,
      user_name: userInfo?.real_name || ''
    };

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Salary Detail Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 薪资统计
router.get('/statistics/summary', async (req: Request, res: Response) => {
  try {
    const { period, dept_id } = req.query;

    const where: any = {};
    if (period) where.month = period;

    if (dept_id) {
      const deptUsers = await prisma.sys_user.findMany({
        where: { dept_id: BigInt(dept_id as string), is_deleted: 0 },
        select: { id: true }
      });
      where.user_id = { in: deptUsers.map(u => u.id) };
    }

    const salaries = await prisma.oa_salary.findMany({ where });

    const total = salaries.length;
    const totalBase = salaries.reduce((sum, s) => sum + Number(s.base_salary || 0), 0);
    const totalBonus = salaries.reduce((sum, s) => sum + Number(s.performance_bonus || 0), 0);
    const totalDeduction = salaries.reduce((sum, s) => sum + Number(s.social_security || 0) + Number(s.housing_fund || 0) + Number(s.income_tax || 0), 0);
    const totalActual = salaries.reduce((sum, s) => sum + Number(s.net_salary || 0), 0);

    res.json({
      code: 200,
      data: {
        total,
        total_base: Math.round(totalBase * 100) / 100,
        total_bonus: Math.round(totalBonus * 100) / 100,
        total_deduction: Math.round(totalDeduction * 100) / 100,
        total_actual: Math.round(totalActual * 100) / 100,
        average_actual: total > 0 ? Math.round((totalActual / total) * 100) / 100 : 0
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Salary Statistics Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
