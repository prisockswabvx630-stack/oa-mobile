import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET 环境变量未设置，服务启动中止');
  process.exit(1);
}
const JWT_EXPIRES_IN = '24h';

// 生成JWT Token
export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证JWT Token中间件
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ code: 401, msg: '未授权，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: 'Token无效或已过期，请重新登录' });
  }
};

// 角色权限中间件
export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ code: 401, msg: '未授权' });
    }

    try {
      // 查询用户角色
      const userRole = await prisma.sys_user_role.findFirst({
        where: { user_id: BigInt(user.id) },
        include: { sys_role: true }
      });

      if (!userRole || !userRole.sys_role) {
        return res.status(403).json({ code: 403, msg: '权限不足，未分配角色' });
      }

      const roleCode = userRole.sys_role.role_code;

      // 管理员拥有所有权限
      if (roleCode === 'ROLE_ADMIN') {
        next();
        return;
      }

      // 检查是否有指定角色
      if (roles.length > 0 && !roles.includes(roleCode)) {
        return res.status(403).json({ code: 403, msg: '权限不足，无法执行此操作' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ code: 500, msg: '权限验证失败' });
    }
  };
};

// 资源所有权验证中间件
export const requireOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ code: 401, msg: '未授权' });
    }

    // 管理员跳过所有权检查
    const userRole = await prisma.sys_user_role.findFirst({
      where: { user_id: BigInt(user.id) },
      include: { sys_role: true }
    });

    if (userRole?.sys_role?.role_code === 'ROLE_ADMIN') {
      next();
      return;
    }

    // 对于任务，检查是否是负责人或创建人
    if (resourceType === 'task') {
      const taskId = parseInt(String(req.params.id || ''));
      if (taskId) {
        const task = await prisma.oa_task.findFirst({
          where: { id: BigInt(taskId), is_deleted: 0 }
        });

        if (!task) {
          return res.status(404).json({ code: 404, msg: '资源不存在' });
        }

        if (task.assignee_id !== BigInt(user.id) && task.creator_id !== BigInt(user.id)) {
          return res.status(403).json({ code: 403, msg: '权限不足，只能操作自己负责或创建的资源' });
        }
      }
    }

    next();
  };
};
