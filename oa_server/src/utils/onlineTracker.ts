import { Request, Response, NextFunction } from 'express';

interface OnlineUser {
  id: string;
  username: string;
  realName: string;
  lastActiveTime: Date;
  ip: string;
  userAgent: string;
}

export const onlineUsers = new Map<string, OnlineUser>();
export const kickedUsers = new Set<string>();

export const onlineTrackerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.id) {
    const userId = String(user.id);

    // 如果用户已经被强退，返回 401 拦截
    if (kickedUsers.has(userId)) {
      return res.status(401).json({ code: 401, msg: '您的会话已被管理员强制踢出，请重新登录！' });
    }

    onlineUsers.set(userId, {
      id: userId,
      username: user.username || 'unknown',
      realName: user.real_name || user.username || '未知用户',
      lastActiveTime: new Date(),
      ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  }

  next();
};
