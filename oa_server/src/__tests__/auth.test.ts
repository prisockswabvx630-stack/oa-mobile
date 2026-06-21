/**
 * auth 路由单元测试
 * 测试登录、登出、权限查询三个端点
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock 依赖
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('../utils/authMiddleware', () => ({
  generateToken: vi.fn(() => 'mock-jwt-token-xxxxx'),
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1, username: 'admin', emp_no: '001', real_name: '管理员' };
    next();
  },
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  requireOwnership: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../utils/onlineTracker', () => ({
  kickedUsers: new Set(),
}));

import bcrypt from 'bcryptjs';
import authRouter from '../routes/auth';
import { mockPrismaModule } from './prismaMock';

const mockPrisma = mockPrismaModule();

// 创建测试 Express app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('Auth Routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  // ============================================
  // POST /login
  // ============================================
  describe('POST /login', () => {
    it('用户名或密码为空时返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: '' });
      expect(res.body.code).toBe(400);
      expect(res.body.msg).toContain('不能为空');
    });

    it('用户不存在时返回 401', async () => {
      mockPrisma.sys_user.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: '123456' });
      expect(res.body.code).toBe(401);
      expect(res.body.msg).toContain('不正确');
    });

    it('密码错误时返回 401', async () => {
      mockPrisma.sys_user.findFirst.mockResolvedValue({
        id: BigInt(1),
        username: 'admin',
        password: 'hashed_pw',
        emp_no: '001',
        real_name: '管理员',
        status: 1,
        is_deleted: 0,
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      expect(res.body.code).toBe(401);
    });

    it('账号被禁用时返回 403', async () => {
      mockPrisma.sys_user.findFirst.mockResolvedValue({
        id: BigInt(1),
        username: 'admin',
        password: 'hashed_pw',
        emp_no: '001',
        real_name: '管理员',
        status: 0, // 禁用
        is_deleted: 0,
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: '123456' });
      expect(res.body.code).toBe(403);
      expect(res.body.msg).toContain('禁用');
    });

    it('登录成功返回 token 和用户信息', async () => {
      mockPrisma.sys_user.findFirst.mockResolvedValue({
        id: BigInt(1),
        username: 'admin',
        password: 'hashed_pw',
        emp_no: '001',
        real_name: '管理员',
        mobile: '13800138000',
        status: 1,
        is_deleted: 0,
        sys_department: { id: BigInt(1), dept_name: '技术部' },
        sys_position: { id: BigInt(1), pos_name: '工程师' },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: '123456' });

      expect(res.body.code).toBe(200);
      expect(res.body.msg).toBe('登录成功');
      expect(res.body.data.token).toBe('mock-jwt-token-xxxxx');
      expect(res.body.data.username).toBe('admin');
      expect(res.body.data.real_name).toBe('管理员');
      // 密码字段不应泄露
      expect(res.body.data.password).toBeUndefined();
    });

    it('连续失败 5 次后应锁定（15分钟内）', async () => {
      mockPrisma.sys_user.findFirst.mockResolvedValue(null);

      // 前 5 次失败
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ username: 'admin', password: 'wrong' });
        expect(res.body.code).toBe(401);
      }

      // 第 6 次应被锁定
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      expect(res.body.code).toBe(429);
      expect(res.body.msg).toContain('失败次数过多');
    });
  });

  // ============================================
  // POST /logout
  // ============================================
  describe('POST /logout', () => {
    it('应返回登出成功', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.body.code).toBe(200);
      expect(res.body.msg).toBe('登出成功');
    });
  });

  // ============================================
  // GET /permissions
  // ============================================
  describe('GET /permissions', () => {
    it('无角色用户应返回 ROLE_USER', async () => {
      mockPrisma.sys_user_role.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/api/auth/permissions');
      expect(res.body.code).toBe(200);
      expect(res.body.data.roleCode).toBe('ROLE_USER');
      expect(res.body.data.roleName).toBe('普通员工');
      expect(res.body.data.permissions).toEqual([]);
    });

    it('管理员角色应返回所有权限', async () => {
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: {
          id: BigInt(1),
          role_code: 'ROLE_ADMIN',
          role_name: '管理员',
        },
      });
      mockPrisma.sys_permission.findMany.mockResolvedValue([
        { permission_code: 'USER_MGMT' },
        { permission_code: 'ROLE_MGMT' },
        { permission_code: 'DEPT_MGMT' },
      ]);

      const res = await request(app).get('/api/auth/permissions');
      expect(res.body.code).toBe(200);
      expect(res.body.data.roleCode).toBe('ROLE_ADMIN');
      expect(res.body.data.permissions).toHaveLength(3);
    });

    it('普通角色应返回对应权限', async () => {
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: {
          id: BigInt(2),
          role_code: 'ROLE_USER',
          role_name: '普通员工',
        },
      });
      mockPrisma.sys_role_permission.findMany.mockResolvedValue([
        {
          sys_permission: {
            permission_code: 'ATTENDANCE',
            is_deleted: 0,
            status: 1,
          },
        },
        {
          sys_permission: {
            permission_code: 'APPROVAL',
            is_deleted: 0,
            status: 1,
          },
        },
      ]);

      const res = await request(app).get('/api/auth/permissions');
      expect(res.body.code).toBe(200);
      expect(res.body.data.permissions).toContain('ATTENDANCE');
      expect(res.body.data.permissions).toContain('APPROVAL');
    });

    it('应过滤已删除或禁用的权限', async () => {
      mockPrisma.sys_user_role.findFirst.mockResolvedValue({
        sys_role: {
          id: BigInt(2),
          role_code: 'ROLE_USER',
          role_name: '普通员工',
        },
      });
      mockPrisma.sys_role_permission.findMany.mockResolvedValue([
        {
          sys_permission: {
            permission_code: 'VALID',
            is_deleted: 0,
            status: 1,
          },
        },
        {
          sys_permission: {
            permission_code: 'DELETED',
            is_deleted: 1, // 已删除
            status: 1,
          },
        },
        {
          sys_permission: {
            permission_code: 'DISABLED',
            is_deleted: 0,
            status: 0, // 已禁用
          },
        },
      ]);

      const res = await request(app).get('/api/auth/permissions');
      expect(res.body.data.permissions).toEqual(['VALID']);
    });
  });
});
