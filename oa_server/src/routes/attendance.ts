import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, date } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const where: any = {};
    if (!isAdmin && reqUser?.id) {
      where.user_id = BigInt(reqUser.id);
    } else if (user_id) {
      where.user_id = BigInt(String(user_id));
    }
    
    if (date) where.attend_date = new Date(String(date));
    const records = await prisma.oa_attendance.findMany({ where, orderBy: { attend_date: 'desc' } });
    res.json({ code: 200, data: records, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const targetUserId = (!isAdmin && reqUser?.id) ? BigInt(reqUser.id) : BigInt(String(userId || '1'));
    const where: any = { user_id: targetUserId };
    if (startDate || endDate) { where.attend_date = {}; if (startDate) where.attend_date.gte = new Date(String(startDate)); if (endDate) where.attend_date.lte = new Date(String(endDate)); }
    const records = await prisma.oa_attendance.findMany({ where });
    const totalDays = records.length;
    const normalDays = records.filter(r => r.status === 'normal').length;
    const lateDays = records.filter(r => r.status === 'late' || r.status === 'late_early').length;
    const earlyDays = records.filter(r => r.status === 'early' || r.status === 'late_early').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const fieldworkDays = records.filter(r => r.status === 'fieldwork' || r.is_fieldwork).length;
    const totalWorkHours = records.reduce((sum, r) => sum + Number(r.work_hours || 0), 0);
    res.json({ code: 200, data: { totalDays, normalDays, lateDays, earlyDays, absentDays, fieldworkDays, totalWorkHours: Math.round(totalWorkHours * 100) / 100 }, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getAttendanceConfig() {
  const configs = await prisma.sys_config.findMany();
  const settings: any = {};
  configs.forEach(c => {
    settings[c.config_key] = c.config_value;
  });

  return {
    workTimeStart: settings.workTimeStart || settings['work.time.start'] || '09:00',
    workTimeEnd: settings.workTimeEnd || settings['work.time.end'] || '18:00',
    flexTime: Number(settings.flexTime !== undefined ? settings.flexTime : (settings['work.time.flexible'] !== undefined ? settings['work.time.flexible'] : 15)),
    latitude: Number(settings.latitude !== undefined ? settings.latitude : (settings['attendance.location.latitude'] !== undefined ? settings['attendance.location.latitude'] : 38.820564)),
    longitude: Number(settings.longitude !== undefined ? settings.longitude : (settings['attendance.location.longitude'] !== undefined ? settings['attendance.location.longitude'] : 115.498772)),
    radius: Number(settings.radius !== undefined ? settings.radius : (settings['attendance.location.radius'] !== undefined ? settings['attendance.location.radius'] : 300)),
    wifiMac: settings.wifiMac || settings['attendance.wifi.mac'] || '',
    wifiName: settings.wifiName || settings['attendance.wifi.name'] || '',
    deviceCheck: settings.deviceCheck === 'true' || settings.deviceCheck === true || settings['attendance.device.check'] === 'true' || settings['attendance.device.check'] === true
  };
}

// 设备验证
async function verifyDevice(userId: bigint, device: string | undefined, config: any): Promise<string | null> {
  if (!config.deviceCheck || !device) return null;
  const record = await prisma.oa_attendance.findFirst({
    where: { user_id: userId, OR: [{ clock_in_device: { not: null } }, { clock_out_device: { not: null } }] },
    orderBy: { attend_date: 'desc' }
  });
  const bound = record ? (record.clock_in_device || record.clock_out_device) : null;
  if (bound && bound !== String(device)) return `该账号已绑定其他设备，无法使用此设备打卡 (绑定设备: ${bound})`;
  return null;
}

// 地理围栏和WiFi验证
function verifyLocation(config: any, latitude: number | undefined, longitude: number | undefined, wifiName: string | undefined, wifiMac: string | undefined): { isWithinRange: boolean; locationDesc: string } {
  let isWithinRange = false;
  let locationDesc = '';

  if ((config.wifiMac || config.wifiName) && (wifiMac || wifiName)) {
    const macMatch = config.wifiMac && wifiMac && config.wifiMac.toLowerCase() === String(wifiMac).toLowerCase();
    const nameMatch = config.wifiName && wifiName && config.wifiName.toLowerCase() === String(wifiName).toLowerCase();
    if (macMatch || nameMatch) {
      return { isWithinRange: true, locationDesc: `办公 Wi-Fi: ${wifiName || wifiMac}` };
    }
  }

  if (latitude !== undefined && longitude !== undefined) {
    const distance = getDistance(Number(latitude), Number(longitude), config.latitude, config.longitude);
    if (distance <= config.radius) {
      return { isWithinRange: true, locationDesc: `范围内打卡 (偏离公司 ${Math.round(distance)}米)` };
    }
    return { isWithinRange: false, locationDesc: `外勤打卡 (偏离公司 ${Math.round(distance)}米)` };
  }
  return { isWithinRange: false, locationDesc: '未提供有效位置 (外勤)' };
}

// 格式化日期为本地日期字符串
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

router.post('/clock-in', async (req: Request, res: Response) => {
  try {
    const { user_id, latitude, longitude, device, wifiName, wifiMac } = req.body;
    const reqUser = (req as any).user;
    const userId = BigInt(user_id || reqUser?.id || 1);

    const config = await getAttendanceConfig();
    const now = new Date();

    const deviceError = await verifyDevice(userId, device, config);
    if (deviceError) return res.json({ code: 400, msg: deviceError });

    const { isWithinRange, locationDesc } = verifyLocation(config, latitude, longitude, wifiName, wifiMac);

    // 3. Status Calculation
    let status = 'normal';
    let isFieldwork = false;
    let fieldworkReviewStatus = null;
    if (!isWithinRange) {
      status = 'fieldwork';
      isFieldwork = true;
      fieldworkReviewStatus = 'pending';
    } else {
      const [startHour, startMin] = config.workTimeStart.split(':').map(Number);
      const targetDate = new Date(now);
      targetDate.setHours(startHour, startMin, 0, 0);
      targetDate.setMinutes(targetDate.getMinutes() + config.flexTime);
      if (now.getTime() > targetDate.getTime()) {
        status = 'late';
      }
    }

    const attendDate = new Date(toLocalDateStr(now));

    let record = await prisma.oa_attendance.findFirst({ where: { user_id: userId, attend_date: attendDate } });
    const fieldworkData = isFieldwork ? { is_fieldwork: true, fieldwork_review_status: fieldworkReviewStatus } : {};
    if (record) {
      if (record.clock_in_time) return res.json({ code: 400, msg: '今天已经签到过了' });
      record = await prisma.oa_attendance.update({
        where: { id: record.id },
        data: {
          clock_in_time: now,
          clock_in_location: locationDesc,
          clock_in_latitude: latitude !== undefined ? Number(latitude) : null,
          clock_in_longitude: longitude !== undefined ? Number(longitude) : null,
          clock_in_device: device ? String(device) : null,
          status: status,
          update_time: now,
          ...fieldworkData
        }
      });
    } else {
      record = await prisma.oa_attendance.create({
        data: {
          user_id: userId,
          attend_date: attendDate,
          clock_in_time: now,
          clock_in_location: locationDesc,
          clock_in_latitude: latitude !== undefined ? Number(latitude) : null,
          clock_in_longitude: longitude !== undefined ? Number(longitude) : null,
          clock_in_device: device ? String(device) : null,
          status: status,
          ...fieldworkData
        }
      });
    }

    const msg = isFieldwork ? '外勤签到成功，待管理员审核' : '签到成功';
    res.json({ code: 200, data: record, msg });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/clock-out', async (req: Request, res: Response) => {
  try {
    const { user_id, latitude, longitude, device, wifiName, wifiMac } = req.body;
    const reqUser = (req as any).user;
    const userId = BigInt(user_id || reqUser?.id || 1);

    const config = await getAttendanceConfig();
    const now = new Date();

    const deviceError = await verifyDevice(userId, device, config);
    if (deviceError) return res.json({ code: 400, msg: deviceError });

    const { isWithinRange, locationDesc } = verifyLocation(config, latitude, longitude, wifiName, wifiMac);

    const isFieldworkClockOut = !isWithinRange;

    const attendDate = new Date(toLocalDateStr(now));

    let record = await prisma.oa_attendance.findFirst({ where: { user_id: userId, attend_date: attendDate } });
    
    const [endHour, endMin] = config.workTimeEnd.split(':').map(Number);
    const targetDate = new Date(now);
    targetDate.setHours(endHour, endMin, 0, 0);
    const isEarly = now.getTime() < targetDate.getTime();

    const fieldworkData: any = {};
    if (isFieldworkClockOut) {
      fieldworkData.is_fieldwork = true;
      fieldworkData.fieldwork_review_status = 'pending';
    }

    if (!record) {
      // No clock-in record for today
      let status = isFieldworkClockOut ? 'fieldwork' : 'early';
      record = await prisma.oa_attendance.create({
        data: {
          user_id: userId,
          attend_date: attendDate,
          clock_out_time: now,
          clock_out_location: locationDesc,
          clock_out_latitude: latitude !== undefined ? Number(latitude) : null,
          clock_out_longitude: longitude !== undefined ? Number(longitude) : null,
          clock_out_device: device ? String(device) : null,
          status: status,
          ...fieldworkData
        }
      });
    } else {
      let workHours = 0;
      if (record.clock_in_time) {
        const diffMs = now.getTime() - new Date(record.clock_in_time).getTime();
        workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        if (workHours < 0) workHours = 0;
      }

      const alreadyFieldwork = record.is_fieldwork || record.status === 'fieldwork';
      let newStatus = record.status;
      if (isFieldworkClockOut || alreadyFieldwork) {
        // 外勤打卡：若上班或下班有一次外勤则标记为 fieldwork
        newStatus = 'fieldwork';
        fieldworkData.is_fieldwork = true;
        fieldworkData.fieldwork_review_status = record.fieldwork_review_status || 'pending';
      } else if (isEarly) {
        if (record.status === 'late') {
          newStatus = 'late_early';
        } else {
          newStatus = 'early';
        }
      } else {
        if (record.status === 'late') {
          newStatus = 'late';
        } else {
          newStatus = 'normal';
        }
      }

      record = await prisma.oa_attendance.update({
        where: { id: record.id },
        data: {
          clock_out_time: now,
          clock_out_location: locationDesc,
          clock_out_latitude: latitude !== undefined ? Number(latitude) : null,
          clock_out_longitude: longitude !== undefined ? Number(longitude) : null,
          clock_out_device: device ? String(device) : null,
          work_hours: workHours,
          status: newStatus,
          update_time: now,
          ...fieldworkData
        }
      });
    }

    const msg = (isFieldworkClockOut || record.is_fieldwork) ? '外勤下班打卡成功，待管理员审核' : '打卡下班成功';
    res.json({ code: 200, data: record, msg });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取待审核外勤记录
router.get('/fieldwork-pending', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const { page = 1, pageSize = 20, start_date, end_date } = req.query;
    const isAdmin = reqUser?.username === 'admin';

    if (!isAdmin) {
      return res.json({ code: 403, msg: '仅管理员可审核外勤记录' });
    }

    const where: any = {
      is_fieldwork: true,
      fieldwork_review_status: 'pending'
    };
    if (start_date && end_date) {
      where.attend_date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const [records, total] = await Promise.all([
      prisma.oa_attendance.findMany({
        where,
        orderBy: { attend_date: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.oa_attendance.count({ where })
    ]);

    const userIds = [...new Set(records.map(r => r.user_id))];
    const users = await prisma.sys_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, real_name: true, department: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const data = records.map(r => {
      const u = userMap.get(r.user_id);
      return { ...r, user_name: u?.real_name || '', department: u?.department || '' };
    });

    res.json({ code: 200, data: { list: data, total, page: Number(page), pageSize: Number(pageSize) }, msg: 'success' });
  } catch (error) {
    console.error('[Fieldwork Pending Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 审核外勤记录
router.put('/fieldwork-review/:id', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';
    if (!isAdmin) {
      return res.json({ code: 403, msg: '仅管理员可审核外勤记录' });
    }

    const id = BigInt(req.params.id);
    const { review_status, final_status, remark } = req.body;

    if (!['approved', 'rejected'].includes(review_status)) {
      return res.json({ code: 400, msg: '审核状态无效，必须为 approved 或 rejected' });
    }

    const record = await prisma.oa_attendance.findUnique({ where: { id } });
    if (!record) {
      return res.json({ code: 404, msg: '考勤记录不存在' });
    }
    if (!record.is_fieldwork) {
      return res.json({ code: 400, msg: '该记录不是外勤打卡记录' });
    }

    let newStatus: string;
    if (review_status === 'approved') {
      // 通过：恢复正常状态，根据打卡时间判断
      newStatus = 'normal';
      if (record.clock_in_time) {
        const config = await getAttendanceConfig();
        const [startHour, startMin] = config.workTimeStart.split(':').map(Number);
        const clockIn = new Date(record.clock_in_time);
        const workStart = new Date(clockIn);
        workStart.setHours(startHour, startMin, 0, 0);
        workStart.setMinutes(workStart.getMinutes() + config.flexTime);
        if (clockIn.getTime() > workStart.getTime()) {
          newStatus = 'late';
        }
      }
    } else {
      // 拒绝：使用管理员指定的最终状态
      const validStatuses = ['late', 'early', 'late_early', 'absent'];
      newStatus = final_status && validStatuses.includes(final_status) ? final_status : 'absent';
    }

    const updated = await prisma.oa_attendance.update({
      where: { id },
      data: {
        status: newStatus,
        fieldwork_review_status: review_status,
        fieldwork_reviewer_id: BigInt(reqUser.id),
        fieldwork_review_time: new Date(),
        fieldwork_review_remark: remark || null,
        update_time: new Date()
      }
    });

    res.json({ code: 200, data: updated, msg: review_status === 'approved' ? '外勤已通过审核' : '外勤已驳回' });
  } catch (error) {
    console.error('[Fieldwork Review Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 外勤统计
router.get('/fieldwork-stats', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';
    const where: any = { is_fieldwork: true };
    if (!isAdmin) where.user_id = BigInt(reqUser.id);

    const [pending, approved, rejected] = await Promise.all([
      prisma.oa_attendance.count({ where: { ...where, fieldwork_review_status: 'pending' } }),
      prisma.oa_attendance.count({ where: { ...where, fieldwork_review_status: 'approved' } }),
      prisma.oa_attendance.count({ where: { ...where, fieldwork_review_status: 'rejected' } })
    ]);

    res.json({ code: 200, data: { pending, approved, rejected, total: pending + approved + rejected }, msg: 'success' });
  } catch (error) {
    console.error('[Fieldwork Stats Error]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/unbind-device', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    const reqUser = (req as any).user;
    const userId = BigInt(user_id || reqUser?.id || 1);
    
    await prisma.oa_attendance.updateMany({
      where: { user_id: userId },
      data: {
        clock_in_device: null,
        clock_out_device: null
      }
    });

    res.json({ code: 200, msg: '设备解绑成功，下次打卡将自动绑定新设备' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
