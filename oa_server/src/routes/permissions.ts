import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const perms = await prisma.sys_permission.findMany({ where: { is_deleted: 0, status: 1 }, orderBy: { sort: 'asc' } });
    res.json({ code: 200, data: perms, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/tree', async (req: Request, res: Response) => {
  try {
    const perms = await prisma.sys_permission.findMany({ where: { is_deleted: 0, status: 1 }, orderBy: { sort: 'asc' } });
    const buildTree = (parentId: bigint | null): any[] => {
      return perms.filter(p => (p.parent_id || BigInt(0)) === (parentId || BigInt(0))).map(p => ({ ...p, children: buildTree(p.id) }));
    };
    res.json({ code: 200, data: buildTree(BigInt(0)), msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { permission_name, permission_code, parent_id, permission_type, route_path, component_path, icon, sort } = req.body;
    const perm = await prisma.sys_permission.create({
      data: {
        permission_code: permission_code || 'perm_' + Date.now(), permission_name: permission_name || '',
        permission_type: permission_type || 'menu', parent_id: parent_id ? BigInt(parent_id) : BigInt(0),
        route_path: route_path || null, component_path: component_path || null, icon: icon || null,
        sort: sort !== undefined ? Number(sort) : 0, status: 1
      }
    });
    res.json({ code: 200, data: perm, msg: '创建权限成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permission_name, parent_id, permission_type, route_path, component_path, icon, sort, status } = req.body;
    const updateData: any = { update_time: new Date() };
    if (permission_name !== undefined) updateData.permission_name = permission_name;
    if (parent_id !== undefined) updateData.parent_id = BigInt(parent_id);
    if (permission_type !== undefined) updateData.permission_type = permission_type;
    if (route_path !== undefined) updateData.route_path = route_path;
    if (component_path !== undefined) updateData.component_path = component_path;
    if (icon !== undefined) updateData.icon = icon;
    if (sort !== undefined) updateData.sort = Number(sort);
    if (status !== undefined) updateData.status = status;
    const updated = await prisma.sys_permission.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新权限成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.sys_permission.update({ where: { id: BigInt(String(id)) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除权限成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
