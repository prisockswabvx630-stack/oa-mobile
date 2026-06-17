import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { roleName } = req.query;
    const where: any = { is_deleted: 0 };
    if (roleName) where.role_name = { contains: String(roleName) };
    const roles = await prisma.sys_role.findMany({ where, orderBy: { sort: 'asc' } });
    res.json({ code: 200, data: roles, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const roles = await prisma.sys_role.findMany({ where: { is_deleted: 0, status: 1 }, orderBy: { sort: 'asc' } });
    res.json({ code: 200, data: roles, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { role_name, role_code, description, sort } = req.body;
    const role = await prisma.sys_role.create({
      data: { role_code: role_code || 'role_' + Date.now(), role_name: role_name || '', description: description || null, sort: sort !== undefined ? Number(sort) : 0, status: 1 }
    });
    res.json({ code: 200, data: role, msg: '创建角色成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role_name, description, sort, status } = req.body;
    const updateData: any = { update_time: new Date() };
    if (role_name !== undefined) updateData.role_name = role_name;
    if (description !== undefined) updateData.description = description;
    if (sort !== undefined) updateData.sort = Number(sort);
    if (status !== undefined) updateData.status = status;
    const updated = await prisma.sys_role.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新角色成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.sys_role.update({ where: { id: BigInt(String(id)) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除角色成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/:id/permissions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    await prisma.sys_role_permission.deleteMany({ where: { role_id: BigInt(String(id)) } });
    if (permissionIds && permissionIds.length > 0) {
      await prisma.sys_role_permission.createMany({
        data: permissionIds.map((pid: number) => ({ role_id: BigInt(String(id)), permission_id: BigInt(pid) }))
      });
    }
    res.json({ code: 200, msg: '分配权限成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/:id/permissions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rolePerms = await prisma.sys_role_permission.findMany({ where: { role_id: BigInt(String(id)) }, select: { permission_id: true } });
    res.json({ code: 200, data: rolePerms.map(rp => rp.permission_id), msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
