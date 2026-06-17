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
      const user = await prisma.sys_user.findUnique({ where: { id: userId }, select: { dept_id: true } });
      const deptId = user?.dept_id;

      where.OR = [
        { scope: 'all' },
        { publisher_id: userId },
        ...(deptId ? [
          { scope: 'dept', dept_ids: null },
          { scope: 'dept', dept_ids: { contains: String(deptId) } }
        ] : [])
      ];
    }

    const notices = await prisma.oa_announcement.findMany({ where, orderBy: { create_time: 'desc' } });
    res.json({ code: 200, data: notices, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const uid = BigInt(String(userId || '1'));
    const total = await prisma.oa_announcement.count({ where: { is_deleted: 0, status: 'published' } });
    const read = await prisma.oa_announcement_read.count({ where: { user_id: uid } });
    res.json({ code: 200, data: { unread: total - read }, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, scope, content } = req.body;
    const updateData: any = { update_time: new Date() };
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type === '公司公告' ? 'company' : 'dept';
    if (scope !== undefined) updateData.scope = scope === '全员' ? 'all' : 'dept';
    if (content !== undefined) updateData.content = content;
    const updated = await prisma.oa_announcement.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新公告成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const uid = BigInt(userId || 1);
    await prisma.oa_announcement_read.upsert({
      where: { announcement_id_user_id: { announcement_id: BigInt(String(id)), user_id: uid } },
      update: { read_time: new Date() },
      create: { announcement_id: BigInt(String(id)), user_id: uid }
    });
    await prisma.oa_announcement.update({ where: { id: BigInt(String(id)) }, data: { view_count: { increment: 1 } } });
    res.json({ code: 200, msg: '标记已读成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, type, scope, publisher, status } = req.body;
    const dbType = type === '公司公告' ? 'company' : 'dept';
    const dbScope = scope === '全员' ? 'all' : 'dept';
    let publisherId: bigint = BigInt(1);
    if (publisher) { const user = await prisma.sys_user.findFirst({ where: { real_name: publisher, is_deleted: 0 } }); if (user) publisherId = user.id; }
    const newNotice = await prisma.oa_announcement.create({
      data: { title, type: dbType, scope: dbScope, publisher_id: publisherId, content: req.body.content || title, status: 'published', publish_time: new Date() }
    });
    res.json({ code: 200, data: newNotice, msg: '发布公告成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id/withdraw', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.oa_announcement.update({
      where: { id: BigInt(String(id)) },
      data: { status: 'withdrawn', withdraw_time: new Date(), update_time: new Date() }
    });
    res.json({ code: 200, data: updated, msg: '撤回公告成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.oa_announcement.update({ where: { id: BigInt(String(id)) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除公告成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
