import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取离职列表
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

    const offboardings = await prisma.hr_offboarding.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set(offboardings.map(o => o.user_id))];
    const approverIds = [...new Set(offboardings.map(o => o.approver_id).filter((id): id is bigint => id !== null))];

    const [users, approvers] = await Promise.all([
      prisma.sys_user.findMany({ where: { id: { in: userIds } }, select: { id: true, real_name: true, emp_no: true, dept_id: true, position_id: true } }),
      approverIds.length > 0 ? prisma.sys_user.findMany({ where: { id: { in: approverIds } }, select: { id: true, real_name: true } }) : Promise.resolve([])
    ]);

    const deptIds = [...new Set(users.map(u => u.dept_id).filter((id): id is bigint => id !== null))];
    const posIds = [...new Set(users.map(u => u.position_id).filter((id): id is bigint => id !== null))];
    const [depts, positions] = await Promise.all([
      prisma.sys_department.findMany({ where: { id: { in: deptIds } }, select: { id: true, dept_name: true } }),
      posIds.length > 0 ? prisma.sys_position.findMany({ where: { id: { in: posIds } }, select: { id: true, pos_name: true } }) : Promise.resolve([])
    ]);

    const deptMap = new Map(depts.map(d => [d.id, d.dept_name]));
    const posMap = new Map(positions.map(p => [p.id, p.pos_name]));
    const userMap = new Map(users.map(u => [u.id, u]));
    const approverMap = new Map(approvers.map(a => [a.id, a.real_name]));

    const data = offboardings.map(o => ({
      ...o,
      emp_name: userMap.get(o.user_id)?.real_name || '',
      emp_no: userMap.get(o.user_id)?.emp_no || '',
      dept_name: deptMap.get(userMap.get(o.user_id)?.dept_id || BigInt(0)) || '',
      position_name: posMap.get(userMap.get(o.user_id)?.position_id || BigInt(0)) || '',
      approver_name: o.approver_id ? (approverMap.get(o.approver_id) || '') : ''
    }));

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Offboardings Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 创建离职申请
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const user_id = body.user_id || body.empId;
    const offboard_type = body.offboard_type || body.type || '主动辞职';
    const apply_date = body.apply_date || body.applyDate;
    const last_work_date = body.last_work_date || body.lastWorkDate;
    const reason = body.reason || null;
    const remark = body.remark || null;
    const statusMap: Record<string, string> = { '待审批': 'pending', '审批中': 'reviewing', '已通过': 'approved', '已完成': 'completed', '已拒绝': 'rejected' };
    const status = statusMap[body.status] || body.status || 'pending';
    const hsMap: Record<string, string> = { '未交接': 'pending', '交接中': 'in_progress', '已交接': 'completed' };
    const handover_status = hsMap[body.handover_status] || body.handover_status || 'pending';

    if (!user_id) {
      return res.json({ code: 400, msg: '缺少用户ID' });
    }

    const offboarding = await prisma.hr_offboarding.create({
      data: {
        user_id: BigInt(user_id),
        offboard_no: 'OFF' + Date.now().toString().slice(-8),
        offboard_type,
        apply_date: apply_date ? new Date(apply_date) : new Date(),
        last_work_date: last_work_date ? new Date(last_work_date) : null,
        reason,
        remark,
        status,
        handover_status
      }
    });

    res.json({ code: 200, data: offboarding, msg: '创建成功' });
  } catch (error) {
    console.error('[Create Offboarding Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 更新离职申请
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { offboard_type, apply_date, last_work_date, reason, handover_status, status, archive_status, remark } = req.body;

    const updateData: any = { update_time: new Date() };
    if (offboard_type !== undefined) updateData.offboard_type = offboard_type;
    if (apply_date !== undefined) updateData.apply_date = new Date(apply_date);
    if (last_work_date !== undefined) updateData.last_work_date = new Date(last_work_date);
    if (reason !== undefined) updateData.reason = reason;
    if (handover_status !== undefined) {
      const hsMap: Record<string, string> = { '未交接': 'pending', '交接中': 'in_progress', '已交接': 'completed' };
      updateData.handover_status = hsMap[handover_status] || handover_status;
    }
    if (status !== undefined) {
      const statusMap: Record<string, string> = { '待审批': 'pending', '审批中': 'reviewing', '已通过': 'approved', '已完成': 'completed', '已拒绝': 'rejected' };
      updateData.status = statusMap[status] || status;
    }
    if (archive_status !== undefined) updateData.archive_status = archive_status;
    if (remark !== undefined) updateData.remark = remark;

    const updated = await prisma.hr_offboarding.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新成功' });
  } catch (error) {
    console.error('[Update Offboarding Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
