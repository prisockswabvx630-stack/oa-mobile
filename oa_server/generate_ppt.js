const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

// 初始化 PPTX
const pptx = new pptxgen();

// 设置为 16:9 宽屏
pptx.layout = 'LAYOUT_WIDE';

// 调色板定义
const COLORS = {
  bgLight: 'F8FAFC',     // 温暖浅灰底色
  bgDark: '0F172A',      // 深蓝黑底色
  primary: '6358EE',     // 极客紫 (主色)
  titleDark: '1E293B',   // 标题深灰
  textDark: '334155',    // 正文暗灰
  textMuted: '64748B',   // 辅助灰色
  white: 'FFFFFF',       // 纯白
  accentPurple: '8B5CF6',// 辅助紫
  accentGreen: '10B981', // 辅助绿
  border: 'E2E8F0'       // 边框灰
};

// 字体定义
const FONTS = {
  title: 'Microsoft YaHei',
  body: 'Microsoft YaHei'
};

// 辅助函数：为普通页面设置统一的背景、页眉和页脚
function applyPageTemplate(slide, titleText) {
  // 设置背景色
  slide.background = { fill: COLORS.bgLight };

  // 左侧主色点缀小方块
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 0.45,
    w: 0.15,
    h: 0.4,
    fill: { color: COLORS.primary }
  });

  // 页眉标题
  slide.addText(titleText, {
    x: 0.8,
    y: 0.4,
    w: 12.0,
    h: 0.5,
    fontName: FONTS.title,
    fontSize: 22,
    color: COLORS.titleDark,
    bold: true,
    valign: 'middle'
  });

  // 顶部分割线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.05,
    w: 12.33,
    h: 0.02,
    fill: { color: COLORS.border }
  });

  // 页脚
  slide.addText('智能OA办公系统解决方案 | 项目汇报', {
    x: 0.5,
    y: 7.0,
    w: 6.0,
    h: 0.3,
    fontName: FONTS.body,
    fontSize: 10,
    color: COLORS.textMuted,
    valign: 'middle'
  });
}

// -------------------------------------------------------------
// Slide 1: 封面 (深色主题)
// -------------------------------------------------------------
const slide1 = pptx.addSlide();
slide1.background = { fill: COLORS.bgDark };

// 左侧渐变点缀色条
slide1.addShape(pptx.ShapeType.rect, {
  x: 0,
  y: 0,
  w: 0.3,
  h: 7.5,
  fill: { color: COLORS.primary }
});

// 主标题
slide1.addText('智能OA办公系统解决方案', {
  x: 1.0,
  y: 2.2,
  w: 11.0,
  h: 1.0,
  fontName: FONTS.title,
  fontSize: 44,
  color: COLORS.white,
  bold: true,
  align: 'left'
});

// 分割线
slide1.addShape(pptx.ShapeType.rect, {
  x: 1.0,
  y: 3.4,
  w: 3.5,
  h: 0.05,
  fill: { color: COLORS.accentPurple }
});

// 副标题
slide1.addText('基于 Vue 3 + Node.js + MySQL 的高可用协同办公管理平台', {
  x: 1.0,
  y: 3.7,
  w: 11.0,
  h: 0.5,
  fontName: FONTS.body,
  fontSize: 18,
  color: '94A3B8', // 浅蓝灰
  align: 'left'
});

// 作者与时间
slide1.addText(
  [
    { text: '汇报人：项目开发团队\n', options: { fontSize: 13, color: '64748B' } },
    { text: '时   间：2026年5月', options: { fontSize: 13, color: '64748B' } }
  ],
  {
    x: 1.0,
    y: 5.2,
    w: 5.0,
    h: 1.0,
    fontName: FONTS.body,
    lineSpacing: 24,
    align: 'left'
  }
);


// -------------------------------------------------------------
// Slide 2: 产品定位与痛点解决
// -------------------------------------------------------------
const slide2 = pptx.addSlide();
applyPageTemplate(slide2, '01. 产品定位与痛点解决');

