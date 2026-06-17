import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // 只记录非 GET 接口，过滤健康检查、系统设置日志接口等
  if (req.method === 'GET' || req.path.includes('/health') || req.path.includes('/system/logs')) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', async () => {
    try {
      const executeTime = Date.now() - startTime;

      // 获取当前操作人信息
      const userIdStr = req.headers['x-user-id'];
      const usernameHeader = req.headers['x-user-name'];
      const realNameHeader = req.headers['x-real-name'];

      let userId = userIdStr ? BigInt(userIdStr as string) : 0n;
      let username = usernameHeader ? String(usernameHeader) : 'anonymous';
      let realName = realNameHeader ? decodeURIComponent(realNameHeader as string) : '匿名用户';

      // 针对登录接口特殊处理
      if (req.path === '/login' || req.originalUrl.includes('/api/auth/login')) {
        username = req.body?.username || 'anonymous';
        realName = '登录尝试';
        const dbUser = await prisma.sys_user.findFirst({ where: { username, is_deleted: 0 } });
        if (dbUser) {
          userId = dbUser.id;
          realName = dbUser.real_name;
        }
      }

      // 提取模块名（如 /api/users -> users）
      const pathParts = req.originalUrl.split('/').filter(Boolean);
      const module = pathParts[1] || 'system';

      // 判定请求状态 (HTTP Status 2xx/3xx 表示成功)
      const status = res.statusCode >= 200 && res.statusCode < 400 ? 1 : 0;

      // 参数脱敏，避免泄露密码
      let bodyData = { ...req.body };
      if (bodyData.password) {
        bodyData.password = '******';
      }

      await prisma.sys_operation_log.create({
        data: {
          user_id: userId,
          username: username,
          real_name: realName,
          module: module,
          operation: `${req.method} ${req.path}`,
          method: `${req.method}`,
          request_url: req.originalUrl.substring(0, 200),
          request_params: JSON.stringify(bodyData).substring(0, 1000),
          request_ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
          ip_location: '本地局域网',
          status: status,
          error_msg: status === 1 ? null : `HTTP Status ${res.statusCode}`,
          execute_time: executeTime,
          create_time: new Date()
        }
      });
    } catch (err) {
      console.error('记录操作日志出错:', err);
    }
  });

  next();
};
export default logMiddleware;
