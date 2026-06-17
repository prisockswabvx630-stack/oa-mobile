import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function assetOrClause(id: any) {
  const idStr = String(id);
  const or: any[] = [{ asset_no: idStr }];
  if (!isNaN(Number(idStr))) {
    or.push({ id: BigInt(idStr) });
  }
  return or;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = { is_deleted: 0 };
    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      const myRecords = await prisma.oa_asset_record.findMany({
        where: { user_id: userId },
        select: { asset_id: true }
      });
      const myAssetIds = myRecords.map(r => r.asset_id);
      where.OR = [
        { user_id: userId },
        { id: { in: myAssetIds } }
      ];
    }

    const assets = await prisma.oa_asset.findMany({ where, orderBy: { create_time: 'desc' } });
    const userIds = [...new Set(assets.filter(a => a.user_id).map(a => a.user_id!))];
    const users = await prisma.sys_user.findMany({ where: { id: { in: userIds } }, select: { id: true, real_name: true, sys_department: { select: { dept_name: true } } } });
    const userMap = new Map(users.map(u => [u.id, u]));
    const data = assets.map(a => { const user = a.user_id ? userMap.get(a.user_id) : null; return { ...a, user_name: user?.real_name || '-', dept_name: user?.sys_department?.dept_name || '-' }; });
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/my-records', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const uid = (!isAdmin && reqUser?.id) ? BigInt(reqUser.id) : BigInt(String(userId || '1'));
    const records = await prisma.oa_asset_record.findMany({ where: { user_id: uid }, orderBy: { create_time: 'desc' } });
    const assetIds = [...new Set(records.map(r => r.asset_id))];
    const assets = await prisma.oa_asset.findMany({ where: { id: { in: assetIds } }, select: { id: true, asset_name: true, asset_no: true } });
    const assetMap = new Map(assets.map(a => [a.id, a]));
    const data = records.map(r => ({ ...r, asset_name: assetMap.get(r.asset_id)?.asset_name || '', asset_no: assetMap.get(r.asset_id)?.asset_no || '' }));
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, model, user, dept, purchaseDate, status } = req.body;
    let userId: bigint | null = null;
    if (user && user !== '-') { const dbUser = await prisma.sys_user.findFirst({ where: { real_name: user, is_deleted: 0 } }); if (dbUser) userId = dbUser.id; }
    const assetNo = 'AST' + Date.now().toString().slice(-6);
    const dbStatus = status === '在用' ? 'in_use' : (status === '闲置' ? 'idle' : (status === '报废' ? 'scrapped' : 'idle'));
    const newAsset = await prisma.oa_asset.create({
      data: { asset_no: assetNo, asset_name: name, category: category || '其他', model: model || '', user_id: userId, purchase_date: purchaseDate ? new Date(purchaseDate) : new Date(), original_value: 0, status: dbStatus }
    });
    res.json({ code: 200, data: newAsset, msg: '新增资产成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, model, user, status, purchaseDate } = req.body;
    let userId: bigint | null | undefined = undefined;
    if (user !== undefined) { if (user && user !== '-') { const dbUser = await prisma.sys_user.findFirst({ where: { real_name: user, is_deleted: 0 } }); if (dbUser) userId = dbUser.id; } else { userId = null; } }
    const dbStatus = status ? (status === '在用' ? 'in_use' : (status === '闲置' ? 'idle' : (status === '报废' ? 'scrapped' : 'idle'))) : undefined;
    const asset = await prisma.oa_asset.findFirst({ where: { OR: assetOrClause(id) } });
    if (!asset) return res.json({ code: 404, msg: '资产不存在' });
    const updateData: any = { update_time: new Date() };
    if (name !== undefined) updateData.asset_name = name;
    if (category !== undefined) updateData.category = category;
    if (model !== undefined) updateData.model = model;
    if (userId !== undefined) updateData.user_id = userId;
    if (dbStatus !== undefined) updateData.status = dbStatus;
    if (purchaseDate !== undefined) updateData.purchase_date = purchaseDate ? new Date(purchaseDate) : undefined;
    const updated = await prisma.oa_asset.update({ where: { id: asset.id }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新资产成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await prisma.oa_asset.findFirst({ where: { OR: assetOrClause(id) } });
    if (!asset) return res.json({ code: 404, msg: '资产不存在' });
    await prisma.oa_asset.update({ where: { id: asset.id }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除资产成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/:id/borrow', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, remark } = req.body;
    const uid = BigInt(userId || 1);
    const asset = await prisma.oa_asset.findFirst({ where: { OR: assetOrClause(id) } });
    if (!asset) return res.json({ code: 404, msg: '资产不存在' });
    const record = await prisma.oa_asset_record.create({ data: { asset_id: asset.id, user_id: uid, type: 'borrow', borrow_date: new Date(), status: 'active', remark: remark || null } });
    await prisma.oa_asset.update({ where: { id: asset.id }, data: { user_id: uid, status: 'in_use', update_time: new Date() } });
    res.json({ code: 200, data: record, msg: '借用成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/:id/return', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const uid = BigInt(userId || 1);
    const asset = await prisma.oa_asset.findFirst({ where: { OR: assetOrClause(id) } });
    if (!asset) return res.json({ code: 404, msg: '资产不存在' });
    const record = await prisma.oa_asset_record.findFirst({ where: { asset_id: asset.id, user_id: uid, status: 'active' } });
    if (record) { await prisma.oa_asset_record.update({ where: { id: record.id }, data: { return_date: new Date(), status: 'returned', update_time: new Date() } }); }
    await prisma.oa_asset.update({ where: { id: asset.id }, data: { user_id: null, status: 'idle', update_time: new Date() } });
    res.json({ code: 200, msg: '归还成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
