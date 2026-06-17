import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

const getParam = (req: Request, name: string): string => {
  const val = req.params[name];
  if (Array.isArray(val)) return val[0] ?? '';
  return val ?? '';
};

// 获取审批流程模板
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.oa_process_template.findMany({
      where: { is_deleted: 0 },
      orderBy: { create_time: 'desc' }
    });
    res.json({ code: 200, data: templates, msg: 'success' });
  } catch (error) {
    console.error('[Get Templates Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 创建审批流程模板
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { name, type, description, steps } = req.body;

    if (!name || !type) {
      return res.json({ code: 400, msg: '模板名称和类型不能为空' });
    }

    const templateCode = 'TPL' + Date.now().toString().slice(-8);

    const template = await prisma.oa_process_template.create({
      data: {
        template_code: templateCode,
        template_name: name,
        type,
        nodes: JSON.stringify(steps || []),
        status: 1
      }
    });

    res.json({ code: 200, data: template, msg: '创建成功' });
  } catch (error) {
    console.error('[Create Template Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取审批列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { status, type, page = 1, pageSize = 20 } = req.query;
    const userId = BigInt(user.id || 1);
    const isAdmin = user.username === 'admin';

    const where: any = {};

    // 非管理员只能看到自己的审批
    if (!isAdmin) {
      where.OR = [
        { applicant_id: userId },
        { current_approver_id: userId }
      ];
    }

    if (status) where.status = String(status);
    if (type) where.type = String(type);

    const skip = (Number(page) - 1) * Number(pageSize);

    const [approvals, total] = await Promise.all([
      prisma.oa_approval.findMany({
        where,
        orderBy: { create_time: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.oa_approval.count({ where })
    ]);

    // 获取申请人和审批人信息
    const userIds = [...new Set([
      ...approvals.map((a: any) => a.applicant_id),
      ...approvals.filter((a: any) => a.current_approver_id).map((a: any) => a.current_approver_id!)
    ])];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true, dept_id: true }
    });
    const userMap = new Map(users.map((u: any) => [u.id, u.real_name]));

    const data = approvals.map((a: any) => ({
      ...a,
      applicant_name: userMap.get(a.applicant_id) || '',
      approver_name: a.current_approver_id ? (userMap.get(a.current_approver_id) || '') : ''
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
    console.error('[Get Approvals Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 提交审批申请
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { type, title, content } = req.body;

    if (!type || !title) {
      return res.json({ code: 400, msg: '审批类型和标题不能为空' });
    }

    // 生成审批编号
    const approvalNo = 'APR' + Date.now().toString().slice(-8);

    // 获取审批流程模板
    const template = await prisma.oa_process_template.findFirst({
      where: { type, status: 1, is_deleted: 0 }
    });

    let nodes: any[] = [];
    if (template) {
      nodes = JSON.parse(template.nodes as string || '[]');
    }

    // 默认审批流程
    if (nodes.length === 0) {
      // 获取申请人部门主管
      const applicant = await prisma.sys_user.findFirst({
        where: { id: BigInt(String(user.id)), is_deleted: 0 }
      });

      if (applicant && applicant.dept_id) {
        const dept = await prisma.sys_department.findFirst({
          where: { id: applicant.dept_id, is_deleted: 0 }
        });

        if (dept && dept.leader_id) {
          nodes.push({
            step: 1,
            name: '部门主管审批',
            approver_id: Number(dept.leader_id),
            approver_name: '部门主管'
          });
        }
      }
    }

    // 确定第一个审批人
    const firstApprover = nodes.length > 0 ? BigInt(nodes[0].approver_id) : null;

    const approval = await prisma.oa_approval.create({
      data: {
        approval_no: approvalNo,
        type,
        title,
        content: content || JSON.stringify(req.body),
        applicant_id: BigInt(String(user.id)),
        dept_id: BigInt(1),
        current_approver_id: firstApprover,
        current_node: nodes.length > 0 ? nodes[0].name : null,
        status: 'pending'
      }
    });

    // 创建审批流程节点
    if (nodes.length > 0) {
      await prisma.oa_approval_flow.createMany({
        data: nodes.map((n: any, idx: number) => ({
          approval_id: approval.id,
          node_name: n.name,
          node_order: idx + 1,
          approver_id: BigInt(n.approver_id),
          approver_name: n.approver_name || '',
          approver_type: 'user',
          status: idx === 0 ? 'pending' : 'waiting'
        }))
      });
    }

    res.json({ code: 200, data: approval, msg: '提交成功' });
  } catch (error) {
    console.error('[Create Approval Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 审批操作
router.post('/:id/action', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const id = getParam(req, 'id');
    const { action, remark } = req.body;

    if (!action) {
      return res.json({ code: 400, msg: '审批动作不能为空' });
    }

    const approval = await prisma.oa_approval.findFirst({
      where: { id: BigInt(String(id)) }
    });

    if (!approval) {
      return res.json({ code: 404, msg: '审批记录不存在' });
    }

    if (approval.status !== 'pending') {
      return res.json({ code: 400, msg: '该审批已处理' });
    }

    // 获取审批流程节点
    const flows = await prisma.oa_approval_flow.findMany({
      where: { approval_id: BigInt(String(id)) },
      orderBy: { node_order: 'asc' }
    });

    const currentFlow = flows.find((f: any) => f.status === 'pending');
    const totalSteps = flows.length;
    const currentStepIdx = currentFlow ? flows.indexOf(currentFlow) : 0;

    // 验证是否是当前步骤的审批人
    if (currentFlow && Number(currentFlow.approver_id) !== Number(user.id) && user.username !== 'admin') {
      return res.json({ code: 403, msg: '您不是当前步骤的审批人' });
    }

    let newStatus = approval.status;
    let approvedTime = null;

    switch (action) {
      case 'approve':
        // 更新当前节点为已完成
        if (currentFlow) {
          await prisma.oa_approval_flow.update({
            where: { id: currentFlow.id },
            data: {
              status: 'approved',
              opinion: remark || '',
              handle_time: new Date()
            }
          });
        }

        if (currentStepIdx >= totalSteps - 1) {
          // 最后一步，审批完成
          newStatus = 'approved';
          approvedTime = new Date();
        } else {
          // 进入下一步
          const nextFlow = flows[currentStepIdx + 1];
          if (nextFlow) {
            await prisma.oa_approval_flow.update({
              where: { id: nextFlow.id },
              data: { status: 'pending' }
            });

            await prisma.oa_approval.update({
              where: { id: BigInt(String(id)) },
              data: {
                current_approver_id: nextFlow.approver_id,
                current_node: nextFlow.node_name,
              update_time: new Date()
            }
          });
        }
        }
        break;

      case 'reject':
        newStatus = 'rejected';
        if (currentFlow) {
          await prisma.oa_approval_flow.update({
            where: { id: currentFlow.id },
            data: {
              status: 'rejected',
              opinion: remark || '',
              handle_time: new Date()
            }
          });
        }
        break;

      default:
        return res.json({ code: 400, msg: '无效的审批动作' });
    }

    // 更新审批记录
    const updateData: any = {
      status: newStatus,
      update_time: new Date()
    };
    if (newStatus === 'rejected') {
      updateData.reject_reason = remark || '';
    }
    if (approvedTime) {
      updateData.approved_time = approvedTime;
    }

    const updated = await prisma.oa_approval.update({
      where: { id: BigInt(String(id)) },
      data: updateData
    });

    res.json({ code: 200, data: updated, msg: '操作成功' });
  } catch (error) {
    console.error('[Approval Action Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取审批详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req, 'id');

    const approval = await prisma.oa_approval.findFirst({
      where: { id: BigInt(String(id)) }
    });

    if (!approval) {
      return res.json({ code: 404, msg: '审批记录不存在' });
    }

    // 获取申请人信息
    const applicant = await prisma.sys_user.findFirst({
      where: { id: approval.applicant_id, is_deleted: 0 },
      select: { id: true, real_name: true, dept_id: true }
    });

    // 获取审批流程记录
    const flows = await prisma.oa_approval_flow.findMany({
      where: { approval_id: BigInt(String(id)) },
      orderBy: { node_order: 'asc' }
    });

    // 获取审批人信息
    const flowUserIds = flows.map((f: any) => f.approver_id).filter(Boolean);
    const flowUsers = await prisma.sys_user.findMany({
      where: { id: { in: flowUserIds } },
      select: { id: true, real_name: true }
    });
    const flowUserMap = new Map(flowUsers.map((u: any) => [u.id, u.real_name]));

    const data = {
      ...approval,
      applicant_name: applicant?.real_name || '',
      flows: flows.map((f: any) => ({
        ...f,
        approver_name: f.approver_id ? (flowUserMap.get(f.approver_id) || f.approver_name || '') : ''
      }))
    };

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Approval Detail Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 催办
router.post('/:id/urge', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const id = getParam(req, 'id');

    const approval = await prisma.oa_approval.findFirst({
      where: { id: BigInt(String(id)) }
    });

    if (!approval) {
      return res.json({ code: 404, msg: '审批记录不存在' });
    }

    if (approval.status !== 'pending') {
      return res.json({ code: 400, msg: '该审批已处理，无需催办' });
    }

    console.log(`[催办] 审批 ${approval.approval_no} 被催办，当前审批人: ${approval.current_approver_id}`);

    res.json({ code: 200, msg: '催办成功' });
  } catch (error) {
    console.error('[Urge Approval Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
