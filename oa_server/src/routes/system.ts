import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/settings', async (req: Request, res: Response) => {
  try {
    const configs = await prisma.sys_config.findMany();
    const settings: any = {};
    configs.forEach(c => {
      let val: any = c.config_value;
      if (c.config_type === 'number') {
        val = Number(val);
      } else if (c.config_type === 'boolean') {
        val = (val === 'true' || val === true);
      }
      // 解析公司信息JSON
      if (c.config_key === 'company_info' && typeof val === 'string') {
        try {
          const companyInfo = JSON.parse(val);
          Object.assign(settings, companyInfo);
        } catch {}
      }
      settings[c.config_key] = val;
    });

    res.json({
      code: 200,
      data: {
        systemName: settings.systemName || settings['system.name'] || '智能OA办公系统',
        logo: settings.logo || settings['system.logo'] || '默认Logo',
        version: settings.version || 'v1.0.0',
        workTimeStart: settings.workTimeStart || settings['work.time.start'] || '09:00',
        workTimeEnd: settings.workTimeEnd || settings['work.time.end'] || '18:00',
        flexTime: settings.flexTime !== undefined ? Number(settings.flexTime) : (settings['work.time.flexible'] !== undefined ? Number(settings['work.time.flexible']) : 15),
        latitude: settings.latitude !== undefined ? Number(settings.latitude) : (settings['attendance.location.latitude'] !== undefined ? Number(settings['attendance.location.latitude']) : 38.820564),
        longitude: settings.longitude !== undefined ? Number(settings.longitude) : (settings['attendance.location.longitude'] !== undefined ? Number(settings['attendance.location.longitude']) : 115.498772),
        radius: settings.radius !== undefined ? Number(settings.radius) : (settings['attendance.location.radius'] !== undefined ? Number(settings['attendance.location.radius']) : 300),
        wifiMac: settings.wifiMac || settings['attendance.wifi.mac'] || '',
        wifiName: settings.wifiName || settings['attendance.wifi.name'] || '',
        deviceCheck: settings.deviceCheck !== undefined ? (settings.deviceCheck === true || settings.deviceCheck === 'true') : (settings['attendance.device.check'] === 'true' || settings['attendance.device.check'] === true),
        // 公司信息
        companyLegalRep: settings.companyLegalRep || '法定代表人',
        companyCreditCode: settings.companyCreditCode || '',
        companyAddress: settings.companyAddress || '',
        companyPhone: settings.companyPhone || '',
        workLocation: settings.workLocation || '',
        payDay: settings.payDay || '15'
      },
      msg: 'success'
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/settings', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (!reqUser?.id) {
      return res.status(401).json({ code: 401, msg: '未登录或登录已失效' });
    }
    const userId = BigInt(reqUser.id);
    const user = await prisma.sys_user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return res.status(401).json({ code: 401, msg: '操作用户不存在' });
    }
    const userRole = await prisma.sys_user_role.findFirst({
      where: { user_id: userId },
      include: { sys_role: true }
    });
    const isSuperAdmin = userRole?.sys_role?.role_code === 'ROLE_ADMIN' || user.username === 'admin';
    if (!isSuperAdmin) {
      return res.status(403).json({ code: 403, msg: '权限不足：仅系统管理员可以修改配置' });
    }

    const { systemName, logo, workTimeStart, workTimeEnd, flexTime, latitude, longitude, radius, wifiMac, wifiName, deviceCheck } = req.body;
    const payload = [
      { key: 'systemName', value: String(systemName), type: 'string' },
      { key: 'logo', value: String(logo), type: 'string' },
      { key: 'workTimeStart', value: String(workTimeStart), type: 'string' },
      { key: 'workTimeEnd', value: String(workTimeEnd), type: 'string' },
      { key: 'flexTime', value: String(flexTime), type: 'number' },
      { key: 'latitude', value: String(latitude), type: 'number' },
      { key: 'longitude', value: String(longitude), type: 'number' },
      { key: 'radius', value: String(radius), type: 'number' },
      { key: 'wifiMac', value: String(wifiMac || ''), type: 'string' },
      { key: 'wifiName', value: String(wifiName || ''), type: 'string' },
      { key: 'deviceCheck', value: String(deviceCheck), type: 'boolean' }
    ];
    for (const item of payload) {
      await prisma.sys_config.upsert({
        where: { config_key: item.key },
        update: { config_value: item.value, config_type: item.type, update_time: new Date() },
        create: { config_key: item.key, config_value: item.value, config_type: item.type, group_name: 'system' }
      });
    }
    res.json({ code: 200, msg: '保存设置成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});


router.get('/logs', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const username = req.query.username ? String(req.query.username) : undefined;
    const moduleName = req.query.module ? String(req.query.module) : undefined;

    const where: any = {};
    if (username) {
      where.OR = [
        { username: { contains: username } },
        { real_name: { contains: username } }
      ];
    }
    if (moduleName) {
      where.module = { contains: moduleName };
    }

    const [logs, total] = await Promise.all([
      prisma.sys_operation_log.findMany({
        where,
        skip,
        take: limit,
        orderBy: { create_time: 'desc' }
      }),
      prisma.sys_operation_log.count({ where })
    ]);

    res.json({
      code: 200,
      data: {
        list: logs,
        total,
        pageNum: page,
        pageSize: limit
      },
      msg: 'success'
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;
