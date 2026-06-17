-- ============================================
-- OA系统业务流程增强 - 数据库表结构
-- ============================================

-- 审批流程模板表
CREATE TABLE IF NOT EXISTS oa_process_template (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  type VARCHAR(50) NOT NULL COMMENT '模板类型',
  description TEXT COMMENT '模板描述',
  steps JSON COMMENT '审批步骤',
  creator_id BIGINT COMMENT '创建人ID',
  status TINYINT DEFAULT 1 COMMENT '状态 0禁用 1启用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批流程模板表';

-- 审批流程记录表
CREATE TABLE IF NOT EXISTS oa_approval_flow (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  approval_id BIGINT NOT NULL COMMENT '审批ID',
  step INT NOT NULL COMMENT '步骤序号',
  action VARCHAR(20) NOT NULL COMMENT '操作动作',
  operator_id BIGINT NOT NULL COMMENT '操作人ID',
  remark TEXT COMMENT '备注说明',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_approval_id (approval_id),
  INDEX idx_operator_id (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批流程记录表';

-- 任务评论表
CREATE TABLE IF NOT EXISTS oa_task_comment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL COMMENT '任务ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  content TEXT NOT NULL COMMENT '评论内容',
  attachments JSON COMMENT '附件列表',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务评论表';

-- 项目成员表
CREATE TABLE IF NOT EXISTS oa_project_member (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL COMMENT '项目ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  role VARCHAR(50) DEFAULT 'member' COMMENT '角色',
  join_date DATETIME COMMENT '加入日期',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_project_user (project_id, user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目成员表';

-- 考勤规则配置表
CREATE TABLE IF NOT EXISTS oa_attendance_rule (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '规则名称',
  work_start TIME NOT NULL DEFAULT '09:00:00' COMMENT '上班时间',
  work_end TIME NOT NULL DEFAULT '18:00:00' COMMENT '下班时间',
  flexible_minutes INT DEFAULT 30 COMMENT '弹性时间(分钟)',
  late_threshold INT DEFAULT 30 COMMENT '迟到阈值(分钟)',
  early_leave_threshold INT DEFAULT 30 COMMENT '早退阈值(分钟)',
  status TINYINT DEFAULT 1 COMMENT '状态 0禁用 1启用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考勤规则配置表';

-- 会议室表
CREATE TABLE IF NOT EXISTS oa_meeting_room (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '会议室名称',
  location VARCHAR(200) COMMENT '位置',
  capacity INT DEFAULT 10 COMMENT '容纳人数',
  equipment JSON COMMENT '设备列表',
  status TINYINT DEFAULT 1 COMMENT '状态 0禁用 1启用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会议室表';

-- 会议室预订表
CREATE TABLE IF NOT EXISTS oa_meeting_booking (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id BIGINT NOT NULL COMMENT '会议室ID',
  meeting_id BIGINT COMMENT '会议ID',
  booker_id BIGINT NOT NULL COMMENT '预订人ID',
  start_time DATETIME NOT NULL COMMENT '开始时间',
  end_time DATETIME NOT NULL COMMENT '结束时间',
  status VARCHAR(20) DEFAULT 'booked' COMMENT '状态',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_id (room_id),
  INDEX idx_booker_id (booker_id),
  INDEX idx_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会议室预订表';

-- 日程提醒表
CREATE TABLE IF NOT EXISTS oa_schedule_reminder (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  schedule_id BIGINT NOT NULL COMMENT '日程ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  remind_time DATETIME NOT NULL COMMENT '提醒时间',
  remind_type VARCHAR(20) DEFAULT 'system' COMMENT '提醒方式',
  is_sent TINYINT DEFAULT 0 COMMENT '是否已发送',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_schedule_id (schedule_id),
  INDEX idx_user_id (user_id),
  INDEX idx_remind_time (remind_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日程提醒表';

-- 资产领用记录表
CREATE TABLE IF NOT EXISTS oa_asset_borrow (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_id BIGINT NOT NULL COMMENT '资产ID',
  borrower_id BIGINT NOT NULL COMMENT '借用人ID',
  borrow_time DATETIME NOT NULL COMMENT '借用时间',
  expected_return_time DATETIME COMMENT '预计归还时间',
  actual_return_time DATETIME COMMENT '实际归还时间',
  purpose VARCHAR(500) COMMENT '借用目的',
  status VARCHAR(20) DEFAULT 'borrowed' COMMENT '状态',
  approver_id BIGINT COMMENT '审批人ID',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_asset_id (asset_id),
  INDEX idx_borrower_id (borrower_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产领用记录表';

-- 工资条确认表
CREATE TABLE IF NOT EXISTS oa_salary_confirm (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  salary_id BIGINT NOT NULL COMMENT '工资条ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  is_confirmed TINYINT DEFAULT 0 COMMENT '是否确认',
  confirmed_time DATETIME COMMENT '确认时间',
  has_objection TINYINT DEFAULT 0 COMMENT '是否有异议',
  objection_content TEXT COMMENT '异议内容',
  objection_status VARCHAR(20) COMMENT '异议处理状态',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_salary_user (salary_id, user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工资条确认表';

-- 公告已读确认表
CREATE TABLE IF NOT EXISTS oa_announcement_confirm (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  announcement_id BIGINT NOT NULL COMMENT '公告ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  is_confirmed TINYINT DEFAULT 0 COMMENT '是否确认',
  confirmed_time DATETIME COMMENT '确认时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_announcement_user (announcement_id, user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告已读确认表';

-- 插入默认考勤规则
INSERT INTO oa_attendance_rule (name, work_start, work_end, flexible_minutes, late_threshold, early_leave_threshold)
VALUES ('默认考勤规则', '09:00:00', '18:00:00', 30, 30, 30);

-- 插入默认会议室
INSERT INTO oa_meeting_room (name, location, capacity, equipment) VALUES
('会议室A', '3楼A区', 10, '["投影仪","白板","视频会议"]'),
('会议室B', '3楼B区', 20, '["投影仪","白板","视频会议","音响"]'),
('会议室C', '4楼A区', 6, '["投影仪","白板"]');

SELECT '业务流程增强表创建完成' AS message;
