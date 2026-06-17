import { Request, Response, NextFunction } from 'express';

// XSS防护中间件 - 移除危险的HTML标签和属性
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: any) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<\/?iframe[^>]*>/gi, '')
        .replace(/<\/?object[^>]*>/gi, '')
        .replace(/<\/?embed[^>]*>/gi, '')
        .replace(/\bon\w+\s*=/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/vbscript\s*:/gi, '')
        .replace(/data\s*:[^,]*base64/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// 输入验证辅助函数
export const validateRequired = (fields: string[], body: any): string | null => {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `${field}不能为空`;
    }
  }
  return null;
};

export const validateLength = (value: string, name: string, max: number = 200): string | null => {
  if (typeof value === 'string' && value.length > max) {
    return `${name}长度不能超过${max}个字符`;
  }
  return null;
};

export const validateNumber = (value: any, name: string, min: number = 0): string | null => {
  const num = Number(value);
  if (isNaN(num) || num < min) {
    return `${name}必须是${min}以上的数字`;
  }
  return null;
};

// 请求体大小限制
export const requestSizeLimit = (maxSize: string = '10kb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      return res.status(413).json({ code: 413, msg: '请求体过大' });
    }
    next();
  };
};

function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.match(/^(\d+)(b|kb|mb|gb)$/i);
  if (match && match[1] && match[2]) {
    return parseInt(match[1]) * (units[match[2].toLowerCase()] || 1);
  }
  return 10240; // 默认10kb
}

// 错误处理中间件
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]', err.message);

  // 不泄露内部错误信息
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message || '服务器内部错误';

  res.status(err.status || 500).json({
    code: err.status || 500,
    msg: message
  });
};

// 请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    // 只记录非健康检查请求
    if (!req.url.includes('/health')) {
      console.log('[Request]', JSON.stringify(log));
    }
  });

  next();
};
