import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const depts = await prisma.sys_department.findMany({ where: { is_deleted: 0 }, orderBy: { sort: 'asc' } });
    res.json({ code: 200, data: depts, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/tree', async (req: Request, res: Response) => {
  try {
    const depts = await prisma.sys_department.findMany({ where: { is_deleted: 0, status: 1 }, orderBy: { sort: 'asc' } });
    const buildTree = (parentId: bigint | null): any[] => {
      return depts.filter(d => (d.parent_id || BigInt(0)) === (parentId || BigInt(0))).map(d => ({ ...d, children: buildTree(d.id) }));
    };
    res.json({ code: 200, data: buildTree(BigInt(0)), msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { dept_name, dept_code, parent_id, leader_id, sort, remark } = req.body;
    const dept = await prisma.sys_department.create({
      data: {
        dept_code: dept_code || 'DEPT_' + Date.now(), dept_name: dept_name || '',
        parent_id: parent_id ? BigInt(parent_id) : BigInt(0),
        leader_id: leader_id ? BigInt(leader_id) : null,
        sort: sort !== undefined ? Number(sort) : 0, remark: remark || null, status: 1
      }
    });
    res.json({ code: 200, data: dept, msg: '创建部门成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dept_name, parent_id, leader_id, sort, status, remark } = req.body;
    const updateData: any = { update_time: new Date() };
    if (dept_name !== undefined) updateData.dept_name = dept_name;
    if (parent_id !== undefined) updateData.parent_id = BigInt(parent_id);
    if (leader_id !== undefined) updateData.leader_id = leader_id ? BigInt(leader_id) : null;
    if (sort !== undefined) updateData.sort = Number(sort);
    if (status !== undefined) updateData.status = status;
    if (remark !== undefined) updateData.remark = remark;
    const updated = await prisma.sys_department.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新部门成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.sys_department.update({ where: { id: BigInt(String(id)) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除部门成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
