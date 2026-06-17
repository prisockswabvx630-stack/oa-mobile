import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户信息
const getCurrentUser = (req: Request) => {
  return (req as any).user || {};
};

// 获取公告列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { type, page = 1, pageSize = 20 } = req.query;
    const userId = user.id;
    const isAdmin = user.username === 'admin';

    const where: any = { is_deleted: 0, status: 'published' };
    if (type) where.type = type;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [notices, total] = await Promise.all([
      prisma.oa_announcement.findMany({
        where,
        orderBy: [
          { top: 'desc' },
          { publish_time: 'desc' }
        ],
        skip,
        take: Number(pageSize)
      }),
      prisma.oa_announcement.count({ where })
    ]);

    // 获取发布者信息
    const publisherIds = [...new Set(notices.map(n => n.publisher_id))];
    const publishers = await prisma.sys_user.findMany({
      where: { id: { in: publisherIds } },
      select: { id: true, real_name: true }
    });
    const publisherMap = new Map(publishers.map(p => [p.id, p.real_name]));

    const data = notices.map(n => ({
      ...n,
      publisher_name: publisherMap.get(n.publisher_id) || ''
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
    console.error('[Get Notices Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 发布公告
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { title, content, type, scope, dept_ids, is_top, attachments } = req.body;

    if (!title || !content) {
      return res.json({ code: 400, msg: '标题和内容不能为空' });
    }

    const noticeNo = 'NOT' + Date.now().toString().slice(-8);

    const notice = await prisma.oa_announcement.create({
      data: {
        title,
        content,
        type: type || 'normal',
        scope: scope || 'all',
        dept_ids: dept_ids ? JSON.stringify(dept_ids) : null,
        top: is_top ? 1 : 0,
        attachments: attachments ? JSON.stringify(attachments) : null,
        publisher_id: BigInt(user.id),
        status: 'published',
        publish_time: new Date(),
        create_time: new Date(),
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: notice, msg: '发布成功' });
  } catch (error) {
    console.error('[Create Notice Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取公告详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const notice = await prisma.oa_announcement.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!notice) {
      return res.json({ code: 404, msg: '公告不存在' });
    }

    // 获取发布者信息
    const publisher = await prisma.sys_user.findFirst({
      where: { id: notice.publisher_id, is_deleted: 0 },
      select: { id: true, real_name: true }
    });

    // 增加浏览次数
    await prisma.oa_announcement.update({
      where: { id: BigInt(String(id)) },
      data: { view_count: { increment: 1 } }
    });

    const data = {
      ...notice,
      publisher_name: publisher?.real_name || '',
      attachments: notice.attachments ? JSON.parse(notice.attachments as string) : []
    };

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Notice Detail Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 标记已读
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const userId = user.id;

    const notice = await prisma.oa_announcement.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!notice) {
      return res.json({ code: 404, msg: '公告不存在' });
    }

    // 检查是否已读
    const existingRead = await prisma.oa_announcement_read.findFirst({
      where: {
        announcement_id: BigInt(String(id)),
        user_id: BigInt(String(userId))
      }
    });

    if (!existingRead) {
      await prisma.oa_announcement_read.create({
        data: {
          announcement_id: BigInt(String(id)),
          user_id: BigInt(String(userId)),
          read_time: new Date()
        }
      });
    }

    res.json({ code: 200, msg: '已标记已读' });
  } catch (error) {
    console.error('[Mark Read Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 确认公告
router.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const userId = user.id;

    const notice = await prisma.oa_announcement.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!notice) {
      return res.json({ code: 404, msg: '公告不存在' });
    }

    // 更新或创建确认记录
    await prisma.oa_announcement_confirm.upsert({
      where: {
        announcement_id_user_id: {
          announcement_id: BigInt(String(id)),
          user_id: BigInt(String(userId))
        }
      },
      update: {
        is_confirmed: 1,
        confirmed_time: new Date()
      },
      create: {
        announcement_id: BigInt(String(id)),
        user_id: BigInt(String(userId)),
        is_confirmed: 1,
        confirmed_time: new Date()
      }
    });

    res.json({ code: 200, msg: '确认成功' });
  } catch (error) {
    console.error('[Confirm Notice Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取未读公告数量
router.get('/unread/count', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const userId = user.id;

    // 获取所有已发布公告
    const notices = await prisma.oa_announcement.findMany({
      where: { is_deleted: 0, status: 'published' },
      select: { id: true }
    });

    const noticeIds = notices.map(n => n.id);

    // 获取已读公告
    const readRecords = await prisma.oa_announcement_read.findMany({
      where: {
        announcement_id: { in: noticeIds },
        user_id: BigInt(userId)
      },
      select: { announcement_id: true }
    });

    const readIds = new Set(readRecords.map(r => r.announcement_id));
    const unreadCount = noticeIds.filter(id => !readIds.has(id)).length;

    res.json({
      code: 200,
      data: { unread_count: unreadCount },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Unread Count Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 删除公告
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const notice = await prisma.oa_announcement.findFirst({
      where: { id: BigInt(String(id)), is_deleted: 0 }
    });

    if (!notice) {
      return res.json({ code: 404, msg: '公告不存在' });
    }

    // 权限检查：只有发布者或管理员可以删除
    if (String(notice.publisher_id) !== String(user.id) && user.username !== 'admin') {
      return res.json({ code: 403, msg: '权限不足' });
    }

    // 软删除
    await prisma.oa_announcement.update({
      where: { id: BigInt(String(id)) },
      data: { is_deleted: 1, update_time: new Date() }
    });

    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    console.error('[Delete Notice Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 公告统计
router.get('/statistics/summary', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;

    let where: any = { is_deleted: 0 };
    if (month) {
      const monthStart = new Date(month as string + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      where.publish_time = { gte: monthStart, lt: monthEnd };
    }

    const notices = await prisma.oa_announcement.findMany({ where });

    const total = notices.length;
    const byType = {
      urgent: notices.filter(n => n.type === 'urgent').length,
      important: notices.filter(n => n.type === 'important').length,
      normal: notices.filter(n => n.type === 'normal').length
    };

    const totalViews = notices.reduce((sum, n) => sum + n.view_count, 0);

    res.json({
      code: 200,
      data: {
        total,
        by_type: byType,
        total_views: totalViews
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Notice Statistics Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
