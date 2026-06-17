import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ========== 1. 获取回收站所有软删除项 ==========
router.get('/', async (req: Request, res: Response) => {
  try {
    const [users, assets, projects, tasks] = await Promise.all([
      prisma.sys_user.findMany({ where: { is_deleted: 1 } }),
      prisma.oa_asset.findMany({ where: { is_deleted: 1 } }),
      prisma.oa_project.findMany({ where: { is_deleted: 1 } }),
      prisma.oa_task.findMany({ where: { is_deleted: 1 } })
    ]);

    const list: any[] = [];
    users.forEach(u => list.push({
      id: String(u.id),
      type: 'user',
      typeLabel: '用户员工',
      name: `${u.real_name} (@${u.username})`,
      deleteTime: u.update_time
    }));
    assets.forEach(a => list.push({
      id: String(a.id),
      type: 'asset',
      typeLabel: '固定资产',
      name: `${a.asset_name} (${a.asset_no})`,
      deleteTime: a.update_time
    }));
    projects.forEach(p => list.push({
      id: String(p.id),
      type: 'project',
      typeLabel: '项目管理',
      name: p.project_name,
      deleteTime: p.update_time
    }));
    tasks.forEach(t => list.push({
      id: String(t.id),
      type: 'task',
      typeLabel: '任务管理',
      name: t.title,
      deleteTime: t.update_time
    }));

    // 按删除时间（最近修改时间）倒序排序
    list.sort((a, b) => new Date(b.deleteTime).getTime() - new Date(a.deleteTime).getTime());

    res.json({ code: 200, data: list, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 2. 恢复已软删除的项目 ==========
router.post('/recover', async (req: Request, res: Response) => {
  try {
    const { id, type } = req.body;
    if (!id || !type) {
      return res.status(400).json({ code: 400, msg: '参数不足' });
    }

    const recordId = BigInt(id);

    if (type === 'user') {
      await prisma.sys_user.update({ where: { id: recordId }, data: { is_deleted: 0, status: 1 } });
    } else if (type === 'asset') {
      await prisma.oa_asset.update({ where: { id: recordId }, data: { is_deleted: 0 } });
    } else if (type === 'project') {
      await prisma.oa_project.update({ where: { id: recordId }, data: { is_deleted: 0 } });
    } else if (type === 'task') {
      await prisma.oa_task.update({ where: { id: recordId }, data: { is_deleted: 0 } });
    } else {
      return res.status(400).json({ code: 400, msg: '未知数据类型' });
    }

    res.json({ code: 200, msg: '数据恢复成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 3. 彻底物理删除单条数据 ==========
router.post('/delete', async (req: Request, res: Response) => {
  try {
    const { id, type } = req.body;
    if (!id || !type) {
      return res.status(400).json({ code: 400, msg: '参数不足' });
    }

    const recordId = BigInt(id);

    if (type === 'user') {
      // 级联清理用户相关的关联表，避免外键约束失败
      await prisma.sys_user_role.deleteMany({ where: { user_id: recordId } });
      await prisma.sys_user.delete({ where: { id: recordId } });
    } else if (type === 'asset') {
      await prisma.oa_asset_record.deleteMany({ where: { asset_id: recordId } });
      await prisma.oa_asset.delete({ where: { id: recordId } });
    } else if (type === 'project') {
      await prisma.oa_project.delete({ where: { id: recordId } });
    } else if (type === 'task') {
      await prisma.oa_task.delete({ where: { id: recordId } });
    } else {
      return res.status(400).json({ code: 400, msg: '未知数据类型' });
    }

    res.json({ code: 200, msg: '数据已彻底删除' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 4. 一键清空所有已软删除数据 ==========
router.post('/clean', async (req: Request, res: Response) => {
  try {
    // 物理删除所有 marked as deleted 的数据
    const deletedUsers = await prisma.sys_user.findMany({ where: { is_deleted: 1 }, select: { id: true } });
    const userIds = deletedUsers.map(u => u.id);

    const deletedAssets = await prisma.oa_asset.findMany({ where: { is_deleted: 1 }, select: { id: true } });
    const assetIds = deletedAssets.map(a => a.id);

    await prisma.$transaction([
      prisma.sys_user_role.deleteMany({ where: { user_id: { in: userIds } } }),
      prisma.sys_user.deleteMany({ where: { is_deleted: 1 } }),
      prisma.oa_asset_record.deleteMany({ where: { asset_id: { in: assetIds } } }),
      prisma.oa_asset.deleteMany({ where: { is_deleted: 1 } }),
      prisma.oa_project.deleteMany({ where: { is_deleted: 1 } }),
      prisma.oa_task.deleteMany({ where: { is_deleted: 1 } })
    ]);

    res.json({ code: 200, msg: '回收站已成功清空' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
