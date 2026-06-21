/**
 * 测试环境全局设置
 * 在所有测试运行前执行
 */
import { beforeAll } from 'vitest';

// 设置必要的环境变量（不依赖 .env 文件）
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
});
