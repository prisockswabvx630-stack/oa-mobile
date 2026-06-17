import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../utils/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

function userOrClause(id: any) {
  const idStr = String(id);
  const or: any[] = [{ emp_no: idStr }];
  if (!isNaN(Number(idStr))) {
    or.push({ id: BigInt(idStr) });
  }
  return or;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.sys_user.findMany({
      where: { is_deleted: 0 },
      include: {
        sys_department: { select: { id: true, dept_name: true } },
        sys_position: { select: { id: true, pos_name: true } }
      },
      orderBy: { id: 'asc' }
    });
    const data = users.map(u => { const { password, ...rest } = u; return rest; });
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[GET /users]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.sys_user.findFirst({
      where: { is_deleted: 0, OR: userOrClause(id) },
      include: {
        sys_department: { select: { id: true, dept_name: true } },
        sys_position: { select: { id: true, pos_name: true } },
        sys_user_role: { include: { sys_role: { select: { id: true, role_name: true } } } }
      }
    });
    if (!user) return res.json({ code: 404, msg: '用户不存在' });
    const { password, ...rest } = user;
    res.json({ code: 200, data: rest, msg: 'success' });
  } catch (error) {
    console.error('[GET /users/:id]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', requireRole('管理员'), async (req: Request, res: Response) => {
  try {
    const { name, gender, dept, position, phone, role, hrStatus } = req.body;
    let deptId: bigint | null = null;
    if (dept) {
      let department = await prisma.sys_department.findFirst({ where: { dept_name: dept, is_deleted: 0 } });
      if (!department) {
        department = await prisma.sys_department.create({ data: { dept_name: dept, dept_code: 'DEPT_' + Date.now(), status: 1 } });
      }
      deptId = department.id;
    }
    let positionId: bigint | null = null;
    if (position) {
      let pos = await prisma.sys_position.findFirst({ where: { pos_name: position, is_deleted: 0 } });
      if (!pos) {
        pos = await prisma.sys_position.create({ data: { pos_name: position, pos_code: 'POS_' + Date.now(), status: 1 } });
      }
      positionId = pos.id;
    }
    const hashedPassword = await bcrypt.hash('123456', 10);
    const count = await prisma.sys_user.count();
    const empNo = 'EMP' + String(10000 + count + 1);
    const username = empNo.toLowerCase();
    const userStatus = hrStatus === '离职' ? 0 : 1;
    const newUser = await prisma.sys_user.create({
      data: {
        emp_no: empNo, username, password: hashedPassword, real_name: name,
        gender: gender === '男' ? 1 : 2, mobile: phone || '',
        dept_id: deptId, position_id: positionId, status: userStatus,
        entry_date: new Date(),
        contract_expire: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
        probation_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });
    let roleRecord = await prisma.sys_role.findFirst({ where: { role_name: role, is_deleted: 0 } });
    if (!roleRecord) {
      roleRecord = await prisma.sys_role.create({ data: { role_name: role, role_code: role === '管理员' ? 'admin' : 'user', status: 1 } });
    }
    await prisma.sys_user_role.create({ data: { user_id: newUser.id, role_id: roleRecord.id } });
    const today = new Date();
    await prisma.oa_attendance.create({ data: { user_id: newUser.id, attend_date: today, clock_in_time: today, status: 'normal' } }).catch(() => {});
    await prisma.oa_salary.create({ data: { user_id: newUser.id, month: today.toISOString().slice(0, 7), base_salary: 8000, position_allowance: 1000, performance_bonus: 1000, social_security: 800, housing_fund: 500, income_tax: 150, net_salary: 8550, status: 'draft' } }).catch(() => {});
    const { password, ...userWithoutPassword } = newUser;
    res.json({ code: 200, data: userWithoutPassword, msg: '新增用户成功' });
  } catch (error) {
    console.error('[POST /users]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', requireRole('管理员'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, gender, dept, position, phone, role, hrStatus, status } = req.body;
    const user = await prisma.sys_user.findFirst({ where: { OR: userOrClause(id) } });
    if (!user) return res.json({ code: 404, msg: '用户不存在' });
    let deptId = user.dept_id;
    if (dept) {
      let department = await prisma.sys_department.findFirst({ where: { dept_name: dept, is_deleted: 0 } });
      if (!department) {
        department = await prisma.sys_department.create({ data: { dept_name: dept, dept_code: 'DEPT_' + Date.now(), status: 1 } });
      }
      deptId = department.id;
    }
    let positionId = user.position_id;
    if (position) {
      let pos = await prisma.sys_position.findFirst({ where: { pos_name: position, is_deleted: 0 } });
      if (!pos) {
        pos = await prisma.sys_position.create({ data: { pos_name: position, pos_code: 'POS_' + Date.now(), status: 1 } });
      }
      positionId = pos.id;
    }
    const userStatus = hrStatus === '离职' ? 0 : (status === '禁用' ? 0 : (status === '正常' ? 1 : user.status));
    const updatedUser = await prisma.sys_user.update({
      where: { id: user.id },
      data: {
        real_name: name !== undefined ? name : user.real_name,
        gender: gender ? (gender === '男' ? 1 : 2) : user.gender,
        mobile: phone !== undefined ? phone : user.mobile,
        dept_id: deptId, position_id: positionId, status: userStatus, update_time: new Date()
      }
    });
    if (role) {
      let roleRecord = await prisma.sys_role.findFirst({ where: { role_name: role, is_deleted: 0 } });
      if (!roleRecord) {
        roleRecord = await prisma.sys_role.create({ data: { role_name: role, role_code: role === '管理员' ? 'admin' : 'user', status: 1 } });
      }
      await prisma.sys_user_role.deleteMany({ where: { user_id: user.id } });
      await prisma.sys_user_role.create({ data: { user_id: user.id, role_id: roleRecord.id } });
    }
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ code: 200, data: userWithoutPassword, msg: '更新用户成功' });
  } catch (error) {
    console.error('[PUT /users/:id]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', requireRole('管理员'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.sys_user.findFirst({ where: { OR: userOrClause(id) } });
    if (!user) return res.json({ code: 404, msg: '用户不存在' });
    await prisma.sys_user.update({ where: { id: user.id }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除用户成功' });
  } catch (error) {
    console.error('[DELETE /users/:id]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/:id/reset-password', requireRole('管理员'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.sys_user.findFirst({ where: { OR: userOrClause(id) } });
    if (!user) return res.json({ code: 404, msg: '用户不存在' });
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.sys_user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    res.json({ code: 200, msg: '密码重置成功' });
  } catch (error) {
    console.error('[POST /users/:id/reset-password]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 修改密码接口（用户只能修改自己的密码）
router.post('/:id/change-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const reqUser = (req as any).user;

    // 只能修改自己的密码
    if (String(reqUser.id) !== String(id)) {
      return res.status(403).json({ code: 403, msg: '只能修改自己的密码' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ code: 400, msg: '新密码长度不能少于6位' });
    }

    const user = await prisma.sys_user.findFirst({ where: { OR: userOrClause(id) } });
    if (!user) return res.json({ code: 404, msg: '用户不存在' });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.json({ code: 400, msg: '原密码不正确' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.sys_user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    res.json({ code: 200, msg: '密码修改成功' });
  } catch (error) {
    console.error('[POST /users/:id/change-password]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
