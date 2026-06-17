import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { swaggerSpec } from './utils/swagger';
import { Knife4jDoc } from 'node-knife4j-ui';
import rateLimit from 'express-rate-limit';

import logMiddleware from './utils/logMiddleware';
import { authMiddleware } from './utils/authMiddleware';
import { sanitizeInput, errorHandler } from './utils/securityMiddleware';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import departmentRoutes from './routes/departments';
import roleRoutes from './routes/roles';
import permissionRoutes from './routes/permissions';
import taskRoutes from './routes/tasks';
import approvalRoutes from './routes/approvals';
import meetingRoutes from './routes/meetings';
import documentRoutes from './routes/documents';
import assetRoutes from './routes/assets';
import attendanceRoutes from './routes/attendance';
import attendanceDetailRoutes from './routes/attendanceDetail';
import salaryRoutes from './routes/salary';
import projectRoutes from './routes/projects';
import handoverRoutes from './routes/handovers';
import noticeRoutes from './routes/notices';
import scheduleRoutes from './routes/schedules';
import processTemplateRoutes from './routes/processTemplates';
import contractRoutes from './routes/contracts';
import contactRoutes from './routes/contacts';
import messageRoutes from './routes/messages';
import positionRoutes from './routes/positions';
import hrRoutes from './routes/hr';
import systemRoutes from './routes/system';
import monitorRoutes from './routes/monitor';
import recycleRoutes from './routes/recycle';
import expenseRoutes from './routes/expenses';
import approvalFlowRoutes from './routes/approvalFlow';
import attendanceEnhancedRoutes from './routes/attendanceEnhanced';
import taskEnhancedRoutes from './routes/taskEnhanced';
import noticeEnhancedRoutes from './routes/noticeEnhanced';
import meetingBookingRoutes from './routes/meetingBooking';
import scheduleEnhancedRoutes from './routes/scheduleEnhanced';
import reportRoutes from './routes/reports';
import attendanceCompleteRoutes from './routes/attendanceComplete';
import assetEnhancedRoutes from './routes/assetEnhanced';
import salaryEnhancedRoutes from './routes/salaryEnhanced';
import noticeCompleteRoutes from './routes/noticeComplete';
import transferRoutes from './routes/transfers';
import trainingRoutes from './routes/trainings';
import offboardingRoutes from './routes/offboardings';
import performanceRoutes from './routes/performance';
import { onlineTrackerMiddleware } from './utils/onlineTracker';

dotenv.config();

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// ========== 安全中间件 ==========

// CORS配置
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000'
    ];
    // 允许无 origin 的请求（如移动端、Postman）和白名单内的来源
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true
}));

// 请求频率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 每个IP最多200个请求
  message: { code: 429, msg: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { code: 429, msg: '登录请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 应用限流
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// 请求体解析（限制大小）
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 确保所有JSON响应使用UTF-8编码
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

// XSS防护
app.use(sanitizeInput);

// 日志中间件
app.use(logMiddleware);

// ========== Knife4j 接口文档 ==========
const knife4jDoc = new Knife4jDoc(swaggerSpec, '智能OA系统 API接口文档');
const knife4jUiPath = knife4jDoc.getKnife4jUiPath();

app.get('/doc.html', (req, res) => {
  res.sendFile(path.join(knife4jUiPath, 'index.html'));
});

app.use(knife4jDoc.serveExpress(''));
app.use(express.static(knife4jUiPath));

// ========== 健康检查（不需要认证） ==========
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: String(error) });
  }
});

// ========== 路由挂载 ==========

// 登录接口（不需要认证）
app.use('/api/auth', authRoutes);

// 以下接口需要认证 + 在线用户追踪
app.use('/api', authMiddleware, onlineTrackerMiddleware);

app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendance-detail', attendanceDetailRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/process-templates', processTemplateRoutes);
app.use('/api/hr/contracts', contractRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/recycle', recycleRoutes);
app.use('/api/expenses', expenseRoutes);

// HR业务路由
app.use('/api/transfers', transferRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/offboardings', offboardingRoutes);

// 增强业务流程路由
app.use('/api/approval-flow', approvalFlowRoutes);
app.use('/api/attendance-enhanced', attendanceEnhancedRoutes);
app.use('/api/task-enhanced', taskEnhancedRoutes);
app.use('/api/notice-enhanced', noticeEnhancedRoutes);

// 新增功能路由
app.use('/api/meeting-booking', meetingBookingRoutes);
app.use('/api/schedule-enhanced', scheduleEnhancedRoutes);
app.use('/api/reports', reportRoutes);

// 完善功能路由
app.use('/api/attendance-complete', attendanceCompleteRoutes);
app.use('/api/asset-enhanced', assetEnhancedRoutes);
app.use('/api/salary-enhanced', salaryEnhancedRoutes);
app.use('/api/notice-complete', noticeCompleteRoutes);
app.use('/api/performance', performanceRoutes);

// ========== 错误处理 ==========
app.use(errorHandler);

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 404, msg: '接口不存在' });
});

app.listen(port, () => {
  console.log(`OA Server API 启动成功，监听端口: http://localhost:${port}`);
  console.log(`测试健康检查: http://localhost:${port}/api/health`);
  console.log(`测试获取用户: http://localhost:${port}/api/users`);
  console.log(`测试获取通讯录: http://localhost:${port}/api/contacts`);
  console.log(`接口文档: http://localhost:${port}/doc.html`);
});
