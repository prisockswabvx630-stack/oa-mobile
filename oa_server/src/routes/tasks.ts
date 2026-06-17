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

router.get('/', async (req: Request, res: Response) => {
  try {
    const { assignee_id, status } = req.query;
    const user = getCurrentUser(req);
    const userId = user.id;
    const username = user.username;
    const isAdmin = username === 'admin';

    const where: any = { is_deleted: 0 };
    if (status) where.status = String(status);

    if (!isAdmin && userId) {
      where.OR = [
        { assignee_id: BigInt(userId) },
        { creator_id: BigInt(userId) }
      ];
    } else if (assignee_id) {
      where.assignee_id = BigInt(String(assignee_id));
    }

    const tasks = await prisma.oa_task.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set([...tasks.map(t => t.assignee_id), ...tasks.map(t => t.creator_id)])];
    const projectIds = [...new Set(tasks.filter(t => t.project_id).map(t => t.project_id!))];
    const [users, projects] = await Promise.all([
      prisma.sys_user.findMany({ where: { id: { in: userIds } }, select: { id: true, real_name: true } }),
      prisma.oa_project.findMany({ where: { id: { in: projectIds } }, select: { id: true, project_name: true } })
    ]);
    const userMap = new Map(users.map(u => [u.id, u.real_name]));
    const projectMap = new Map(projects.map(p => [p.id, p.project_name]));
    const data = tasks.map(t => ({
      ...t,
      assignee_name: userMap.get(t.assignee_id) || '',
      creator_name: userMap.get(t.creator_id) || '',
      project_name: t.project_id ? (projectMap.get(t.project_id) || '') : ''
    }));
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Tasks Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { title, description, assignee_name, creator_name, priority, due_date, progress, status, project_name, assignee_id } = req.body;

    if (!title) {
      return res.json({ code: 400, msg: '任务标题不能为空' });
    }

    let assigneeId: bigint = BigInt(user.id || 1);
    if (assignee_id) {
      assigneeId = BigInt(assignee_id);
    } else if (assignee_name) {
      const u = await prisma.sys_user.findFirst({ where: { real_name: assignee_name, is_deleted: 0 } });
      if (u) assigneeId = u.id;
    }

    let creatorId: bigint = BigInt(user.id || 1);
    if (creator_name) {
      const u = await prisma.sys_user.findFirst({ where: { real_name: creator_name, is_deleted: 0 } });
      if (u) creatorId = u.id;
    }

    let projectId: bigint | null = null;
    if (project_name) {
      let p = await prisma.oa_project.findFirst({ where: { project_name, is_deleted: 0 } });
      if (!p) {
        p = await prisma.oa_project.create({ data: { project_name, project_no: 'PROJ_' + Date.now(), status: 'active' } });
      }
      projectId = p.id;
    }

    const dbPriority = priority === '高' ? 'high' : (priority === '中' ? 'medium' : 'low');
    const dbStatus = status === '已完成' ? 'completed' : (status === '进行中' ? 'in_progress' : (status === '已逾期' ? 'overdue' : 'pending'));

    const task = await prisma.oa_task.create({
      data: {
        task_no: 'TSK' + Date.now().toString().slice(-6),
        title: title || '',
        description: description || '',
        project_id: projectId,
        assignee_id: assigneeId,
        creator_id: creatorId,
        priority: dbPriority,
        due_date: due_date ? new Date(due_date) : null,
        progress: progress !== undefined ? Number(progress) : 0,
        status: dbStatus
      }
    });

    res.json({ code: 200, data: task, msg: 'success' });
  } catch (error) {
    console.error('[Create Task Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req, 'id');
    const task = await (prisma.oa_task as any).findFirst({
      where: { id: BigInt(id), is_deleted: 0 },
      include: {
        sys_user_oa_task_assignee_idTosys_user: { select: { id: true, real_name: true } },
        sys_user_oa_task_creator_idTosys_user: { select: { id: true, real_name: true } },
        oa_project: { select: { id: true, project_name: true } }
      }
    });

    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    res.json({ code: 200, data: task, msg: 'success' });
  } catch (error) {
    console.error('[Get Task Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req, 'id');
    const user = getCurrentUser(req);
    const userId = user.id;
    const username = user.username;

    const task = await prisma.oa_task.findUnique({ where: { id: BigInt(id) } });
    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    const isOwner = userId && (String(task.assignee_id) === String(userId) || String(task.creator_id) === String(userId));
    const isAdmin = username === 'admin';

    if (!isOwner && !isAdmin) {
      return res.json({ code: 403, msg: '权限不足，您只能修改自己负责或创建的任务！' });
    }

    const { title, description, assignee_name, priority, due_date, progress, status, project_name, assignee_id } = req.body;
    const updateData: any = { update_time: new Date() };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (progress !== undefined) updateData.progress = Number(progress);

    if (status !== undefined) {
      updateData.status = status === '已完成' ? 'completed' : (status === '进行中' ? 'in_progress' : (status === '已逾期' ? 'overdue' : 'pending'));
      if (status === '已完成') updateData.completed_time = new Date();
    }

    if (priority !== undefined) {
      updateData.priority = priority === '高' ? 'high' : (priority === '中' ? 'medium' : 'low');
    }

    if (due_date !== undefined) {
      updateData.due_date = due_date ? new Date(due_date) : null;
    }

    if (assignee_id) {
      updateData.assignee_id = BigInt(assignee_id);
    } else if (assignee_name !== undefined) {
      const u = await prisma.sys_user.findFirst({ where: { real_name: assignee_name, is_deleted: 0 } });
      if (u) updateData.assignee_id = u.id;
    }

    if (project_name !== undefined) {
      if (project_name) {
        let p = await prisma.oa_project.findFirst({ where: { project_name, is_deleted: 0 } });
        if (!p) {
          p = await prisma.oa_project.create({ data: { project_name, project_no: 'PROJ_' + Date.now(), status: 'active' } });
        }
        updateData.project_id = p.id;
      } else {
        updateData.project_id = null;
      }
    }

    const updated = await prisma.oa_task.update({ where: { id: BigInt(id) }, data: updateData });
    res.json({ code: 200, data: updated, msg: 'success' });
  } catch (error) {
    console.error('[Update Task Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 完成任务
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const id = getParam(req, 'id');
    const user = getCurrentUser(req);
    const userId = user.id;
    const username = user.username;

    const task = await prisma.oa_task.findUnique({ where: { id: BigInt(id) } });
    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    const isOwner = userId && (String(task.assignee_id) === String(userId) || String(task.creator_id) === String(userId));
    const isAdmin = username === 'admin';
    if (!isOwner && !isAdmin) {
      return res.json({ code: 403, msg: '权限不足' });
    }

    const updated = await prisma.oa_task.update({
      where: { id: BigInt(id) },
      data: { status: 'completed', progress: 100, completed_time: new Date(), update_time: new Date() }
    });

    res.json({ code: 200, data: updated, msg: '任务已完成' });
  } catch (error) {
    console.error('[Complete Task Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 分配任务
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const id = getParam(req, 'id');
    const { assigneeName } = req.body;

    if (!assigneeName) {
      return res.json({ code: 400, msg: '缺少被分配人姓名' });
    }

    const task = await prisma.oa_task.findUnique({ where: { id: BigInt(id) } });
    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    const assignee = await prisma.sys_user.findFirst({ where: { real_name: assigneeName, is_deleted: 0 } });
    if (!assignee) {
      return res.json({ code: 404, msg: `未找到员工: ${assigneeName}` });
    }

    const updated = await prisma.oa_task.update({
      where: { id: BigInt(id) },
      data: { assignee_id: assignee.id, update_time: new Date() }
    });

    res.json({ code: 200, data: updated, msg: '任务分配成功' });
  } catch (error) {
    console.error('[Assign Task Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req, 'id');
    const user = getCurrentUser(req);
    const userId = user.id;
    const username = user.username;

    const task = await prisma.oa_task.findUnique({ where: { id: BigInt(id) } });
    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    const isCreator = userId && String(task.creator_id) === String(userId);
    const isAdmin = username === 'admin';

    if (!isCreator && !isAdmin) {
      return res.json({ code: 403, msg: '权限不足，您只能删除自己创建的任务！' });
    }

    await prisma.oa_task.update({
      where: { id: BigInt(id) },
      data: { is_deleted: 1, update_time: new Date() }
    });

    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    console.error('[Delete Task Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
