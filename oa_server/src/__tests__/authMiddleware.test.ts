/**
 * authMiddleware 单元测试
 * 测试 JWT Token 生成/验证、角色权限中间件、资源所有权验证
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authMiddleware,
  requireRole,
  requireOwnership,
} from '../utils/authMiddleware';
import { mockPrismaModule } from './prismaMock';

const mockPrisma = mockPrismaModule();

// 模拟 Express 对象
function mockReqRes(overrides: {
  headers?: Record<string, string>;
  user?: any;
  params?: Record<string, string>;
}) {
  const req: any = {
    headers: overrides.headers || {},
    user: overrides.user || null,
    params: overrides.params || {},
  };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // authMiddleware - Token 验证
  // ============================================
  describe('authMiddleware', () => {
    it('无 Authorization 头应返回 401', () => {
      const { req, res, next } = mockReqRes({});
      authMiddleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 401 })
      );
    });

    it('Token 格式不正确应返回 401', () => {
      const { req, res, next } = mockReqRes({
        headers: { authorization: 'InvalidTokenFormat' },
      });
      authMiddleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('Token 无效或过期应返回 401', () => {
      const { req, res, next } = mockReqRes({
        headers: { authorization: 'Bearer invalid.token.here' },
      });
      authMiddleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('Token无效') })
      );
    });

    it('有效 Token 应调用 next 并设置 req.user', () => {
      // 先生成真实 token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: 1, username: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { req, res, next } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });
      authMiddleware(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.username).toBe('admin');
    });
  });

  // ============================================
  // requireRole - 角色权限验证
  // ============================================
  describe('requireRole', () => {
    it('无 req.user 应返回 401', async () => {
      const { req, res, next } = mockReqRes({});
      const middleware = requireRole('ROLE_ADMIN');
      await middleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('管理员角色应直接放行', async () => {
      const { req, res, next } = mockReqRes({ user: { id: 1 } });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_ADMIN', role_name: '管理员' },
      });

      const middleware = requireRole('ROLE_HR');
      await middleware(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('无角色用户应返回 403', async () => {
      const { req, res, next } = mockReqRes({ user: { id: 1 } });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue(null);

      const middleware = requireRole('ROLE_USER');
      await middleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('未分配角色') })
      );
    });

    it('角色不匹配应返回 403', async () => {
      const { req, res, next } = mockReqRes({ user: { id: 1 } });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_USER', role_name: '普通员工' },
      });

      const middleware = requireRole('ROLE_HR', 'ROLE_ADMIN');
      await middleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('角色匹配应放行', async () => {
      const { req, res, next } = mockReqRes({ user: { id: 1 } });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_HR', role_name: 'HR' },
      });

      const middleware = requireRole('ROLE_HR', 'ROLE_ADMIN');
      await middleware(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ============================================
  // requireOwnership - 资源所有权验证
  // ============================================
  describe('requireOwnership', () => {
    it('无 req.user 应返回 401', async () => {
      const { req, res, next } = mockReqRes({});
      const middleware = requireOwnership('task');
      await middleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('管理员应跳过所有权检查', async () => {
      const { req, res, next } = mockReqRes({
        user: { id: 1 },
        params: { id: '100' },
      });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_ADMIN' },
      });

      const middleware = requireOwnership('task');
      await middleware(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('非任务资源应直接放行', async () => {
      const { req, res, next } = mockReqRes({ user: { id: 1 } });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_USER' },
      });

      const middleware = requireOwnership('document');
      await middleware(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('任务负责人应放行', async () => {
      const { req, res, next } = mockReqRes({
        user: { id: 1 },
        params: { id: '100' },
      });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_USER' },
      });
      mockPrisma.oa_task.findFirst.mockResolvedValue({
        id: BigInt(100),
        assignee_id: BigInt(1),
        creator_id: BigInt(2),
        is_deleted: 0,
      });

      const middleware = requireOwnership('task');
      await middleware(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('任务创建人应放行', async () => {
      const { req, res, next } = mockReqRes({
        user: { id: 1 },
        params: { id: '100' },
      });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_USER' },
      });
      mockPrisma.oa_task.findFirst.mockResolvedValue({
        id: BigInt(100),
        assignee_id: BigInt(2),
        creator_id: BigInt(1),
        is_deleted: 0,
      });

      const middleware = requireOwnership('task');
      await middleware(req as any, res as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('既不是负责人也不是创建人应返回 403', async () => {
      const { req, res, next } = mockReqRes({
        user: { id: 1 },
        params: { id: '100' },
      });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_USER' },
      });
      mockPrisma.oa_task.findFirst.mockResolvedValue({
        id: BigInt(100),
        assignee_id: BigInt(3),
        creator_id: BigInt(4),
        is_deleted: 0,
      });

      const middleware = requireOwnership('task');
      await middleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('权限不足') })
      );
    });

    it('任务不存在应返回 404', async () => {
      const { req, res, next } = mockReqRes({
        user: { id: 1 },
        params: { id: '999' },
      });
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: { role_code: 'ROLE_USER' },
      });
      mockPrisma.oa_task.findFirst.mockResolvedValue(null);

      const middleware = requireOwnership('task');
      await middleware(req as any, res as any, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
