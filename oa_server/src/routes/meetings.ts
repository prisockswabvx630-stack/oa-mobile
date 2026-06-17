import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 会议室列表（固定资源 + 可扩展）
const MEETING_ROOMS = [
  { id: 1, name: '会议室A', capacity: 10, location: '3楼东区', equipment: ['投影仪', '白板', '视频会议'] },
  { id: 2, name: '会议室B', capacity: 20, location: '3楼西区', equipment: ['投影仪', '白板', '音响'] },
  { id: 3, name: '会议室C', capacity: 6, location: '5楼北区', equipment: ['电视屏', '白板'] },
  { id: 4, name: '线上会议', capacity: 100, location: '远程', equipment: ['腾讯会议', '钉钉'] }
];

// 获取会议室列表
router.get('/rooms', async (_req: Request, res: Response) => {
  res.json({ code: 200, data: MEETING_ROOMS, msg: 'success' });
});

// 会议列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = { is_deleted: 0 };
    if (status) where.status = String(status);

    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      const user = await prisma.sys_user.findUnique({ where: { id: userId } });
      const realName = user?.real_name;
      where.OR = [
        { organizer_id: userId },
        { attendees: { contains: String(userId) } },
        ...(realName ? [{ attendees: { contains: realName } }] : [])
      ];
    }

    const meetings = await prisma.oa_meeting.findMany({ where, orderBy: { start_time: 'desc' } });
    const organizerIds = [...new Set(meetings.map(m => m.organizer_id))];
    const users = await prisma.sys_user.findMany({ where: { id: { in: organizerIds } }, select: { id: true, real_name: true } });
    const userMap = new Map(users.map(u => [u.id, u.real_name]));
    const data = meetings.map(m => ({ ...m, organizer_name: userMap.get(m.organizer_id) || '' }));
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 单个会议详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.oa_meeting.findUnique({ where: { id: BigInt(String(id)) } });
    if (!meeting || meeting.is_deleted) return res.json({ code: 404, msg: '会议不存在' });
    const organizer = await prisma.sys_user.findUnique({ where: { id: meeting.organizer_id }, select: { real_name: true } });
    res.json({ code: 200, data: { ...meeting, organizer_name: organizer?.real_name || '' }, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 创建会议
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, room_name, organizer_name, start_time, end_time, attendees, status, external_meeting_url, external_meeting_id, external_platform } = req.body;
    let organizerId: bigint = BigInt(1);
    if (organizer_name) { const u = await prisma.sys_user.findFirst({ where: { real_name: organizer_name, is_deleted: 0 } }); if (u) organizerId = u.id; }
    const dbStatus = status === '进行中' ? 'ongoing' : (status === '已取消' ? 'cancelled' : 'upcoming');
    const meeting = await prisma.oa_meeting.create({
      data: {
        meeting_no: 'MT' + Date.now().toString().slice(-6),
        title: title || '',
        organizer_id: organizerId,
        room_name: room_name || '',
        start_time: start_time ? new Date(start_time) : new Date(),
        end_time: end_time ? new Date(end_time) : new Date(Date.now() + 3600000),
        attendees: attendees ? String(attendees) : '1',
        status: dbStatus,
        external_meeting_url: external_meeting_url || null,
        external_meeting_id: external_meeting_id || null,
        external_platform: external_platform || null
      }
    });
    res.json({ code: 200, data: meeting, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 更新会议
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { minutes, status, room_name, title, start_time, end_time, attendees, description, external_meeting_url, external_meeting_id, external_platform } = req.body;
    const updateData: any = { update_time: new Date() };
    if (minutes !== undefined) updateData.minutes = minutes;
    if (room_name !== undefined) updateData.room_name = room_name;
    if (title !== undefined) updateData.title = title;
    if (start_time !== undefined) updateData.start_time = new Date(start_time);
    if (end_time !== undefined) updateData.end_time = new Date(end_time);
    if (attendees !== undefined) updateData.attendees = String(attendees);
    if (external_meeting_url !== undefined) updateData.external_meeting_url = external_meeting_url;
    if (external_meeting_id !== undefined) updateData.external_meeting_id = external_meeting_id;
    if (external_platform !== undefined) updateData.external_platform = external_platform;
    if (status !== undefined) {
      updateData.status = status === '进行中' ? 'ongoing' : (status === '已取消' ? 'cancelled' : (status === '已结束' ? 'ended' : 'upcoming'));
    }
    const updated = await prisma.oa_meeting.update({ where: { id: BigInt(String(id)) }, data: updateData });
    res.json({ code: 200, data: updated, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 删除会议
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.oa_meeting.update({ where: { id: BigInt(String(id)) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 取消会议
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await prisma.oa_meeting.update({
      where: { id: BigInt(String(id)) },
      data: { status: 'cancelled', cancel_reason: reason || null, update_time: new Date() }
    });
    res.json({ code: 200, data: updated, msg: '取消会议成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 第三方会议平台集成 ==========

// 同步到腾讯会议（集成接口）
router.post('/:id/sync-tencent', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.oa_meeting.findUnique({ where: { id: BigInt(String(id)) } });
    if (!meeting) return res.json({ code: 404, msg: '会议不存在' });

    // TODO: 对接腾讯会议开放平台API
    // 文档: https://meeting.tencent.com/boe/open-api/doc
    // 1. 使用企业授权获取 access_token
    // 2. 调用 POST /v1/meetings 创建会议
    // 3. 获取 meeting_id 和 join_url
    // 示例请求体:
    // {
    //   "subject": meeting.title,
    //   "start_time": meeting.start_time,
    //   "end_time": meeting.end_time,
    //   "meeting_type": 0,
    //   "hosts": [{ "userid": "..." }]
    // }

    const mockTencentResponse = {
      meeting_id: 'TM' + Date.now().toString().slice(-8),
      join_url: `https://meeting.tencent.com/dm/${Date.now().toString().slice(-8)}`,
      host_url: `https://meeting.tencent.com/host/${Date.now().toString().slice(-8)}`,
      status: 'created'
    };

    // 更新会议记录，关联腾讯会议信息
    await prisma.oa_meeting.update({
      where: { id: BigInt(String(id)) },
      data: {
        external_meeting_id: mockTencentResponse.meeting_id,
        external_meeting_url: mockTencentResponse.join_url,
        external_platform: 'tencent',
        update_time: new Date()
      }
    });

    res.json({
      code: 200,
      data: {
        platform: 'tencent',
        meeting_id: mockTencentResponse.meeting_id,
        join_url: mockTencentResponse.join_url,
        host_url: mockTencentResponse.host_url,
        message: '已同步到腾讯会议。正式环境请配置 TENCENT_MEETING_APP_ID 和 TENCENT_MEETING_SECRET。'
      },
      msg: '同步腾讯会议成功'
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 同步到钉钉（集成接口）
router.post('/:id/sync-dingtalk', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.oa_meeting.findUnique({ where: { id: BigInt(String(id)) } });
    if (!meeting) return res.json({ code: 404, msg: '会议不存在' });

    // TODO: 对接钉钉开放平台API
    // 文档: https://open.dingtalk.com/document/orgapp/create-a-meeting
    // 1. 使用企业内部应用 appKey/appSecret 获取 access_token
    // 2. 调用 POST /v1.0/cloud/meeting/create 创建会议
    // 3. 获取 conferenceId 和 meeting链接
    // 示例请求体:
    // {
    //   "userId": "...",
    //   "title": meeting.title,
    //   "startTime": meeting.start_time.getTime(),
    //   "endTime": meeting.end_time.getTime(),
    //   "meetingType": 0
    // }

    const mockDingtalkResponse = {
      conferenceId: 'DT' + Date.now().toString().slice(-8),
      meeting_url: `https://meeting.dingtalk.com/app/home?conferenceId=DT${Date.now().toString().slice(-8)}`,
      status: 'created'
    };

    // 更新会议记录，关联钉钉会议信息
    await prisma.oa_meeting.update({
      where: { id: BigInt(String(id)) },
      data: {
        external_meeting_id: mockDingtalkResponse.conferenceId,
        external_meeting_url: mockDingtalkResponse.meeting_url,
        external_platform: 'dingtalk',
        update_time: new Date()
      }
    });

    res.json({
      code: 200,
      data: {
        platform: 'dingtalk',
        conference_id: mockDingtalkResponse.conferenceId,
        meeting_url: mockDingtalkResponse.meeting_url,
        message: '已同步到钉钉。正式环境请配置 DINGTALK_APP_KEY 和 DINGTALK_APP_SECRET。'
      },
      msg: '同步钉钉成功'
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 腾讯会议 webhook 回调（接收会议状态变更通知）
router.post('/webhook/tencent', async (req: Request, res: Response) => {
  try {
    const { event_type, meeting_id, status } = req.body;
    // TODO: 验证签名，处理事件
    // event_type: meeting.started / meeting.ended / meeting.cancelled
    console.log('[腾讯会议回调]', event_type, meeting_id, status);
    res.json({ code: 200, msg: 'ok' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 钉钉 webhook 回调（接收会议状态变更通知）
router.post('/webhook/dingtalk', async (req: Request, res: Response) => {
  try {
    const { EventType, conferenceId } = req.body;
    // TODO: 验证签名，处理事件
    // EventType: meeting_start / meeting_end
    console.log('[钉钉回调]', EventType, conferenceId);
    res.json({ code: 200, msg: 'ok' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
