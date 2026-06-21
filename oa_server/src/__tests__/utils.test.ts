/**
 * 纯函数单元测试 - utils.ts + securityMiddleware.ts
 * 这些测试不依赖 Prisma/Express，可以快速验证
 */
import { describe, it, expect } from 'vitest';
import { orByIdNo, whereByIdNo } from '../routes/utils';
import {
  sanitizeInput,
  validateRequired,
  validateLength,
  validateNumber,
  parseSize,
} from '../utils/securityMiddleware';

// ============================================
// utils.ts - orByIdNo
// ============================================
describe('orByIdNo', () => {
  it('应该用 emp_no 和 id 构建 OR 查询', () => {
    const result = orByIdNo(12345);
    expect(result).toEqual([
      { emp_no: '12345' },
      { id: BigInt('12345') },
    ]);
  });

  it('应该用自定义字段名构建 OR 查询', () => {
    const result = orByIdNo(100, 'user_id');
    expect(result).toEqual([
      { user_id: '100' },
      { id: BigInt('100') },
    ]);
  });

  it('非数字字符串只返回字段名匹配', () => {
    const result = orByIdNo('ABC001');
    expect(result).toEqual([
      { emp_no: 'ABC001' },
    ]);
  });

  it('空字符串只返回字段名匹配', () => {
    const result = orByIdNo('');
    expect(result).toEqual([
      { emp_no: '' },
    ]);
  });
});

// ============================================
// utils.ts - whereByIdNo
// ============================================
describe('whereByIdNo', () => {
  it('纯数字字符串应返回 id BigInt 查询', () => {
    const result = whereByIdNo('42', 'emp_no');
    expect(result).toEqual({ id: BigInt('42') });
  });

  it('非数字字符串应返回字段名查询', () => {
    const result = whereByIdNo('EMP001', 'emp_no');
    expect(result).toEqual({ emp_no: 'EMP001' });
  });

  it('空字符串应返回字段名查询', () => {
    const result = whereByIdNo('', 'code');
    expect(result).toEqual({ code: '' });
  });
});

// ============================================
// securityMiddleware.ts - validateRequired
// ============================================
describe('validateRequired', () => {
  it('所有字段都存在时返回 null', () => {
    const result = validateRequired(['name', 'email'], { name: 'Tom', email: 't@t.com' });
    expect(result).toBeNull();
  });

  it('缺少字段时返回错误信息', () => {
    const result = validateRequired(['name', 'email'], { name: 'Tom' });
    expect(result).toBe('email不能为空');
  });

  it('字段为空字符串时返回错误', () => {
    const result = validateRequired(['name'], { name: '' });
    expect(result).toBe('name不能为空');
  });

  it('字段为 null 时返回错误', () => {
    const result = validateRequired(['name'], { name: null });
    expect(result).toBe('name不能为空');
  });

  it('字段为 undefined 时返回错误', () => {
    const result = validateRequired(['name'], {});
    expect(result).toBe('name不能为空');
  });
});

// ============================================
// securityMiddleware.ts - validateLength
// ============================================
describe('validateLength', () => {
  it('长度在限制内返回 null', () => {
    expect(validateLength('hello', '名称', 10)).toBeNull();
  });

  it('长度超过限制返回错误', () => {
    const result = validateLength('a'.repeat(201), '名称', 200);
    expect(result).toBe('名称长度不能超过200个字符');
  });

  it('默认最大长度 200', () => {
    expect(validateLength('short', 'name')).toBeNull();
    expect(validateLength('a'.repeat(201), 'name')).toContain('200');
  });

  it('非字符串值返回 null', () => {
    expect(validateLength(123 as any, 'num')).toBeNull();
  });
});

// ============================================
// securityMiddleware.ts - validateNumber
// ============================================
describe('validateNumber', () => {
  it('有效数字返回 null', () => {
    expect(validateNumber(5, '数量', 0)).toBeNull();
  });

  it('小于最小值返回错误', () => {
    const result = validateNumber(-1, '数量', 0);
    expect(result).toBe('数量必须是0以上的数字');
  });

  it('非数字返回错误', () => {
    const result = validateNumber('abc', '数量');
    expect(result).toBe('数量必须是0以上的数字');
  });
});

// ============================================
// securityMiddleware.ts - parseSize
// ============================================
describe('parseSize', () => {
  it('解析 kb 单位', () => {
    expect(parseSize('10kb')).toBe(10240);
  });

  it('解析 mb 单位', () => {
    expect(parseSize('1mb')).toBe(1048576);
  });

  it('解析 b 单位', () => {
    expect(parseSize('100b')).toBe(100);
  });

  it('无效格式返回默认 10kb', () => {
    expect(parseSize('invalid')).toBe(10240);
  });

  it('空字符串返回默认值', () => {
    expect(parseSize('')).toBe(10240);
  });
});

// ============================================
// securityMiddleware.ts - sanitizeInput XSS
// ============================================
describe('sanitizeInput (XSS防护)', () => {
  it('应移除 script 标签', () => {
    const req: any = {
      body: { name: '<script>alert("xss")</script>Tom' },
    };
    const res: any = {};
    const next = () => {};

    sanitizeInput(req, res, next);
    // script 标签内容被移除
    expect(req.body.name).not.toContain('script');
    expect(req.body.name).not.toContain('alert');
  });

  it('应移除 on* 事件属性', () => {
    const req: any = {
      body: { desc: '<div onclick="evil()">hello</div>' },
    };
    const res: any = {};
    const next = () => {};

    sanitizeInput(req, res, next);
    expect(req.body.desc).not.toContain('onclick');
  });

  it('应移除 javascript: 伪协议', () => {
    const req: any = {
      body: { link: 'javascript:alert(1)' },
    };
    const res: any = {};
    const next = () => {};

    sanitizeInput(req, res, next);
    expect(req.body.link).not.toContain('javascript');
  });

  it('应递归处理嵌套对象', () => {
    const req: any = {
      body: {
        user: {
          bio: '<script>bad</script>Normal text',
        },
      },
    };
    const res: any = {};
    const next = () => {};

    sanitizeInput(req, res, next);
    expect(req.body.user.bio).not.toContain('script');
    expect(req.body.user.bio).toContain('Normal text');
  });

  it('空 body 不报错', () => {
    const req: any = { body: null };
    const res: any = {};
    const next = () => {};

    expect(() => sanitizeInput(req, res, next)).not.toThrow();
  });
});
