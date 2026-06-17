import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ========== 1. 获取报销列表 (F-OA-EXPENSE) ==========
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, status, type } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';
    
    const where: any = { is_deleted: 0 };
    
    if (!isAdmin && reqUser?.id) {
      where.user_id = BigInt(reqUser.id);
    } else if (user_id) {
      where.user_id = BigInt(String(user_id));
    }
    
    if (status) {
      where.status = String(status);
    }
    if (type) {
      where.type = String(type);
    }

    const expenses = await prisma.oa_expense.findMany({
      where,
      orderBy: { create_time: 'desc' }
    });

    // 获取关联的用户姓名
    const userIds = [...new Set(expenses.map(e => e.user_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true, dept_id: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // 获取每个报销单的详情明细
    const expenseIds = expenses.map(e => e.id);
    const details = await prisma.oa_expense_detail.findMany({
      where: { expense_id: { in: expenseIds } }
    });

    // 拼装数据
    const data = expenses.map(e => {
      const user = userMap.get(e.user_id);
      return {
        ...e,
        real_name: user ? user.real_name : '未知用户',
        details: details.filter(d => d.expense_id === e.id)
      };
    });

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 2. 获取单个报销单详情 ==========
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenseId = BigInt(String(id));

    const expense = await prisma.oa_expense.findFirst({
      where: { id: expenseId, is_deleted: 0 }
    });

    if (!expense) {
      return res.status(404).json({ code: 404, msg: '报销单不存在' });
    }

    const user = await prisma.sys_user.findFirst({
      where: { id: expense.user_id },
      select: { real_name: true }
    });

    const details = await prisma.oa_expense_detail.findMany({
      where: { expense_id: expenseId }
    });

    res.json({
      code: 200,
      data: {
        ...expense,
        real_name: user ? user.real_name : '未知用户',
        details
      },
      msg: 'success'
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 3. 新建报销申请 (F-OA-EXPENSE) ==========
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, type, title, total_amount, reason, details } = req.body;
    
    if (!user_id || !type || !title || !total_amount || !details || !Array.isArray(details)) {
      return res.status(400).json({ code: 400, msg: '参数有误：缺少必填字段' });
    }

    const userId = BigInt(user_id);
    const user = await prisma.sys_user.findUnique({
      where: { id: userId },
      select: { dept_id: true }
    });

    const expenseNo = 'EXP' + Date.now().toString() + Math.floor(100 + Math.random() * 900).toString();

    // 事务创建
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建报销主表
      const expense = await tx.oa_expense.create({
        data: {
          expense_no: expenseNo,
          user_id: userId,
          dept_id: user?.dept_id || null,
          type,
          title,
          total_amount: Number(total_amount),
          status: 'pending',
          reason: reason || ''
        }
      });

      // 2. 创建报销详情表明细
      if (details.length > 0) {
        const detailData = details.map((d: any) => ({
          expense_id: expense.id,
          item_date: new Date(d.item_date),
          category: d.category,
          amount: Number(d.amount),
          description: d.description || '',
          invoice_url: d.invoice_url || ''
        }));

        await tx.oa_expense_detail.createMany({
          data: detailData
        });
      }

      return expense;
    });

    res.json({ code: 200, data: result, msg: '创建报销单成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 4. 修改报销申请 (仅 pending 可改) ==========
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenseId = BigInt(String(id));
    const { type, title, total_amount, reason, details } = req.body;

    const existing = await prisma.oa_expense.findFirst({
      where: { id: expenseId, is_deleted: 0 }
    });

    if (!existing) {
      return res.status(404).json({ code: 404, msg: '报销单不存在' });
    }

    if (existing.status !== 'pending' && existing.status !== 'rejected') {
      return res.status(422).json({ code: 422, msg: '只有待审批或被驳回的报销单才能修改' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. 更新主表
      await tx.oa_expense.update({
        where: { id: expenseId },
        data: {
          type: type || existing.type,
          title: title || existing.title,
          total_amount: total_amount !== undefined ? Number(total_amount) : existing.total_amount,
          reason: reason || existing.reason,
          status: 'pending', // 重新提交后恢复为待审批
          update_time: new Date()
        }
      });

      // 2. 覆盖详情明细
      if (details && Array.isArray(details)) {
        await tx.oa_expense_detail.deleteMany({
          where: { expense_id: expenseId }
        });

        if (details.length > 0) {
          const detailData = details.map((d: any) => ({
            expense_id: expenseId,
            item_date: new Date(d.item_date),
            category: d.category,
            amount: Number(d.amount),
            description: d.description || '',
            invoice_url: d.invoice_url || ''
          }));

          await tx.oa_expense_detail.createMany({
            data: detailData
          });
        }
      }
    });

    res.json({ code: 200, msg: '更新报销单成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 5. 删除报销单 (软删除) ==========
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenseId = BigInt(String(id));

    const existing = await prisma.oa_expense.findFirst({
      where: { id: expenseId, is_deleted: 0 }
    });

    if (!existing) {
      return res.status(404).json({ code: 404, msg: '报销单不存在' });
    }

    await prisma.oa_expense.update({
      where: { id: expenseId },
      data: { is_deleted: 1, update_time: new Date() }
    });

    res.json({ code: 200, msg: '删除报销单成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 6. 审批通过 (F-OA-EXPENSE) ==========
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenseId = BigInt(String(id));

    const existing = await prisma.oa_expense.findFirst({
      where: { id: expenseId, is_deleted: 0 }
    });

    if (!existing) {
      return res.status(404).json({ code: 404, msg: '报销单不存在' });
    }

    if (existing.status !== 'pending') {
      return res.status(422).json({ code: 422, msg: '该报销单状态不支持审批' });
    }

    const updated = await prisma.oa_expense.update({
      where: { id: expenseId },
      data: {
        status: 'approved',
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: updated, msg: '审批通过' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 7. 审批拒绝 (F-OA-EXPENSE) ==========
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenseId = BigInt(String(id));
    const { remark } = req.body; // 驳回原因

    const existing = await prisma.oa_expense.findFirst({
      where: { id: expenseId, is_deleted: 0 }
    });

    if (!existing) {
      return res.status(404).json({ code: 404, msg: '报销单不存在' });
    }

    if (existing.status !== 'pending') {
      return res.status(422).json({ code: 422, msg: '该报销单状态不支持驳回' });
    }

    const updated = await prisma.oa_expense.update({
      where: { id: expenseId },
      data: {
        status: 'rejected',
        financial_remark: remark || '审批拒绝',
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: updated, msg: '已成功驳回' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 8. 财务打款核销 (F-OA-EXPENSE) ==========
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenseId = BigInt(String(id));
    const { remark } = req.body; // 财务批注

    const existing = await prisma.oa_expense.findFirst({
      where: { id: expenseId, is_deleted: 0 }
    });

    if (!existing) {
      return res.status(404).json({ code: 404, msg: '报销单不存在' });
    }

    if (existing.status !== 'approved') {
      return res.status(422).json({ code: 422, msg: '只有审批通过的报销单才可以进行核销' });
    }

    const updated = await prisma.oa_expense.update({
      where: { id: expenseId },
      data: {
        status: 'verified',
        financial_remark: remark || '财务已核销打款',
        verify_time: new Date(),
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: updated, msg: '打款核销成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
