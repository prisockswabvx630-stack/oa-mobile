import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, applicant_id } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = {};
    if (status) where.status = String(status);

    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      if (applicant_id && BigInt(String(applicant_id)) !== userId) {
        where.OR = [
          { applicant_id: BigInt(String(applicant_id)) },
          { current_approver_id: userId }
        ];
      } else {
        where.OR = [
          { applicant_id: userId },
          { current_approver_id: userId }
        ];
      }
    } else if (applicant_id) {
      where.applicant_id = BigInt(String(applicant_id));
    }
    
    const approvals = await prisma.oa_approval.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set(approvals.map(a => a.applicant_id))];
    const users = await prisma.sys_user.findMany({ where: { id: { in: userIds } }, include: { sys_department: { select: { dept_name: true } } } });
    const userMap = new Map(users.map(u => [u.id, u]));
    const data = approvals.map(a => { const applicant = userMap.get(a.applicant_id); return { ...a, applicant_name: applicant?.real_name || '', dept_name: applicant?.sys_department?.dept_name || '' }; });
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/todos', async (req: Request, res: Response) => {
  try {
    const { approverId } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const targetApproverId = (!isAdmin && reqUser?.id) ? BigInt(reqUser.id) : BigInt(String(approverId || '1'));
    const where: any = { status: 'pending', current_approver_id: targetApproverId };
    const approvals = await prisma.oa_approval.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set(approvals.map(a => a.applicant_id))];
    const users = await prisma.sys_user.findMany({ where: { id: { in: userIds } }, include: { sys_department: { select: { dept_name: true } } } });
    const userMap = new Map(users.map(u => [u.id, u]));
    const data = approvals.map(a => { const applicant = userMap.get(a.applicant_id); return { ...a, applicant_name: applicant?.real_name || '', dept_name: applicant?.sys_department?.dept_name || '' }; });
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, title, applicant_name, dept_name, content, status } = req.body;
    let applicantId: bigint = BigInt(1); let deptId: bigint = BigInt(1);
    if (applicant_name) { const u = await prisma.sys_user.findFirst({ where: { real_name: applicant_name, is_deleted: 0 } }); if (u) { applicantId = u.id; if (u.dept_id) deptId = u.dept_id; } }
    const approval = await prisma.oa_approval.create({
      data: { approval_no: 'AP' + Date.now().toString().slice(-6), type: type || '请假', title: title || '', applicant_id: applicantId, dept_id: deptId, content: content || '', status: status === '已通过' ? 'approved' : (status === '已拒绝' ? 'rejected' : 'pending') }
    });
    res.json({ code: 200, data: approval, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

function approvalWhere(id: any) {
  const idStr = String(id);
  return isNaN(Number(idStr)) ? { approval_no: idStr } : { id: BigInt(idStr) };
}

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reject_reason } = req.body;

    const reqUser = (req as any).user;
    if (!reqUser?.id) {
      return res.json({ code: 401, msg: '未登录' });
    }
    const userId = BigInt(reqUser.id);

    // 查找当前审批人的部门和角色
    const user = await prisma.sys_user.findUnique({
      where: { id: userId },
      include: {
        sys_department: true
      }
    });
    if (!user) return res.json({ code: 401, msg: '用户不存在' });

    // 检查是否是超级管理员
    const userRole = await prisma.sys_user_role.findFirst({
      where: { user_id: userId },
      include: { sys_role: true }
    });
    const isSuperAdmin = userRole?.sys_role?.role_code === 'ROLE_ADMIN' || user.username === 'admin';

    // 查找该审批单
    const approval = await prisma.oa_approval.findFirst({
      where: approvalWhere(id)
    });
    if (!approval) return res.json({ code: 404, msg: '审批单不存在' });

    if (!isSuperAdmin) {
      // 查找申请人
      const applicant = await prisma.sys_user.findUnique({
        where: { id: approval.applicant_id },
        include: { sys_department: true }
      });
      
      const approverDept = user.sys_department?.dept_name;
      const applicantDept = applicant?.sys_department?.dept_name;

      if (!approverDept || !applicantDept || approverDept !== applicantDept) {
        return res.json({ code: 403, msg: `权限不足：您属于【${approverDept || '未知部门'}】，无权审批【${applicantDept || '未知部门'}】部门的单据` });
      }
    }

    const dbStatus = status === '已通过' ? 'approved' : (status === '已拒绝' ? 'rejected' : 'pending');
    const updated = await prisma.oa_approval.update({
      where: approvalWhere(id),
      data: { status: dbStatus, reject_reason: reject_reason || null, approved_time: dbStatus !== 'pending' ? new Date() : null, update_time: new Date() }
    });
    res.json({ code: 200, data: updated, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.oa_approval.delete({ where: approvalWhere(id) });
    res.json({ code: 200, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 权限检查：只有有审批权限的人才能审批
    const reqUser = (req as any).user;
    if (!reqUser?.id) {
      return res.json({ code: 401, msg: '未登录' });
    }
    const userId = BigInt(reqUser.id);

    const userRole = await prisma.sys_user_role.findFirst({
      where: { user_id: userId },
      include: { sys_role: true }
    });
    const user = await prisma.sys_user.findUnique({ where: { id: userId } });
    const isSuperAdmin = userRole?.sys_role?.role_code === 'ROLE_ADMIN' || user?.username === 'admin';

    if (!isSuperAdmin) {
      // 检查是否有审批权限
      if (userRole?.role_id) {
        const rolePerms = await prisma.sys_role_permission.findMany({
          where: { role_id: userRole.role_id },
          include: { sys_permission: true }
        });
        const hasApprovalPerm = rolePerms.some(rp => rp.sys_permission?.permission_code === 'office:approval');
        if (!hasApprovalPerm) {
          return res.json({ code: 403, msg: '权限不足：您没有审批权限' });
        }
      } else {
        return res.json({ code: 403, msg: '权限不足：您没有审批权限' });
      }
    }

    const updated = await prisma.oa_approval.update({
      where: approvalWhere(id),
      data: { status: 'approved', approved_time: new Date(), update_time: new Date() }
    });
    res.json({ code: 200, data: updated, msg: '审批通过' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // 权限检查：只有有审批权限的人才能审批
    const reqUser = (req as any).user;
    if (!reqUser?.id) {
      return res.json({ code: 401, msg: '未登录' });
    }
    const userId = BigInt(reqUser.id);

    const userRole = await prisma.sys_user_role.findFirst({
      where: { user_id: userId },
      include: { sys_role: true }
    });
    const user = await prisma.sys_user.findUnique({ where: { id: userId } });
    const isSuperAdmin = userRole?.sys_role?.role_code === 'ROLE_ADMIN' || user?.username === 'admin';

    if (!isSuperAdmin) {
      // 检查是否有审批权限
      if (userRole?.role_id) {
        const rolePerms = await prisma.sys_role_permission.findMany({
          where: { role_id: userRole.role_id },
          include: { sys_permission: true }
        });
        const hasApprovalPerm = rolePerms.some(rp => rp.sys_permission?.permission_code === 'office:approval');
        if (!hasApprovalPerm) {
          return res.json({ code: 403, msg: '权限不足：您没有审批权限' });
        }
      } else {
        return res.json({ code: 403, msg: '权限不足：您没有审批权限' });
      }
    }

    const updated = await prisma.oa_approval.update({
      where: approvalWhere(id),
      data: { status: 'rejected', reject_reason: reason || null, approved_time: new Date(), update_time: new Date() }
    });
    res.json({ code: 200, data: updated, msg: '审批拒绝' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // 权限检查：只有申请人自己才能撤回
    const reqUser = (req as any).user;
    if (!reqUser?.id) {
      return res.json({ code: 401, msg: '未登录' });
    }
    const userId = BigInt(reqUser.id);

    const approval = await prisma.oa_approval.findFirst({
      where: approvalWhere(id)
    });
    if (!approval) return res.json({ code: 404, msg: '审批单不存在' });

    // 检查是否是超级管理员或申请人本人
    const userRole = await prisma.sys_user_role.findFirst({
      where: { user_id: userId },
      include: { sys_role: true }
    });
    const user = await prisma.sys_user.findUnique({ where: { id: userId } });
    const isSuperAdmin = userRole?.sys_role?.role_code === 'ROLE_ADMIN' || user?.username === 'admin';

    if (!isSuperAdmin && approval.applicant_id !== userId) {
      return res.json({ code: 403, msg: '权限不足：只有申请人本人可以撤回此审批' });
    }

    const updated = await prisma.oa_approval.update({
      where: approvalWhere(id),
      data: { status: 'cancelled', cancel_reason: reason || null, update_time: new Date() }
    });
    res.json({ code: 200, data: updated, msg: '取消审批成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
