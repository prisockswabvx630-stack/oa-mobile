/**
 * Prisma Mock 辅助工具
 * 统一 mock prisma 的各个 model 方法，方便在所有路由测试中复用
 */
import { vi } from 'vitest';

export interface MockPrismaModel {
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
}

/**
 * 创建一个 mock Prisma model，所有方法默认返回 undefined
 */
export function createMockModel(): MockPrismaModel {
  return {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  };
}

/**
 * 创建完整的 mock PrismaClient
 */
export function createMockPrisma() {
  return {
    sys_user: createMockModel(),
    sys_user_role: createMockModel(),
    sys_role: createMockModel(),
    sys_role_permission: createMockModel(),
    sys_permission: createMockModel(),
    sys_department: createMockModel(),
    sys_position: createMockModel(),
    sys_config: createMockModel(),
    sys_operation_log: createMockModel(),
    oa_attendance: createMockModel(),
    oa_approval: createMockModel(),
    oa_task: createMockModel(),
    oa_document: createMockModel(),
    oa_notice: createMockModel(),
    oa_meeting: createMockModel(),
    oa_project: createMockModel(),
    oa_asset: createMockModel(),
    oa_schedule: createMockModel(),
    oa_expense: createMockModel(),
    oa_message: createMockModel(),
    oa_handover: createMockModel(),
    oa_recycle: createMockModel(),
    oa_contract: createMockModel(),
    oa_transfer: createMockModel(),
    oa_training: createMockModel(),
    oa_offboarding: createMockModel(),
    oa_salary: createMockModel(),
    oa_performance: createMockModel(),
    oa_attendance_detail: createMockModel(),
    $transaction: vi.fn((fn: any) => fn(createMockPrisma())),
    $disconnect: vi.fn(),
  };
}

export type MockPrismaClient = ReturnType<typeof createMockPrisma>;

/**
 * 为 prisma 模块设置 mock
 */
export function mockPrismaModule() {
  const mockClient = createMockPrisma();
  vi.mock('../utils/prisma', () => ({
    default: mockClient,
    prisma: mockClient,
  }));
  return mockClient;
}
