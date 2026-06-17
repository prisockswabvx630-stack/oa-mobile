import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function empOrClause(id: any) {
  const idStr = String(id);
  const or: any[] = [{ emp_no: idStr }];
  if (!isNaN(Number(idStr))) {
    or.push({ id: BigInt(idStr) });
  }
  return or;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, month } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = {};

    if (!isAdmin && reqUser?.id) {
      where.user_id = BigInt(reqUser.id);
    } else if (user_id) {
      where.user_id = BigInt(String(user_id));
    }
    
    if (month) where.month = String(month);
    const records = await prisma.oa_salary.findMany({ where, orderBy: { month: 'desc' } });
    res.json({ code: 200, data: records, msg: 'success' });
  } catch (error) {
    console.error('[GET /salary]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:empId', async (req: Request, res: Response) => {
  try {
    const { empId } = req.params;
    const { baseSalary, allowance, bonus, socialSec, housingFund, tax, status, month } = req.body;
    const user = await prisma.sys_user.findFirst({
      where: { OR: empOrClause(empId) }
    });
    if (!user) return res.json({ code: 404, msg: '用户不存在' });

    const activeMonth = month || new Date().toISOString().slice(0, 7);
    const base = Math.max(0, Number(baseSalary) || 8000);
    const positionAllowance = Math.max(0, Number(allowance) || 1000);
    const performanceBonus = Math.max(0, Number(bonus) || 1000);
    const soc = Math.max(0, Number(socialSec) || 800);
    const house = Math.max(0, Number(housingFund) || 500);
    const tx = Math.max(0, Number(tax) || 150);
    const dbStatus = status === '已发放' ? 'paid' : 'draft';
    const net = base + positionAllowance + performanceBonus - soc - house - tx;

    const record = await prisma.oa_salary.upsert({
      where: { user_id_month: { user_id: user.id, month: activeMonth } },
      update: { base_salary: base, position_allowance: positionAllowance, performance_bonus: performanceBonus, social_security: soc, housing_fund: house, income_tax: tx, net_salary: net, status: dbStatus, paid_time: dbStatus === 'paid' ? new Date() : null, update_time: new Date() },
      create: { user_id: user.id, month: activeMonth, base_salary: base, position_allowance: positionAllowance, performance_bonus: performanceBonus, social_security: soc, housing_fund: house, income_tax: tx, net_salary: net, status: dbStatus, paid_time: dbStatus === 'paid' ? new Date() : null }
    });
    res.json({ code: 200, data: record, msg: '更新薪资成功' });
  } catch (error) {
    console.error('[PUT /salary/:empId]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
