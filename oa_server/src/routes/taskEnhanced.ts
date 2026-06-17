import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 获取项目列表
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { status, page = 1, pageSize = 20 } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = { is_deleted: 0 };
    if (status) where.status = status;

    // 非管理员只能看到自己参与的项目
    if (!isAdmin) {
      where.manager_id = BigInt(userId);
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [projects, total] = await Promise.all([
      prisma.oa_project.findMany({
        where,
        orderBy: { create_time: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.oa_project.count({ where })
    ]);

    res.json({
      code: 200,
      data: {
        list: projects,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Projects Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 创建项目
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { name, description, start_date, end_date, budget, priority, members } = req.body;

    if (!name) {
      return res.json({ code: 400, msg: '项目名称不能为空' });
    }

    const projectNo = 'PRJ' + Date.now().toString().slice(-8);

    const project = await prisma.oa_project.create({
      data: {
        project_no: projectNo,
        project_name: name,
        description: description || '',
        manager_id: BigInt(String(user.id)),
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        priority: priority || 'medium',
        status: 'planning',
        progress: 0
      }
    });

    // 添加项目成员
    if (members && members.length > 0) {
      await prisma.oa_project_member.createMany({
        data: members.map((m: any) => ({
          project_id: project.id,
          user_id: BigInt(m.user_id),
          role: m.role || 'member',
          join_date: new Date()
        }))
      });
    }

    res.json({ code: 200, data: project, msg: '创建成功' });
  } catch (error) {
    console.error('[Create Project Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取项目详情
router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.oa_project.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!project) {
      return res.json({ code: 404, msg: '项目不存在' });
    }

    // 获取项目成员
    const members = await prisma.oa_project_member.findMany({
      where: { project_id: BigInt(String(id)) }
    });

    // 获取成员信息
    const memberIds = members.map(m => m.user_id);
    const users = await prisma.sys_user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, real_name: true, dept_id: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    // 获取项目任务统计
    const tasks = await prisma.oa_task.findMany({
      where: { project_id: BigInt(String(id)), is_deleted: 0 }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    const data = {
      ...project,
      members: members.map(m => ({
        ...m,
        user_name: userMap.get(m.user_id) || ''
      })),
      task_stats: {
        total: totalTasks,
        completed: completedTasks,
        in_progress: inProgressTasks,
        pending: pendingTasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    };

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Project Detail Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取任务看板
router.get('/board', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { project_id } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = { is_deleted: 0 };
    if (project_id) {
      where.project_id = BigInt(String(project_id));
    } else if (!isAdmin) {
      where.OR = [
        { assignee_id: BigInt(userId) },
        { creator_id: BigInt(userId) }
      ];
    }

    const tasks = await prisma.oa_task.findMany({
      where,
      orderBy: { create_time: 'desc' }
    });

    // 按状态分组
    const board = {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      review: tasks.filter(t => t.status === 'review'),
      completed: tasks.filter(t => t.status === 'completed')
    };

    // 获取用户信息
    const userIds = [...new Set([
      ...tasks.map(t => t.assignee_id),
      ...tasks.map(t => t.creator_id)
    ])];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    // 添加用户名
    const enrichTask = (task: any) => ({
      ...task,
      assignee_name: userMap.get(task.assignee_id) || '',
      creator_name: userMap.get(task.creator_id) || ''
    });

    res.json({
      code: 200,
      data: {
        pending: board.pending.map(enrichTask),
        in_progress: board.in_progress.map(enrichTask),
        review: board.review.map(enrichTask),
        completed: board.completed.map(enrichTask),
        stats: {
          total: tasks.length,
          pending: board.pending.length,
          in_progress: board.in_progress.length,
          review: board.review.length,
          completed: board.completed.length
        }
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Board Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 任务拖拽更新状态
router.put('/tasks/:id/status', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { status, position } = req.body;

    if (!status) {
      return res.json({ code: 400, msg: '状态不能为空' });
    }

    const task = await prisma.oa_task.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    const updateData: any = {
      status,
      update_time: new Date()
    };

    if (status === 'completed') {
      updateData.completed_time = new Date();
      updateData.progress = 100;
    }

    const updated = await prisma.oa_task.update({
      where: { id: BigInt(String(id)) },
      data: updateData
    });

    res.json({ code: 200, data: updated, msg: '更新成功' });
  } catch (error) {
    console.error('[Update Task Status Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 添加任务评论
router.post('/tasks/:id/comments', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!content) {
      return res.json({ code: 400, msg: '评论内容不能为空' });
    }

    const task = await prisma.oa_task.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    const comment = await prisma.oa_task_comment.create({
      data: {
        task_id: BigInt(String(id)),
        user_id: BigInt(String(user.id)),
        content,
        attachments: JSON.stringify(attachments || []),
        create_time: new Date()
      }
    });

    res.json({ code: 200, data: comment, msg: '评论成功' });
  } catch (error) {
    console.error('[Add Comment Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取任务评论
router.get('/tasks/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comments = await prisma.oa_task_comment.findMany({
      where: { task_id: BigInt(String(id)) },
      orderBy: { create_time: 'desc' }
    });

    // 获取评论用户信息
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    const data = comments.map(c => ({
      ...c,
      user_name: userMap.get(c.user_id) || '',
      attachments: JSON.parse(c.attachments as string || '[]')
    }));

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Comments Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 任务进度更新
router.put('/tasks/:id/progress', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { progress, remark } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.json({ code: 400, msg: '进度值无效' });
    }

    const task = await prisma.oa_task.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!task) {
      return res.json({ code: 404, msg: '任务不存在' });
    }

    const updateData: any = {
      progress: Number(progress),
      update_time: new Date()
    };

    // 自动更新状态
    if (progress === 100) {
      updateData.status = 'completed';
      updateData.completed_time = new Date();
    } else if (progress > 0 && task.status === 'pending') {
      updateData.status = 'in_progress';
    }

    const updated = await prisma.oa_task.update({
      where: { id: BigInt(String(id)) },
      data: updateData
    });

    // 记录进度变更历史
    await prisma.oa_task_comment.create({
      data: {
        task_id: BigInt(String(id)),
        user_id: BigInt(String(user.id)),
        content: `更新进度为 ${progress}%${remark ? ': ' + remark : ''}`,
        create_time: new Date()
      }
    });

    res.json({ code: 200, data: updated, msg: '更新成功' });
  } catch (error) {
    console.error('[Update Progress Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
