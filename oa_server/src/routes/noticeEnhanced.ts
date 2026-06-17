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

    // 获取用户部门
    const userInfo = await prisma.sys_user.findFirst({
      where: { id: BigInt(String(userId)), is_deleted: 0 },
      select: { dept_id: true }
    });

    // 部门公告过滤
    where.OR = [
      { scope: 'all' },
      { scope: 'department', dept_ids: { contains: String(userInfo?.dept_id) } }
    ];

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

    // 获取已读状态
    const noticeIds = notices.map(n => n.id);
    const readRecords = await prisma.oa_announcement_read.findMany({
      where: {
        announcement_id: { in: noticeIds },
        user_id: BigInt(userId)
      }
    });
    const readMap = new Map(readRecords.map(r => [r.announcement_id, true]));

    // 获取发布者信息
    const publisherIds = [...new Set(notices.map(n => n.publisher_id))];
    const publishers = await prisma.sys_user.findMany({
      where: { id: { in: publisherIds } },
      select: { id: true, real_name: true }
    });
    const publisherMap = new Map(publishers.map(p => [p.id, p.real_name]));

    const data = notices.map(n => ({
      ...n,
      is_read: readMap.has(n.id) || false,
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
    const { title, content, type, target_type, target_ids, is_top, require_confirm, attachments } = req.body;

    if (!title || !content) {
      return res.json({ code: 400, msg: '标题和内容不能为空' });
    }

    const noticeNo = 'NOT' + Date.now().toString().slice(-8);

    const notice = await prisma.oa_announcement.create({
      data: {
        title,
        content,
        type: type || 'normal',
        scope: target_type || 'all',
        dept_ids: target_ids ? JSON.stringify(target_ids) : null,
        top: is_top ? 1 : 0,
        attachments: attachments ? JSON.stringify(attachments) : null,
        publisher_id: BigInt(String(user.id)),
        status: 'published',
        publish_time: new Date(),
        create_time: new Date(),
        update_time: new Date()
      }
    });

    // 发送通知给目标用户
    await sendNotification(notice);

    res.json({ code: 200, data: notice, msg: '发布成功' });
  } catch (error) {
    console.error('[Create Notice Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取公告详情
router.get('/:id', async (req: Request, res: Response) => {
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

    // 获取发布者信息
    const publisher = await prisma.sys_user.findFirst({
      where: { id: notice.publisher_id, is_deleted: 0 },
      select: { id: true, real_name: true }
    });

    // 检查已读状态
    const readRecord = await prisma.oa_announcement_read.findFirst({
      where: {
        announcement_id: BigInt(String(id)),
        user_id: BigInt(String(userId))
      }
    });

    // 如果未读，标记为已读
    if (!readRecord) {
      await prisma.oa_announcement_read.create({
        data: {
          announcement_id: BigInt(String(id)),
          user_id: BigInt(String(userId)),
          read_time: new Date()
        }
      });
    }

    // 获取已读统计
    const readCount = await prisma.oa_announcement_read.count({
      where: { announcement_id: BigInt(String(id)) }
    });

    // 获取目标用户总数
    let totalTargetUsers = 0;
    if (notice.scope === 'all') {
      totalTargetUsers = await prisma.sys_user.count({ where: { is_deleted: 0, status: 1 } });
    } else if (notice.scope === 'department') {
      const targetIds = JSON.parse(notice.dept_ids as string || '[]');
      totalTargetUsers = await prisma.sys_user.count({
        where: { dept_id: { in: targetIds.map((id: any) => BigInt(id)) }, is_deleted: 0, status: 1 }
      });
    }

    const data = {
      ...notice,
      publisher_name: publisher?.real_name || '',
      is_read: !!readRecord || true,
      read_count: readCount,
      total_target_users: totalTargetUsers,
      read_rate: totalTargetUsers > 0 ? Math.round((readCount / totalTargetUsers) * 100) : 0,
      attachments: JSON.parse(notice.attachments as string || '[]')
    };

    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[Get Notice Detail Error]', error);
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

    if (!notice.top) {
      return res.json({ code: 400, msg: '该公告不需要确认' });
    }

    // 更新已读记录
    await prisma.oa_announcement_read.upsert({
      where: {
        announcement_id_user_id: {
          announcement_id: BigInt(String(id)),
          user_id: BigInt(String(userId))
        }
      },
      update: {
        read_time: new Date()
      },
      create: {
        announcement_id: BigInt(String(id)),
        user_id: BigInt(String(userId)),
        read_time: new Date()
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

    // 获取用户部门
    const userInfo = await prisma.sys_user.findFirst({
      where: { id: BigInt(String(userId)), is_deleted: 0 },
      select: { dept_id: true }
    });

    // 获取所有可见公告
    const notices = await prisma.oa_announcement.findMany({
      where: {
        is_deleted: 0,
        status: 'published',
        OR: [
          { scope: 'all' },
          { scope: 'department', dept_ids: { contains: String(userInfo?.dept_id) } }
        ]
      },
      select: { id: true }
    });

    const noticeIds = notices.map(n => n.id);

    // 获取已读公告
    const readRecords = await prisma.oa_announcement_read.findMany({
      where: {
        announcement_id: { in: noticeIds },
        user_id: BigInt(String(userId))
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

// 获取公告统计
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;

    const monthStart = new Date(month as string + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const notices = await prisma.oa_announcement.findMany({
      where: {
        is_deleted: 0,
        publish_time: {
          gte: monthStart,
          lt: monthEnd
        }
      }
    });

    const total = notices.length;
    const byType = {
      urgent: notices.filter(n => n.type === 'urgent').length,
      important: notices.filter(n => n.type === 'important').length,
      normal: notices.filter(n => n.type === 'normal').length
    };

    // 获取已读统计
    const noticeIds = notices.map(n => n.id);
    const readRecords = await prisma.oa_announcement_read.findMany({
      where: { announcement_id: { in: noticeIds } }
    });

    const totalReads = readRecords.length;

    res.json({
      code: 200,
      data: {
        total,
        by_type: byType,
        total_reads: totalReads,
        read_rate: total > 0 ? Math.round((totalReads / total) * 100) : 0
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('[Get Statistics Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 发送通知函数
async function sendNotification(notice: any) {
  try {
    let targetUserIds: bigint[] = [];

    if (notice.scope === 'all') {
      const users = await prisma.sys_user.findMany({
        where: { is_deleted: 0, status: 1 },
        select: { id: true }
      });
      targetUserIds = users.map(u => u.id);
    } else if (notice.scope === 'department') {
      const targetIds = JSON.parse(notice.dept_ids || '[]');
      const users = await prisma.sys_user.findMany({
        where: { dept_id: { in: targetIds.map((id: any) => BigInt(id)) }, is_deleted: 0, status: 1 },
        select: { id: true }
      });
      targetUserIds = users.map(u => u.id);
    }

    // 创建消息记录
    if (targetUserIds.length > 0) {
      await prisma.sys_message.createMany({
        data: targetUserIds.map(userId => ({
          receiver_id: userId,
          type: 'notice',
          title: notice.title,
          content: notice.content,
          related_id: notice.id,
          related_type: 'announcement',
          is_read: 0,
          create_time: new Date()
        }))
      });
    }

    console.log(`[通知] 公告 ${notice.notice_no} 已推送给 ${targetUserIds.length} 个用户`);
  } catch (error) {
    console.error('[Send Notification Error]', error);
  }
}

export default router;
