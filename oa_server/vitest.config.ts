import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 排除 dist 目录
    exclude: ['node_modules', 'dist'],
    // 测试超时 10s
    testTimeout: 10000,
  },
});
