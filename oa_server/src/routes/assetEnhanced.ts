import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 资产领用
router.post('/borrow', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { asset_id, purpose, expected_return_date } = req.body;

    if (!asset_id || !purpose) {
      return res.json({ code: 400, msg: '资产ID和领用目的不能为空' });
    }

    // 检查资产是否存在
    const asset = await prisma.oa_asset.findFirst({
      where: { id: BigInt(asset_id), is_deleted: 0 }
    });

    if (!asset) {
      return res.json({ code: 404, msg: '资产不存在' });
    }

    if (asset.status !== 'idle') {
      return res.json({ code: 400, msg: '资产不可用，当前状态: ' + asset.status });
    }

    // 创建领用记录
    const borrow = await prisma.oa_asset_borrow.create({
      data: {
        asset_id: BigInt(asset_id),
        borrower_id: BigInt(user.id),
        borrow_time: new Date(),
        expected_return_time: expected_return_date ? new Date(expected_return_date) : null,
        purpose,
        status: 'borrowed',
        create_time: new Date(),
        update_time: new Date()
      }
    });

    // 更新资产状态
    await prisma.oa_asset.update({
      where: { id: BigInt(asset_id) },
      data: { status: 'in_use', update_time: new Date() }
    });

    res.json({ code: 200, data: borrow, msg: '领用成功' });
  } catch (error) {
    console.error('[Borrow Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 资产归还
router.post('/return', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { borrow_id, condition } = req.body;

    if (!borrow_id) {
      return res.json({ code: 400, msg: '领用记录ID不能为空' });
    }

    // 检查领用记录
    const borrow = await prisma.oa_asset_borrow.findFirst({
      where: { id: BigInt(borrow_id) }
    });

    if (!borrow) {
      return res.json({ code: 404, msg: '领用记录不存在' });
    }

    if (borrow.status !== 'borrowed') {
      return res.json({ code: 400, msg: '该资产已归还' });
    }

    // 权限检查：只有借用人或管理员可以归还
    if (String(borrow.borrower_id) !== String(user.id) && user.username !== 'admin') {
      return res.json({ code: 403, msg: '权限不足' });
    }

    // 更新领用记录
    await prisma.oa_asset_borrow.update({
      where: { id: BigInt(borrow_id) },
      data: {
        actual_return_time: new Date(),
        status: 'returned',
        update_time: new Date()
      }
    });

    // 更新资产状态
    await prisma.oa_asset.update({
      where: { id: borrow.asset_id },
      data: { status: 'idle', update_time: new Date() }
    });

    res.json({ code: 200, msg: '归还成功' });
  } catch (error) {
    console.error('[Return Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取领用记录
router.get('/borrow-records', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { asset_id, status, page = 1, pageSize = 20 } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = {};
    if (asset_id) where.asset_id = BigInt(asset_id as string);
    if (status) where.status = status;

    // 非管理员只能看到自己的记录
    if (!isAdmin) {
      where.borrower_id = BigInt(userId);
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [records, total] = await Promise.all([
      prisma.oa_asset_borrow.findMany({
        where,
        orderBy: { create_time: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.oa_asset_borrow.count({ where })
    ]);

    // 获取资产和用户信息
    const assetIds = [...new Set(records.map(r => r.asset_id))];
    const userIds = [...new Set(records.map(r => r.borrower_id))];

    const [assets, users] = await Promise.all([
      prisma.oa_asset.findMany({
        where: { id: { in: assetIds } },
        select: { id: true, asset_name: true, asset_no: true }
      }),
      prisma.sys_user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, real_name: true }
      })
    ]);

    const assetMap = new Map(assets.map(a => [a.id, a]));
    const userMap = new Map(users.map(u => [u.id, u.real_name]));

    const data = records.map(r => ({
      ...r,
      asset_name: assetMap.get(r.asset_id)?.asset_name || '',
      asset_no: assetMap.get(r.asset_id)?.asset_no || '',
      borrower_name: userMap.get(r.borrower_id) || ''
    }));

    res.json({
      code: 200,
      data: {
        list: data,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Borrow Records Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 资产报废
router.post('/scrap', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { asset_id, reason } = req.body;

    if (!asset_id || !reason) {
      return res.json({ code: 400, msg: '资产ID和报废原因不能为空' });
    }

    // 检查资产
    const asset = await prisma.oa_asset.findFirst({
      where: { id: BigInt(asset_id), is_deleted: 0 }
    });

    if (!asset) {
      return res.json({ code: 404, msg: '资产不存在' });
    }

    if (asset.status === 'scrapped') {
      return res.json({ code: 400, msg: '资产已报废' });
    }

    // 更新资产状态
    await prisma.oa_asset.update({
      where: { id: BigInt(asset_id) },
      data: {
        status: 'scrapped',
        remark: reason,
        update_time: new Date()
      }
    });

    res.json({ code: 200, msg: '报废成功' });
  } catch (error) {
    console.error('[Scrap Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 资产维修
router.post('/repair', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { asset_id, reason } = req.body;

    if (!asset_id || !reason) {
      return res.json({ code: 400, msg: '资产ID和维修原因不能为空' });
    }

    // 检查资产
    const asset = await prisma.oa_asset.findFirst({
      where: { id: BigInt(asset_id), is_deleted: 0 }
    });

    if (!asset) {
      return res.json({ code: 404, msg: '资产不存在' });
    }

    // 更新资产状态
    await prisma.oa_asset.update({
      where: { id: BigInt(asset_id) },
      data: {
        status: 'maintenance',
        remark: reason,
        update_time: new Date()
      }
    });

    res.json({ code: 200, msg: '已送修' });
  } catch (error) {
    console.error('[Repair Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 资产统计
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const assets = await prisma.oa_asset.findMany({
      where: { is_deleted: 0 }
    });

    const total = assets.length;
    const idle = assets.filter(a => a.status === 'idle').length;
    const inUse = assets.filter(a => a.status === 'in_use').length;
    const maintenance = assets.filter(a => a.status === 'maintenance').length;
    const scrapped = assets.filter(a => a.status === 'scrapped').length;

    const totalValue = assets.reduce((sum, a) => sum + Number(a.current_value || a.original_value || 0), 0);

    res.json({
      code: 200,
      data: {
        total,
        idle,
        in_use: inUse,
        maintenance,
        scrapped,
        total_value: Math.round(totalValue * 100) / 100
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Asset Statistics Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
