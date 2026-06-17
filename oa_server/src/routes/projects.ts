import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = { is_deleted: 0 };
    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      const userTasks = await prisma.oa_task.findMany({
        where: {
          is_deleted: 0,
          OR: [
            { assignee_id: userId },
            { creator_id: userId }
          ]
        },
        select: { project_id: true }
      });
      const relatedProjectIds = [...new Set(userTasks.filter(t => t.project_id).map(t => t.project_id!))];
      where.OR = [
        { manager_id: userId },
        { id: { in: relatedProjectIds } }
      ];
    }

    const projects = await prisma.oa_project.findMany({ where, orderBy: { create_time: 'desc' } });
    const managerIds = [...new Set(projects.filter(p => p.manager_id).map(p => p.manager_id!))];
    const projectIds = projects.map(p => p.id);
    const [users, taskCounts] = await Promise.all([
      prisma.sys_user.findMany({ where: { id: { in: managerIds } }, select: { id: true, real_name: true, sys_department: { select: { dept_name: true } } } }),
      prisma.oa_task.groupBy({ by: ['project_id'], where: { project_id: { in: projectIds }, is_deleted: 0 }, _count: { id: true } })
    ]);
    const userMap = new Map(users.map(u => [u.id, u]));
    const taskCountMap = new Map(taskCounts.map(t => [t.project_id, t._count.id]));
    const data = projects.map(p => { const manager = p.manager_id ? userMap.get(p.manager_id) : null; return { ...p, manager_name: manager?.real_name || '', dept_name: manager?.sys_department?.dept_name || '', task_count: taskCountMap.get(p.id) || 0 }; });
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, owner, dept, startDate, endDate, progress, status, description, priority } = req.body;
    let managerId: bigint | null = null;
    if (owner) { const user = await prisma.sys_user.findFirst({ where: { real_name: owner, is_deleted: 0 } }); if (user) managerId = user.id; }
    const dbStatus = status === '进行中' ? 'active' : (status === '已完结' || status === '已完成' ? 'completed' : 'pending');
    const dbPriority = priority === '高' ? 'high' : priority === '低' ? 'low' : 'medium';
    const newProject = await prisma.oa_project.create({
      data: { project_name: name, project_no: 'PROJ_' + Date.now(), description: description || '', manager_id: managerId, start_date: startDate ? new Date(startDate) : null, end_date: endDate ? new Date(endDate) : null, progress: progress || 0, status: dbStatus, priority: dbPriority }
    });
    res.json({ code: 200, data: newProject, msg: '新建项目成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, owner, dept, startDate, endDate, progress, status, description, priority } = req.body;
    let managerId: bigint | null | undefined = undefined;
    if (owner !== undefined) { if (owner) { const user = await prisma.sys_user.findFirst({ where: { real_name: owner, is_deleted: 0 } }); if (user) managerId = user.id; } else { managerId = null; } }
    const dbStatus = status ? (status === '进行中' ? 'active' : (status === '已完结' || status === '已完成' ? 'completed' : 'pending')) : undefined;
    const dbPriority = priority ? (priority === '高' ? 'high' : priority === '低' ? 'low' : 'medium') : undefined;
    const updateData: any = { update_time: new Date() };
    if (name !== undefined) updateData.project_name = name;
    if (description !== undefined) updateData.description = description;
    if (managerId !== undefined) updateData.manager_id = managerId;
    if (startDate !== undefined) updateData.start_date = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.end_date = endDate ? new Date(endDate) : null;
    if (progress !== undefined) updateData.progress = progress;
    if (dbStatus !== undefined) updateData.status = dbStatus;
    if (dbPriority !== undefined) updateData.priority = dbPriority;
    const updated = await prisma.oa_project.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新项目成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 项目统计（关联任务数据）
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = BigInt(String(id));
    const tasks = await prisma.oa_task.findMany({ where: { project_id: projectId, is_deleted: 0 } });
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    res.json({ code: 200, data: { total, completed, inProgress, pending, overdue, highPriority }, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.oa_project.update({ where: { id: BigInt(String(id)) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除项目成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
