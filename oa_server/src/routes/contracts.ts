import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, status } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = {};
    if (!isAdmin && reqUser?.id) {
      where.user_id = BigInt(reqUser.id);
    } else if (userId) {
      where.user_id = BigInt(String(userId));
    }
    if (status) where.status = String(status);
    const contracts = await prisma.hr_employee_contract.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set(contracts.map(c => c.user_id))];
    const users = await prisma.sys_user.findMany({ where: { id: { in: userIds } }, select: { id: true, real_name: true, emp_no: true, dept_id: true } });
    const deptIds = [...new Set(users.map(u => u.dept_id).filter((id): id is bigint => id !== null))];
    const depts = await prisma.sys_department.findMany({ where: { id: { in: deptIds } }, select: { id: true, dept_name: true } });
    const deptMap = new Map(depts.map(d => [d.id, d.dept_name]));
    const userMap = new Map(users.map(u => [u.id, u]));
    const data = contracts.map(c => ({ ...c, user_name: userMap.get(c.user_id)?.real_name || '', emp_no: userMap.get(c.user_id)?.emp_no || '', dept_name: deptMap.get(userMap.get(c.user_id)?.dept_id || BigInt(0)) || '' }));
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 批量为没有合同的员工生成合同
router.post('/batch-generate', async (req: Request, res: Response) => {
  try {
    // 获取所有在职员工
    const users = await prisma.sys_user.findMany({
      where: { is_deleted: 0, status: 1 },
      include: {
        sys_department: { select: { id: true, dept_name: true } },
        sys_position: { select: { id: true, pos_name: true } }
      }
    });

    // 获取已有合同的 user_id 集合
    const existingContracts = await prisma.hr_employee_contract.findMany({
      select: { user_id: true }
    });
    const existingUserIds = new Set(existingContracts.map(c => String(c.user_id)));

    // 筛选出没有合同的员工
    const usersWithoutContract = users.filter(u => !existingUserIds.has(String(u.id)));

    if (usersWithoutContract.length === 0) {
      return res.json({ code: 200, data: { created: 0, total: users.length }, msg: '所有员工都已有合同' });
    }

    // 批量创建合同
    const contracts = usersWithoutContract.map(u => {
      const entryDate = u.entry_date || new Date();
      const contractExpire = u.contract_expire || new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000);
      return {
        user_id: u.id,
        contract_no: 'CON' + Date.now().toString().slice(-6) + String(u.id).slice(-3),
        contract_type: '固定期限',
        start_date: new Date(entryDate),
        end_date: new Date(contractExpire),
        probation_months: 3,
        probation_end_date: new Date(new Date(entryDate).getTime() + 90 * 24 * 60 * 60 * 1000),
        salary: null,
        status: 'active',
        sign_date: new Date(entryDate),
        remark: '系统自动批量生成',
        create_time: new Date(),
        update_time: new Date()
      };
    });

    // 逐个创建（避免 unique 冲突）
    let created = 0;
    for (const c of contracts) {
      try {
        await prisma.hr_employee_contract.create({ data: c });
        created++;
      } catch (e) {
        console.warn('创建合同失败:', c.contract_no, e);
      }
    }

    res.json({ code: 200, data: { created, total: users.length, skipped: usersWithoutContract.length - created }, msg: `成功为 ${created} 名员工生成合同` });
  } catch (error) {
    console.error('[Batch Generate Contracts Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/my', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ code: 400, msg: '缺少用户ID' });
    const contracts = await prisma.hr_employee_contract.findMany({ where: { user_id: BigInt(String(userId)) }, orderBy: { create_time: 'desc' } });
    res.json({ code: 200, data: contracts, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const user_id = body.user_id || body.empId;
    const contract_type = body.contract_type || body.type || '正式';
    const start_date = body.start_date || body.startDate;
    const end_date = body.end_date || body.endDate;
    const probation_months = body.probation_months || body.duration || 0;
    const salary = body.salary || null;
    const sign_date = body.sign_date || body.signDate;
    const remark = body.remark || null;
    const statusMap: Record<string, string> = { '生效中': 'active', '已到期': 'expired', '待签署': 'pending', '已续签': 'renewed' };
    const status = statusMap[body.status] || body.status || 'active';

    const contract = await prisma.hr_employee_contract.create({
      data: {
        user_id: BigInt(user_id), contract_no: 'CON' + Date.now(), contract_type,
        start_date: new Date(start_date), end_date: new Date(end_date),
        probation_months: Number(probation_months) || 0,
        probation_end_date: probation_months ? new Date(new Date(start_date).getTime() + Number(probation_months) * 30 * 24 * 60 * 60 * 1000) : null,
        salary, sign_date: sign_date ? new Date(sign_date) : null, remark, status
      }
    });
    res.json({ code: 200, data: contract, msg: '创建合同成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contract_type, start_date, end_date, salary, status, terminate_reason } = req.body;
    const updateData: any = { update_time: new Date() };
    if (contract_type !== undefined) updateData.contract_type = contract_type;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (salary !== undefined) updateData.salary = salary;
    if (status !== undefined) {
      const statusMap: Record<string, string> = { '生效中': 'active', '已到期': 'expired', '待签署': 'pending', '已续签': 'renewed' };
      updateData.status = statusMap[status] || status;
      if (updateData.status === 'terminated') { updateData.terminate_date = new Date(); updateData.terminate_reason = terminate_reason || null; }
    }
    const updated = await prisma.hr_employee_contract.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新合同成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.hr_employee_contract.delete({ where: { id: BigInt(String(id)) } });
    res.json({ code: 200, msg: '删除合同成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
