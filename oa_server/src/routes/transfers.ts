import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取异动调岗列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, status } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = {};
    if (!isAdmin && reqUser?.id) {
      where.user_id = BigInt(reqUser.id);
    } else if (user_id) {
      where.user_id = BigInt(String(user_id));
    }
    if (status) where.status = String(status);

    const transfers = await prisma.hr_transfer.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set(transfers.map(t => t.user_id))];
    const approverIds = [...new Set(transfers.map(t => t.approver_id).filter((id): id is bigint => id !== null))];

    const [users, approvers] = await Promise.all([
      prisma.sys_user.findMany({ where: { id: { in: userIds } }, select: { id: true, real_name: true, emp_no: true, dept_id: true } }),
      approverIds.length > 0 ? prisma.sys_user.findMany({ where: { id: { in: approverIds } }, select: { id: true, real_name: true } }) : Promise.resolve([])
    ]);

    const deptIds = [...new Set(users.map(u => u.dept_id).filter((id): id is bigint => id !== null))];
    const depts = await prisma.sys_department.findMany({ where: { id: { in: deptIds } }, select: { id: true, dept_name: true } });
    const deptMap = new Map(depts.map(d => [d.id, d.dept_name]));
    const userMap = new Map(users.map(u => [u.id, u]));
    const approverMap = new Map(approvers.map(a => [a.id, a.real_name]));

    const data = transfers.map(t => ({
      ...t,
      emp_name: userMap.get(t.user_id)?.real_name || '',
      emp_no: userMap.get(t.user_id)?.emp_no || '',
      dept_name: deptMap.get(userMap.get(t.user_id)?.dept_id || BigInt(0)) || '',
      approver_name: t.approver_id ? (approverMap.get(t.approver_id) || '') : ''
    }));

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Transfers Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 创建异动调岗
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const user_id = body.user_id || body.empId;
    const transfer_type = body.transfer_type || body.type;
    const from_dept = body.from_dept || body.fromDept || '';
    const to_dept = body.to_dept || body.toDept || '';
    const from_position = body.from_position || body.fromPosition || '';
    const to_position = body.to_position || body.toPosition || '';
    const effective_date = body.effective_date || body.effectiveDate;
    const reason = body.reason || null;
    const remark = body.remark || null;
    const statusMap: Record<string, string> = { '待审批': 'pending', '已通过': 'approved', '已拒绝': 'rejected', '已生效': 'effective' };
    const status = statusMap[body.status] || body.status || 'pending';

    if (!user_id || !transfer_type) {
      return res.json({ code: 400, msg: '缺少必填字段' });
    }

    const transfer = await prisma.hr_transfer.create({
      data: {
        user_id: BigInt(user_id),
        transfer_no: 'TRF' + Date.now().toString().slice(-8),
        transfer_type,
        from_dept,
        to_dept,
        from_position,
        to_position,
        effective_date: effective_date ? new Date(effective_date) : new Date(),
        reason,
        remark,
        status
      }
    });

    res.json({ code: 200, data: transfer, msg: '创建成功' });
  } catch (error) {
    console.error('[Create Transfer Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 更新异动调岗
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { transfer_type, from_dept, to_dept, from_position, to_position, effective_date, reason, status, remark } = req.body;

    const updateData: any = { update_time: new Date() };
    if (transfer_type !== undefined) updateData.transfer_type = transfer_type;
    if (from_dept !== undefined) updateData.from_dept = from_dept;
    if (to_dept !== undefined) updateData.to_dept = to_dept;
    if (from_position !== undefined) updateData.from_position = from_position;
    if (to_position !== undefined) updateData.to_position = to_position;
    if (effective_date !== undefined) updateData.effective_date = new Date(effective_date);
    if (reason !== undefined) updateData.reason = reason;
    if (status !== undefined) {
      const statusMap: Record<string, string> = { '待审批': 'pending', '已通过': 'approved', '已拒绝': 'rejected', '已生效': 'effective' };
      updateData.status = statusMap[status] || status;
    }
    if (remark !== undefined) updateData.remark = remark;

    const updated = await prisma.hr_transfer.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新成功' });
  } catch (error) {
    console.error('[Update Transfer Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