// 左侧卡片 - 产品愿景
slide2.addText(
  [
    { text: '🎯 产品核心愿景\n\n', options: { fontSize: 18, bold: true, color: COLORS.primary } },
    { text: '面向中小企业的数字化转型枢纽，提供极简、高效、安全的日常协同办公平台。打破部门壁垒，降低企业内部流转阻力。\n\n', options: { fontSize: 14, color: COLORS.textDark, lineSpacing: 22 } },
    { text: '• 扁平化架构设计：', options: { bold: true, color: COLORS.titleDark } },
    { text: '开箱即用，免去繁琐配置。\n', options: { color: COLORS.textMuted } },
    { text: '• 核心业务全链路：', options: { bold: true, color: COLORS.titleDark } },
    { text: '覆盖考勤、审批、项目及资产核算。\n', options: { color: COLORS.textMuted } },
    { text: '• 开放性接口生态：', options: { bold: true, color: COLORS.titleDark } },
    { text: '天然契合企业内部系统整合对接。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);

// 右侧卡片 - 传统痛点与本案解决
slide2.addText(
  [
    { text: '⚡ 传统痛点与应对方案\n\n', options: { fontSize: 18, bold: true, color: COLORS.accentPurple } },
    { text: '❌ 传统部署臃肿，维护难\n', options: { bold: true, color: 'EF4444' } },
    { text: '👉 本系统采用轻量级前后端分离，配合 Docker 及 SQL 自动化脚本一秒拉起，极易维护。\n\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '❌ 考勤虚假打卡，难以防作弊\n', options: { bold: true, color: 'EF4444' } },
    { text: '👉 融合物理地理围栏限制与公司办公 Wi-Fi 双重校验，安全终端绑定，防作弊打卡。\n\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '❌ 审批流越权，组织结构混乱\n', options: { bold: true, color: 'EF4444' } },
    { text: '👉 建立部门级隔离校验。非系统管理员，仅可审批其所在部门的申请，权限安全可靠。', options: { fontSize: 13, color: COLORS.textMuted } }
  ],
  {
    x: 6.9,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// Slide 3: 系统架构与技术栈选择
// -------------------------------------------------------------
const slide3 = pptx.addSlide();
applyPageTemplate(slide3, '02. 系统架构与技术栈选择');

// 3-Column Layout
const colWidth = 3.8;
const gap = 0.46;

// 1. 前端
slide3.addText(
  [
    { text: '💻 前端展示层\n\n', options: { fontSize: 18, bold: true, color: COLORS.primary } },
    { text: '基于最新的渐进式框架 Vue 3，以高性能和组件化构建视图层。\n\n', options: { fontSize: 13, color: COLORS.textDark, lineSpacing: 20 } },
    { text: '• Vite 构建引擎：', options: { bold: true, fontSize: 13 } },
    { text: '提供极速的热重载与构建打包体验。\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• Vanilla CSS：', options: { bold: true, fontSize: 13 } },
    { text: '精细化的原生CSS样式设计，带来顺滑优雅的交互微动画与极致渲染速度。\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• 路由隔离机制：', options: { bold: true, fontSize: 13 } },
    { text: '前端自定义权限卫士拦截，无对应权限的用户在侧边栏直接置灰/锁定。', options: { fontSize: 13, color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: colWidth,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);

// 2. 后端
slide3.addText(
  [
    { text: '⚙️ 后端服务层\n\n', options: { fontSize: 18, bold: true, color: COLORS.accentPurple } },
    { text: '采用 Node.js 环境，依托 Express 框架，用 TypeScript 进行强类型开发。\n\n', options: { fontSize: 13, color: COLORS.textDark, lineSpacing: 20 } },
    { text: '• RESTful API 规范：', options: { bold: true, fontSize: 13 } },
    { text: '提供整洁、轻量、高响应的业务接口服务。\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• Prisma ORM：', options: { bold: true, fontSize: 13 } },
    { text: '利用现代对象关系映射框架，确保数据库字段级映射与类型推导安全。\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• 核心拦截层：', options: { bold: true, fontSize: 13 } },
    { text: '集成了操作审计拦截器和全局踢人检测，保障后端接口调用安全。', options: { fontSize: 13, color: COLORS.textMuted } }
  ],
  {
    x: 0.5 + colWidth + gap,
    y: 1.5,
    w: colWidth,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);

// 3. 数据层
slide3.addText(
  [
    { text: '🗄️ 稳固数据层\n\n', options: { fontSize: 18, bold: true, color: COLORS.accentGreen } },
    { text: '选用稳定可靠的 MySQL 数据库，保证高并发场景下的数据事务与完整性。\n\n', options: { fontSize: 13, color: COLORS.textDark, lineSpacing: 20 } },
    { text: '• 视图加速机制：', options: { bold: true, fontSize: 13 } },
    { text: '使用关系视图(v_user_detail)动态聚合部门、角色与岗位权限，提高查询性能。\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• 级联物理隔离：', options: { bold: true, fontSize: 13 } },
    { text: '外键关系明确配置 onDelete Cascade，当角色或用户删除时，关联依赖清理干净。\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• 事务数据隔离：', options: { bold: true, fontSize: 13 } },
    { text: '支持 ACID 特性，为考勤、财务报销、薪资核算提供底层保障。', options: { fontSize: 13, color: COLORS.textMuted } }
  ],
  {
    x: 0.5 + (colWidth + gap) * 2,
    y: 1.5,
    w: colWidth,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// Slide 4: 核心功能：安全认证与权限控制
// -------------------------------------------------------------
const slide4 = pptx.addSlide();
slide4.background = { fill: COLORS.bgLight };
applyPageTemplate(slide4, '03. 核心功能：安全认证与权限控制');

// 顶部两张并排大卡片
slide4.addText(
  [
    { text: '🔑 穿透式统一身份认证\n\n', options: { fontSize: 18, bold: true, color: COLORS.primary } },
    { text: '系统摒弃了传统的 Session 校验，采用更加轻量的身份头传递机制，实现多端一致性体验：\n\n', options: { fontSize: 14, color: COLORS.textDark } },
    { text: '1. 前端登录拦截：', options: { bold: true } },
    { text: '用户登录成功后，前端在 localStorage 中缓存身份凭证，并在每次 API 请求的 Headers 中自动植入 X-User-Id 与 X-User-Name。\n', options: { color: COLORS.textMuted } },
    { text: '2. 请求过滤器拦截：', options: { bold: true } },
    { text: '后端中间件自动解析请求头中的用户 ID，若未获取到则直接判定为未登录（401），保障 API 接口不暴露风险。\n', options: { color: COLORS.textMuted } },
    { text: '3. 异常解约强制下线：', options: { bold: true } },
    { text: '后台通过在线监听器动态跟踪会话状态，支持管理员一键踢出违规在线用户，被踢出的账号在 1 秒内失去访问权限。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);

slide4.addText(
  [
    { text: '🛡️ 基于角色的控制 (RBAC) 与权限树\n\n', options: { fontSize: 18, bold: true, color: COLORS.accentPurple } },
    { text: '建立完善的角权关系（sys_role_permission），在系统内构建了三维立体控制网：\n\n', options: { fontSize: 14, color: COLORS.textDark } },
    { text: '• 角色划分明晰：', options: { bold: true } },
    { text: '分为系统管理员(ROLE_ADMIN)、人事主管(ROLE_HR)、部门主管(ROLE_MANAGER)、普通员工(ROLE_USER)四大角色。\n', options: { color: COLORS.textMuted } },
    { text: '• 动态路由拦截：', options: { bold: true } },
    { text: '前端加载时动态拉取该账号所分配的权限标识数组（如 office:attendance, office:approval），对不具备对应访问特性的模块菜单，侧边栏直接上锁置灰。\n', options: { color: COLORS.textMuted } },
    { text: '• 后端多重保障：', options: { bold: true } },
    { text: 'API 接口除了前端交互拦截外，在控制层会对操作者所属角色和部门再次进行拦截鉴权，实现前后台双重保险。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 6.9,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// Slide 5: 核心功能：精准围栏考勤与工时结算
// -------------------------------------------------------------
const slide5 = pptx.addSlide();
applyPageTemplate(slide5, '04. 核心功能：精准围栏考勤与工时结算');

// 3个横向小方块卡片
const cardW = 3.8;
const cardGap = 0.46;

// 1. 地理围栏机制
slide5.addText(
  [
    { text: '📍 地理围栏防作弊\n\n', options: { fontSize: 16, bold: true, color: COLORS.primary } },
    { text: '• 精准距离计算：', options: { bold: true } },
    { text: '基于半正矢公式（Haversine）计算打卡位置与公司中心点距离，若超出半径限制（例如300米）则拒绝打卡并转为外勤告警。\n\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• Wi-Fi及终端绑定：', options: { bold: true } },
    { text: '可配置公司Wi-Fi白名单，支持WiFi MAC地址硬匹配；打卡时绑定打卡终端的标识符，防止跨设备替打卡代签。', options: { fontSize: 13, color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: cardW,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);

// 2. 模拟打卡与开发者覆盖
slide5.addText(
  [
    { text: '🧪 极佳的开发者调试体验\n\n', options: { fontSize: 16, bold: true, color: COLORS.accentPurple } },
    { text: '• 演示一键调试：', options: { bold: true } },
    { text: '考虑到在演示或录屏环境里无法获取真实地理坐标，系统贴心地在前台设计了调试覆盖按钮（“设为范围内”与“设为范围外”）。\n\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• 快速状态流转：', options: { bold: true } },
    { text: '点击“设为范围内”即可立即向后台传递合规的公司内坐标，完美绕过 GPS 物理限制，使演示极其顺畅。', options: { fontSize: 13, color: COLORS.textMuted } }
  ],
  {
    x: 0.5 + cardW + cardGap,
    y: 1.5,
    w: cardW,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);

// 3. 工时自动结算系统
slide5.addText(
  [
    { text: '🪙 高精度数据自动核算\n\n', options: { fontSize: 16, bold: true, color: COLORS.accentGreen } },
    { text: '• 工时自动折算：', options: { bold: true } },
    { text: '打卡下班时，系统自动算得 clock_in_time 与 clock_out_time 的差值，精准折算出今日的有效工作时长（工作几小时）。\n\n', options: { fontSize: 13, color: COLORS.textMuted } },
    { text: '• 月度一键核算：', options: { bold: true } },
    { text: '核算控制台一键执行核算引擎，将用户的常规考勤、迟到、早退、请假、缺勤等数据按月深度汇总并支持导出账单报备单。', options: { fontSize: 13, color: COLORS.textMuted } }
  ],
  {
    x: 0.5 + (cardW + cardGap) * 2,
    y: 1.5,
    w: cardW,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// Slide 6: 核心功能：多维协同审批流程
// -------------------------------------------------------------
const slide6 = pptx.addSlide();
applyPageTemplate(slide6, '05. 核心功能：多维协同审批流程');

// 2-Column Card Layout
slide6.addText(
  [
    { text: '📝 请假与多场景审批发起\n\n', options: { fontSize: 18, bold: true, color: COLORS.primary } },
    { text: '系统审批流（oa_approval）覆盖了企业常见的办公事务流程，提供了全生命周期状态监控：\n\n', options: { fontSize: 14, color: COLORS.textDark } },
    { text: '• 丰富的审批类型：', options: { bold: true } },
    { text: '支持请假、加班、出差、报销、采购、用章等多重类别，统一编号为 AP + 六位自增码。\n', options: { color: COLORS.textMuted } },
    { text: '• 闭环状态转移：', options: { bold: true } },
    { text: '状态在 “待审批”、“已通过”、“已拒绝”、“已撤回” 四者之间严格扭转。申请发起人可在单据“待审批”阶段执行撤回，撤回需说明缘由。\n', options: { color: COLORS.textMuted } },
    { text: '• 详尽审计备查：', options: { bold: true } },
    { text: '所有的处理阶段都会在表记录上持久化保留处理时间（approved_time）、拒绝理由（reject_reason）等关键信息。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);

slide6.addText(
  [
    { text: '🏢 部门级别审批隔离与权限防线\n\n', options: { fontSize: 18, bold: true, color: COLORS.accentPurple } },
    { text: '为了规避跨部门越权审批带来的信息泄露，后台对审批处理 API 做了深度的“隔离防线”校验：\n\n', options: { fontSize: 14, color: COLORS.textDark } },
    { text: '1. 管理员绿道：', options: { bold: true } },
    { text: '超级管理员(ROLE_ADMIN)具备全局最高审批权，可以对全公司任何部门任何层级的单据进行处理。\n', options: { color: COLORS.textMuted } },
    { text: '2. 部门主管物理隔离：', options: { bold: true } },
    { text: '当技术经理张强审批时，后端会先比对张强的 dept_name 与该申请人的 dept_name，如果不匹配（例如去审批财务部的报销单）则直接抛出 403 Forbidden，禁止操作。\n', options: { color: COLORS.textMuted } },
    { text: '3. 前后端联动防御：', options: { bold: true } },
    { text: '不仅后端做接口安全校验，前端审批列表也会过滤非法操作，审批按钮仅对有权处理的用户点亮。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 6.9,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// Slide 7: 系统运维：Knife4j 接口文档与操作日志
// -------------------------------------------------------------
const slide7 = pptx.addSlide();
applyPageTemplate(slide7, '06. 系统运维：Knife4j 接口文档与操作日志');

// 左侧 - Knife4j
slide7.addText(
  [
    { text: '📖 Knife4j API在线文档 (`/doc.html`)\n\n', options: { fontSize: 18, bold: true, color: COLORS.primary } },
    { text: '项目成功为 Node 容器集成了主流的 Knife4j UI 文档生成器，实现前后端接口在线同步：\n\n', options: { fontSize: 14, color: COLORS.textDark, lineSpacing: 22 } },
    { text: '• 零 Java 依赖架构：', options: { bold: true } },
    { text: '通过 `node-knife4j-ui` 模块结合 OpenAPI 标准，在纯 JS/TS 环境下优雅复现 Java Knife4j UI 页面交互。\n', options: { color: COLORS.textMuted } },
    { text: '• 分组与标记：', options: { bold: true } },
    { text: '接口定义分为认证模块、考勤管理、审批管理和用户管理等板块，支持清晰的路由展开与参数定义。\n', options: { color: COLORS.textMuted } },
    { text: '• 实时在线调试：', options: { bold: true } },
    { text: '提供在线的“发送请求”功能，前端及第三方人员可输入数据随时调试接口。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);

// 右侧 - 审计日志
slide7.addText(
  [
    { text: '🛡️ 操作审计与系统监控\n\n', options: { fontSize: 18, bold: true, color: COLORS.accentPurple } },
    { text: '后台内置了高级运维审计工具，全天候保障数据安全：\n\n', options: { fontSize: 14, color: COLORS.textDark, lineSpacing: 22 } },
    { text: '• 操作日志切面：', options: { bold: true } },
    { text: '日志中间件对所有修改数据库的 API（POST/PUT/DELETE）进行全程审计，将 IP 地址、请求参数、耗时以及异常信息落库（sys_operation_log）。\n', options: { color: COLORS.textMuted } },
    { text: '• 物理与无线监控：', options: { bold: true } },
    { text: '系统配置（sys_config）支持动态调整个数，如上班时间、弹性工时、地理经纬度等，配置变动全局即时生效。\n', options: { color: COLORS.textMuted } },
    { text: '• 在线会话分析：', options: { bold: true } },
    { text: '实时统计并显示当前在线人员数量，支持运维管理员一键强制离线可疑用户。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 6.9,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// Slide 8: 数据存储：严谨的数据模型设计
// -------------------------------------------------------------
const slide8 = pptx.addSlide();
applyPageTemplate(slide8, '07. 数据存储：严谨的数据模型设计');

// 3个并排卡片
slide8.addText(
  [
    { text: '🧩 规范的表结构体系\n\n', options: { fontSize: 16, bold: true, color: COLORS.primary } },
    { text: '系统拥有20余张核心数据表，分为三大核心模块：\n\n', options: { fontSize: 13, color: COLORS.textDark } },
    { text: '• 系统底座：', options: { bold: true } },
    { text: '部门表、岗位表、用户表、角色表、权限关联表等，奠定系统权限防线。\n\n', options: { color: COLORS.textMuted } },
    { text: '• 协同办公：', options: { bold: true } },
    { text: '考勤打卡表、审批记录表、任务计划表、会议预定表、工作交接表。\n\n', options: { color: COLORS.textMuted } },
    { text: '• 人事管理：', options: { bold: true } },
    { text: '合同表、离职申请表、调岗申请表、薪资发放表。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: cardW,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);

slide8.addText(
  [
    { text: '🔗 Prisma 完整性约束\n\n', options: { fontSize: 16, bold: true, color: COLORS.accentPurple } },
    { text: '完全利用 Prisma ORM 的强类型外键管理，规避垃圾垃圾数据出现：\n\n', options: { fontSize: 13, color: COLORS.textDark } },
    { text: '• 强外键绑定：', options: { bold: true } },
    { text: '用户表与部门表、岗位表进行深度绑定关联，禁止外键孤岛现象。\n\n', options: { color: COLORS.textMuted } },
    { text: '• 物理级级联：', options: { bold: true } },
    { text: '关键表（如角色-权限表）的外键明确标志 `onDelete: Cascade`。当父级表记录（如角色）被删除时，子关联记录瞬间自动清扫干净。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5 + cardW + cardGap,
    y: 1.5,
    w: cardW,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);

slide8.addText(
  [
    { text: '💾 丰富的数据维护脚本\n\n', options: { fontSize: 16, bold: true, color: COLORS.accentGreen } },
    { text: '配备了开发与运维急需的数据处理脚本，免去手工操作风险：\n\n', options: { fontSize: 13, color: COLORS.textDark } },
    { text: '• check_db.js：', options: { bold: true } },
    { text: '一键检索库里所有物理表的总行数并打印头部样例数据，用于数据库健康体检。\n\n', options: { color: COLORS.textMuted } },
    { text: '• seed_db.js：', options: { bold: true } },
    { text: '清空测试数据，自动重置并注入预置员工、初始审批流和系统设置，一秒重置演示现场。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5 + (cardW + cardGap) * 2,
    y: 1.5,
    w: cardW,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 20,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// Slide 9: 项目总结与未来展望
// -------------------------------------------------------------
const slide9 = pptx.addSlide();
applyPageTemplate(slide9, '08. 项目总结与未来展望');

// 左右卡片布局
slide9.addText(
  [
    { text: '✅ 本阶段项目总结\n\n', options: { fontSize: 18, bold: true, color: COLORS.primary } },
    { text: '截至当前，智能OA办公系统各项预设成果已经高质量闭环：\n\n', options: { fontSize: 14, color: COLORS.textDark, lineSpacing: 22 } },
    { text: '• 闭环验证通过：', options: { bold: true } },
    { text: '使用 Playwright 进行多角色端到端自动化模拟，成功在本地 Chrome 录制了完整运行演示 WebM 视频。\n', options: { color: COLORS.textMuted } },
    { text: '• 系统性能良好：', options: { bold: true } },
    { text: '基于 Vite + Node 的极简架构，使页面加载与 API 接口响应时间缩减至毫秒级。\n', options: { color: COLORS.textMuted } },
    { text: '• 环境依赖就绪：', options: { bold: true } },
    { text: 'API文档、数据库脚本与前后台开发服务器已处于随时可演示/部署阶段。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 0.5,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);

slide9.addText(
  [
    { text: '🚀 下阶段迭代方向\n\n', options: { fontSize: 18, bold: true, color: COLORS.accentPurple } },
    { text: '未来系统将沿着更智能、更互联的方向持续演进：\n\n', options: { fontSize: 14, color: COLORS.textDark, lineSpacing: 22 } },
    { text: '1. 可视化工作流引擎：', options: { bold: true } },
    { text: '引入拖拽式审批画布，允许非技术人员通过 UI 自由定义多级、并签/或签审批节点。\n', options: { color: COLORS.textMuted } },
    { text: '2. 第三方生态无缝融合：', options: { bold: true } },
    { text: '集成企业微信、钉钉、飞书等考勤及消息推送接口，打通组织架构单点登录(SSO)。\n', options: { color: COLORS.textMuted } },
    { text: '3. 财务与报销模块深度发掘：', options: { bold: true } },
    { text: '引入 OCR 拍照识别发票，自动比对金额与防重复报销机制，联动财务核算。', options: { color: COLORS.textMuted } }
  ],
  {
    x: 6.9,
    y: 1.5,
    w: 5.9,
    h: 5.0,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 1 },
    margin: 25,
    fontName: FONTS.body
  }
);


// -------------------------------------------------------------
// 保存文件到工件目录中
// -------------------------------------------------------------
const outputFileName = 'smart_oa_solution.pptx';
const artifactDir = 'C:\\Users\\song\\.gemini\\antigravity\\brain\\af179729-29ba-4cc1-bb73-1e17de898345';
const finalPath = path.join(artifactDir, outputFileName);

pptx.writeFile({ fileName: finalPath })
  .then(name => {
    console.log(`PPTX 解决方案演示文档生成成功，保存在: ${finalPath}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('生成 PPTX 失败:', err);
    process.exit(1);
  });
