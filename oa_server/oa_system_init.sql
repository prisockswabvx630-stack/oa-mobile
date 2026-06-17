-- =============================================
-- 智能OA办公系统 - 数据库初始化脚本
-- 版本: MySQL 8.0
-- 创建日期: 2026-05-19
-- 说明: 包含所有表结构、索引、初始数据
-- =============================================

-- 创建数据库
USE `oa_system`;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 系统管理模块
-- =============================================

-- ----------------------------
-- 1. 部门表
-- ----------------------------
DROP TABLE IF EXISTS `sys_department`;
CREATE TABLE `sys_department` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `dept_code` VARCHAR(20) NOT NULL COMMENT '部门编码',
    `dept_name` VARCHAR(50) NOT NULL COMMENT '部门名称',
    `parent_id` BIGINT DEFAULT 0 COMMENT '上级部门ID',
    `level` INT NOT NULL DEFAULT 1 COMMENT '层级:1顶级 2二级',
    `leader_id` BIGINT DEFAULT NULL COMMENT '负责人ID',
    `sort` INT DEFAULT 0 COMMENT '排序号',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_dept_code` (`dept_code`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_level` (`level`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- ----------------------------
-- 2. 职位表
-- ----------------------------
DROP TABLE IF EXISTS `sys_position`;
CREATE TABLE `sys_position` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `pos_code` VARCHAR(20) NOT NULL COMMENT '职位编码',
    `pos_name` VARCHAR(50) NOT NULL COMMENT '职位名称',
    `level` INT NOT NULL DEFAULT 1 COMMENT '职级:1-10',
    `sort` INT DEFAULT 0 COMMENT '排序号',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_pos_code` (`pos_code`),
    KEY `idx_level` (`level`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='职位表';

-- ----------------------------
-- 3. 角色表
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `role_code` VARCHAR(20) NOT NULL COMMENT '角色编码',
    `role_name` VARCHAR(50) NOT NULL COMMENT '角色名称',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '角色描述',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
    `sort` INT DEFAULT 0 COMMENT '排序号',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_code` (`role_code`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ----------------------------
-- 4. 权限表
-- ----------------------------
DROP TABLE IF EXISTS `sys_permission`;
CREATE TABLE `sys_permission` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父权限ID',
    `permission_code` VARCHAR(50) NOT NULL COMMENT '权限编码',
    `permission_name` VARCHAR(50) NOT NULL COMMENT '权限名称',
    `permission_type` VARCHAR(20) NOT NULL COMMENT '权限类型:menu/button/api',
    `route_path` VARCHAR(200) DEFAULT NULL COMMENT '路由路径',
    `component_path` VARCHAR(200) DEFAULT NULL COMMENT '组件路径',
    `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标',
    `sort` INT DEFAULT 0 COMMENT '排序号',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_permission_code` (`permission_code`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- ----------------------------
-- 5. 用户表
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `emp_no` VARCHAR(20) NOT NULL COMMENT '工号',
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    `password` VARCHAR(255) NOT NULL COMMENT '加密密码',
    `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `gender` TINYINT NOT NULL DEFAULT 1 COMMENT '性别:0女 1男',
    `mobile` VARCHAR(11) NOT NULL COMMENT '手机号',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `dept_id` BIGINT DEFAULT NULL COMMENT '部门ID',
    `position_id` BIGINT DEFAULT NULL COMMENT '职位ID',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
    `entry_date` DATE DEFAULT NULL COMMENT '入职日期',
    `contract_expire` DATE DEFAULT NULL COMMENT '合同到期日期',
    `probation_end` DATE DEFAULT NULL COMMENT '试用期结束日期',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    `login_fail_count` INT DEFAULT 0 COMMENT '登录失败次数',
    `lock_time` DATETIME DEFAULT NULL COMMENT '锁定时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_emp_no` (`emp_no`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_real_name` (`real_name`),
    KEY `idx_mobile` (`mobile`),
    KEY `idx_dept_id` (`dept_id`),
    KEY `idx_position_id` (`position_id`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`),
    CONSTRAINT `fk_user_dept` FOREIGN KEY (`dept_id`) REFERENCES `sys_department` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_user_position` FOREIGN KEY (`position_id`) REFERENCES `sys_position` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- 6. 用户角色关联表
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `role_id` BIGINT NOT NULL COMMENT '角色ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_role_id` (`role_id`),
    CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ----------------------------
-- 7. 角色权限关联表
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_permission`;
CREATE TABLE `sys_role_permission` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `role_id` BIGINT NOT NULL COMMENT '角色ID',
    `permission_id` BIGINT NOT NULL COMMENT '权限ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_permission_id` (`permission_id`),
    CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `sys_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ----------------------------
-- 8. 系统配置表
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `config_key` VARCHAR(50) NOT NULL COMMENT '配置键',
    `config_value` TEXT COMMENT '配置值',
    `config_type` VARCHAR(20) DEFAULT 'string' COMMENT '配置类型:string/number/boolean/json',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '描述',
    `group_name` VARCHAR(50) DEFAULT NULL COMMENT '分组名称',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_config_key` (`config_key`),
    KEY `idx_group_name` (`group_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ----------------------------
-- 9. 操作日志表
-- ----------------------------
DROP TABLE IF EXISTS `sys_operation_log`;
CREATE TABLE `sys_operation_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `username` VARCHAR(50) DEFAULT NULL COMMENT '用户名',
    `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    `module` VARCHAR(50) DEFAULT NULL COMMENT '模块名称',
    `operation` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `method` VARCHAR(100) DEFAULT NULL COMMENT '请求方法',
    `request_url` VARCHAR(200) DEFAULT NULL COMMENT '请求URL',
    `request_params` TEXT COMMENT '请求参数',
    `request_ip` VARCHAR(50) DEFAULT NULL COMMENT '请求IP',
    `ip_location` VARCHAR(100) DEFAULT NULL COMMENT 'IP归属地',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0失败 1成功',
    `error_msg` VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    `execute_time` INT DEFAULT 0 COMMENT '执行时长(毫秒)',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_username` (`username`),
    KEY `idx_module` (`module`),
    KEY `idx_status` (`status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ----------------------------
-- 10. 消息表
-- ----------------------------
DROP TABLE IF EXISTS `sys_message`;
CREATE TABLE `sys_message` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `sender_id` BIGINT DEFAULT NULL COMMENT '发送人ID,系统消息为空',
    `receiver_id` BIGINT NOT NULL COMMENT '接收人ID',
    `type` VARCHAR(20) NOT NULL COMMENT '类型:approval/notice/system',
    `title` VARCHAR(100) NOT NULL COMMENT '消息标题',
    `content` VARCHAR(500) NOT NULL COMMENT '消息内容',
    `related_id` BIGINT DEFAULT NULL COMMENT '关联ID',
    `related_type` VARCHAR(20) DEFAULT NULL COMMENT '关联类型',
    `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读:0否 1是',
    `read_time` DATETIME DEFAULT NULL COMMENT '阅读时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_receiver_id` (`receiver_id`),
    KEY `idx_is_read` (`is_read`),
    KEY `idx_type` (`type`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- =============================================
-- 办公管理模块
-- =============================================

-- ----------------------------
-- 11. 考勤记录表
-- ----------------------------
DROP TABLE IF EXISTS `oa_attendance`;
CREATE TABLE `oa_attendance` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `attend_date` DATE NOT NULL COMMENT '考勤日期',
    `clock_in_time` TIME DEFAULT NULL COMMENT '上班打卡时间',
    `clock_out_time` TIME DEFAULT NULL COMMENT '下班打卡时间',
    `work_hours` DECIMAL(4,2) DEFAULT 0.00 COMMENT '工作时长(小时)',
    `clock_in_location` VARCHAR(100) DEFAULT NULL COMMENT '上班打卡位置',
    `clock_out_location` VARCHAR(100) DEFAULT NULL COMMENT '下班打卡位置',
    `clock_in_latitude` DECIMAL(10,6) DEFAULT NULL COMMENT '上班打卡纬度',
    `clock_in_longitude` DECIMAL(10,6) DEFAULT NULL COMMENT '上班打卡经度',
    `clock_out_latitude` DECIMAL(10,6) DEFAULT NULL COMMENT '下班打卡纬度',
    `clock_out_longitude` DECIMAL(10,6) DEFAULT NULL COMMENT '下班打卡经度',
    `clock_in_device` VARCHAR(50) DEFAULT NULL COMMENT '上班打卡设备',
    `clock_out_device` VARCHAR(50) DEFAULT NULL COMMENT '下班打卡设备',
    `status` VARCHAR(20) NOT NULL DEFAULT 'absent' COMMENT '状态:normal/late/early/late_early/absent/leave',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_date` (`user_id`, `attend_date`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_attend_date` (`attend_date`),
    KEY `idx_status` (`status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤记录表';

-- ----------------------------
-- 12. 流程模板表
-- ----------------------------
DROP TABLE IF EXISTS `oa_process_template`;
CREATE TABLE `oa_process_template` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `template_code` VARCHAR(20) NOT NULL COMMENT '流程编码',
    `template_name` VARCHAR(50) NOT NULL COMMENT '流程名称',
    `type` VARCHAR(20) NOT NULL COMMENT '类型:leave/expense/travel/overtime/purchase/seal',
    `scope` VARCHAR(20) NOT NULL DEFAULT 'all' COMMENT '适用范围:all/dept',
    `dept_ids` VARCHAR(500) DEFAULT NULL COMMENT '部门ID列表(逗号分隔)',
    `nodes` TEXT NOT NULL COMMENT '节点配置JSON',
    `form_fields` TEXT COMMENT '表单字段JSON',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0停用 1启用',
    `sort` INT DEFAULT 0 COMMENT '排序号',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_template_code` (`template_code`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='流程模板表';

-- ----------------------------
-- 13. 审批记录表
-- ----------------------------
DROP TABLE IF EXISTS `oa_approval`;
CREATE TABLE `oa_approval` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `approval_no` VARCHAR(30) NOT NULL COMMENT '审批编号',
    `type` VARCHAR(20) NOT NULL COMMENT '类型:leave/expense/travel/overtime/purchase/seal',
    `title` VARCHAR(100) NOT NULL COMMENT '审批标题',
    `applicant_id` BIGINT NOT NULL COMMENT '申请人ID',
    `dept_id` BIGINT NOT NULL COMMENT '申请部门ID',
    `content` TEXT NOT NULL COMMENT '审批内容JSON',
    `template_id` BIGINT DEFAULT NULL COMMENT '流程模板ID',
    `current_node` VARCHAR(50) DEFAULT NULL COMMENT '当前审批节点',
    `current_approver_id` BIGINT DEFAULT NULL COMMENT '当前审批人ID',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态:pending/approved/rejected/cancelled',
    `reject_reason` VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    `cancel_reason` VARCHAR(500) DEFAULT NULL COMMENT '撤回原因',
    `approved_time` DATETIME DEFAULT NULL COMMENT '通过时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_approval_no` (`approval_no`),
    KEY `idx_type` (`type`),
    KEY `idx_applicant_id` (`applicant_id`),
    KEY `idx_dept_id` (`dept_id`),
    KEY `idx_current_approver_id` (`current_approver_id`),
    KEY `idx_status` (`status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批记录表';

-- ----------------------------
-- 14. 审批流程表
-- ----------------------------
DROP TABLE IF EXISTS `oa_approval_flow`;
CREATE TABLE `oa_approval_flow` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `approval_id` BIGINT NOT NULL COMMENT '审批记录ID',
    `node_name` VARCHAR(50) NOT NULL COMMENT '节点名称',
    `node_order` INT NOT NULL COMMENT '节点顺序',
    `approver_id` BIGINT DEFAULT NULL COMMENT '审批人ID',
    `approver_name` VARCHAR(50) DEFAULT NULL COMMENT '审批人姓名',
    `approver_type` VARCHAR(20) NOT NULL COMMENT '审批人类型:user/role',
    `role_id` BIGINT DEFAULT NULL COMMENT '角色ID',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态:pending/approved/rejected/skipped',
    `opinion` VARCHAR(500) DEFAULT NULL COMMENT '审批意见',
    `handle_time` DATETIME DEFAULT NULL COMMENT '处理时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_approval_id` (`approval_id`),
    KEY `idx_approver_id` (`approver_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批流程表';

-- ----------------------------
-- 15. 项目表
-- ----------------------------
DROP TABLE IF EXISTS `oa_project`;
CREATE TABLE `oa_project` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_no` VARCHAR(30) NOT NULL COMMENT '项目编号',
    `project_name` VARCHAR(100) NOT NULL COMMENT '项目名称',
    `description` TEXT COMMENT '项目描述',
    `manager_id` BIGINT DEFAULT NULL COMMENT '项目经理ID',
    `start_date` DATE DEFAULT NULL COMMENT '开始日期',
    `end_date` DATE DEFAULT NULL COMMENT '结束日期',
    `progress` INT DEFAULT 0 COMMENT '进度:0-100',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态:pending/in_progress/completed/paused',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'medium' COMMENT '优先级:high/medium/low',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_project_no` (`project_no`),
    KEY `idx_manager_id` (`manager_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- ----------------------------
-- 16. 任务表
-- ----------------------------
DROP TABLE IF EXISTS `oa_task`;
CREATE TABLE `oa_task` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `task_no` VARCHAR(30) NOT NULL COMMENT '任务编号',
    `title` VARCHAR(100) NOT NULL COMMENT '任务标题',
    `description` TEXT COMMENT '任务描述',
    `project_id` BIGINT DEFAULT NULL COMMENT '所属项目ID',
    `assignee_id` BIGINT NOT NULL COMMENT '负责人ID',
    `creator_id` BIGINT NOT NULL COMMENT '创建人ID',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'medium' COMMENT '优先级:high/medium/low',
    `due_date` DATE DEFAULT NULL COMMENT '截止日期',
    `progress` INT DEFAULT 0 COMMENT '进度:0-100',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态:pending/in_progress/completed/overdue',
    `completed_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_task_no` (`task_no`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_assignee_id` (`assignee_id`),
    KEY `idx_creator_id` (`creator_id`),
    KEY `idx_status` (`status`),
    KEY `idx_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

-- ----------------------------
-- 17. 会议表
-- ----------------------------
DROP TABLE IF EXISTS `oa_meeting`;
CREATE TABLE `oa_meeting` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `meeting_no` VARCHAR(30) NOT NULL COMMENT '会议编号',
    `title` VARCHAR(100) NOT NULL COMMENT '会议主题',
    `organizer_id` BIGINT NOT NULL COMMENT '组织者ID',
    `room_id` BIGINT DEFAULT NULL COMMENT '会议室ID',
    `room_name` VARCHAR(50) DEFAULT NULL COMMENT '会议室名称',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `end_time` DATETIME NOT NULL COMMENT '结束时间',
    `attendees` TEXT COMMENT '参会人ID列表JSON',
    `status` VARCHAR(20) NOT NULL DEFAULT 'upcoming' COMMENT '状态:upcoming/ongoing/completed/cancelled',
    `minutes` TEXT COMMENT '会议纪要',
    `cancel_reason` VARCHAR(500) DEFAULT NULL COMMENT '取消原因',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_meeting_no` (`meeting_no`),
    KEY `idx_organizer_id` (`organizer_id`),
    KEY `idx_start_time` (`start_time`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会议表';

-- ----------------------------
-- 18. 日程表
-- ----------------------------
DROP TABLE IF EXISTS `oa_schedule`;
CREATE TABLE `oa_schedule` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `title` VARCHAR(100) NOT NULL COMMENT '日程标题',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '日程描述',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `end_time` DATETIME NOT NULL COMMENT '结束时间',
    `location` VARCHAR(100) DEFAULT NULL COMMENT '地点',
    `type` VARCHAR(20) NOT NULL DEFAULT 'personal' COMMENT '类型:personal/team/meeting',
    `attendees` TEXT COMMENT '参会人ID列表JSON',
    `remind_minutes` INT DEFAULT 0 COMMENT '提醒时间(分钟)',
    `reminded` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已提醒:0否 1是',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_start_time` (`start_time`),
    KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日程表';

-- =============================================
-- 人事管理模块
-- =============================================

-- ----------------------------
-- 19. 员工合同表
-- ----------------------------
DROP TABLE IF EXISTS `hr_employee_contract`;
CREATE TABLE `hr_employee_contract` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `contract_no` VARCHAR(30) NOT NULL COMMENT '合同编号',
    `contract_type` VARCHAR(20) NOT NULL COMMENT '合同类型:labor/intern/outsource',
    `start_date` DATE NOT NULL COMMENT '合同开始日期',
    `end_date` DATE NOT NULL COMMENT '合同结束日期',
    `probation_months` INT DEFAULT 0 COMMENT '试用期月数',
    `probation_end_date` DATE DEFAULT NULL COMMENT '试用期结束日期',
    `salary` DECIMAL(10,2) DEFAULT NULL COMMENT '基本工资',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态:active/expired/terminated',
    `sign_date` DATE DEFAULT NULL COMMENT '签订日期',
    `terminate_date` DATE DEFAULT NULL COMMENT '终止日期',
    `terminate_reason` VARCHAR(500) DEFAULT NULL COMMENT '终止原因',
    `attachment_url` VARCHAR(255) DEFAULT NULL COMMENT '合同附件URL',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_contract_no` (`contract_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工合同表';

-- =============================================
-- 业务管理模块
-- =============================================

-- ----------------------------
-- 20. 薪资记录表
-- ----------------------------
DROP TABLE IF EXISTS `oa_salary`;
CREATE TABLE `oa_salary` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `month` VARCHAR(7) NOT NULL COMMENT '月份(YYYY-MM)',
    `base_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基本工资',
    `position_allowance` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '岗位津贴',
    `performance_bonus` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '绩效奖金',
    `meal_allowance` DECIMAL(10,2) DEFAULT 0.00 COMMENT '餐补',
    `transport_allowance` DECIMAL(10,2) DEFAULT 0.00 COMMENT '交通补贴',
    `housing_allowance` DECIMAL(10,2) DEFAULT 0.00 COMMENT '住房补贴',
    `overtime_pay` DECIMAL(10,2) DEFAULT 0.00 COMMENT '加班费',
    `other_income` DECIMAL(10,2) DEFAULT 0.00 COMMENT '其他收入',
    `social_security` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '社保(个人)',
    `housing_fund` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '公积金(个人)',
    `income_tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '个人所得税',
    `other_deduction` DECIMAL(10,2) DEFAULT 0.00 COMMENT '其他扣除',
    `net_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '实发工资',
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '状态:draft/paid',
    `paid_time` DATETIME DEFAULT NULL COMMENT '发放时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_month` (`user_id`, `month`),
    KEY `idx_month` (`month`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='薪资记录表';

-- ----------------------------
-- 21. 资产表
-- ----------------------------
DROP TABLE IF EXISTS `oa_asset`;
CREATE TABLE `oa_asset` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `asset_no` VARCHAR(30) NOT NULL COMMENT '资产编号',
    `asset_name` VARCHAR(100) NOT NULL COMMENT '资产名称',
    `category` VARCHAR(20) NOT NULL COMMENT '分类:computer/phone/device/furniture/other',
    `brand` VARCHAR(50) DEFAULT NULL COMMENT '品牌',
    `model` VARCHAR(50) DEFAULT NULL COMMENT '型号',
    `specification` VARCHAR(200) DEFAULT NULL COMMENT '规格',
    `user_id` BIGINT DEFAULT NULL COMMENT '使用人ID',
    `purchase_date` DATE NOT NULL COMMENT '购入日期',
    `original_value` DECIMAL(10,2) NOT NULL COMMENT '原值',
    `current_value` DECIMAL(10,2) DEFAULT NULL COMMENT '当前价值',
    `depreciation_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT '折旧率',
    `status` VARCHAR(20) NOT NULL DEFAULT 'idle' COMMENT '状态:idle/using/repair/scrapped',
    `location` VARCHAR(100) DEFAULT NULL COMMENT '存放位置',
    `sn_code` VARCHAR(50) DEFAULT NULL COMMENT '序列号',
    `warranty_end_date` DATE DEFAULT NULL COMMENT '保修到期日期',
    `image_url` VARCHAR(255) DEFAULT NULL COMMENT '资产图片URL',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_asset_no` (`asset_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_category` (`category`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产表';

-- ----------------------------
-- 22. 资产领用记录表
-- ----------------------------
DROP TABLE IF EXISTS `oa_asset_record`;
CREATE TABLE `oa_asset_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `asset_id` BIGINT NOT NULL COMMENT '资产ID',
    `user_id` BIGINT NOT NULL COMMENT '领用人ID',
    `type` VARCHAR(20) NOT NULL COMMENT '类型:borrow/return/transfer/repair',
    `borrow_date` DATETIME NOT NULL COMMENT '领用时间',
    `return_date` DATETIME DEFAULT NULL COMMENT '归还时间',
    `expected_return_date` DATE DEFAULT NULL COMMENT '预计归还日期',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态:active/completed/cancelled',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_asset_id` (`asset_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产领用记录表';

-- =============================================
-- 沟通协作模块
-- =============================================

-- ----------------------------
-- 23. 公告表
-- ----------------------------
DROP TABLE IF EXISTS `oa_announcement`;
CREATE TABLE `oa_announcement` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `title` VARCHAR(100) NOT NULL COMMENT '公告标题',
    `type` VARCHAR(20) NOT NULL COMMENT '类型:announce/notice/policy',
    `scope` VARCHAR(20) NOT NULL DEFAULT 'all' COMMENT '范围:all/dept',
    `dept_ids` VARCHAR(500) DEFAULT NULL COMMENT '部门ID列表(逗号分隔)',
    `publisher_id` BIGINT NOT NULL COMMENT '发布人ID',
    `content` TEXT NOT NULL COMMENT '公告内容(HTML)',
    `attachments` VARCHAR(500) DEFAULT NULL COMMENT '附件URL列表(逗号分隔)',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '阅读量',
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '状态:draft/published/withdrawn',
    `publish_time` DATETIME DEFAULT NULL COMMENT '发布时间',
    `withdraw_time` DATETIME DEFAULT NULL COMMENT '撤回时间',
    `top` TINYINT NOT NULL DEFAULT 0 COMMENT '是否置顶:0否 1是',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    KEY `idx_type` (`type`),
    KEY `idx_publisher_id` (`publisher_id`),
    KEY `idx_status` (`status`),
    KEY `idx_publish_time` (`publish_time`),
    KEY `idx_top` (`top`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- ----------------------------
-- 24. 公告阅读记录表
-- ----------------------------
DROP TABLE IF EXISTS `oa_announcement_read`;
CREATE TABLE `oa_announcement_read` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `announcement_id` BIGINT NOT NULL COMMENT '公告ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `read_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_announcement_user` (`announcement_id`, `user_id`),
    KEY `idx_announcement_id` (`announcement_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告阅读记录表';

-- ----------------------------
-- 25. 工作交接表
-- ----------------------------
DROP TABLE IF EXISTS `oa_handover`;
CREATE TABLE `oa_handover` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `handover_no` VARCHAR(30) NOT NULL COMMENT '交接编号',
    `title` VARCHAR(100) NOT NULL COMMENT '交接标题',
    `initiator_id` BIGINT NOT NULL COMMENT '交接人ID',
    `receiver_id` BIGINT NOT NULL COMMENT '接收人ID',
    `content` TEXT NOT NULL COMMENT '交接内容',
    `attachments` VARCHAR(500) DEFAULT NULL COMMENT '附件URL列表(逗号分隔)',
    `progress` INT NOT NULL DEFAULT 0 COMMENT '完成度:0-100',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态:pending/confirmed/completed/cancelled',
    `confirm_time` DATETIME DEFAULT NULL COMMENT '确认接收时间',
    `complete_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `cancel_reason` VARCHAR(500) DEFAULT NULL COMMENT '取消原因',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_handover_no` (`handover_no`),
    KEY `idx_initiator_id` (`initiator_id`),
    KEY `idx_receiver_id` (`receiver_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作交接表';

-- ----------------------------
-- 26. 文档表
-- ----------------------------
DROP TABLE IF EXISTS `oa_document`;
CREATE TABLE `oa_document` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `doc_name` VARCHAR(100) NOT NULL COMMENT '文档名称',
    `doc_type` VARCHAR(20) NOT NULL COMMENT '文档类型:word/excel/pdf/ppt/image/other',
    `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
    `file_url` VARCHAR(255) NOT NULL COMMENT '文件URL',
    `folder_id` BIGINT DEFAULT 0 COMMENT '文件夹ID',
    `uploader_id` BIGINT NOT NULL COMMENT '上传人ID',
    `scope` VARCHAR(20) NOT NULL DEFAULT 'personal' COMMENT '范围:personal/dept/public',
    `dept_ids` VARCHAR(500) DEFAULT NULL COMMENT '部门ID列表(逗号分隔)',
    `download_count` INT NOT NULL DEFAULT 0 COMMENT '下载次数',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '查看次数',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记:0否 1是',
    PRIMARY KEY (`id`),
    KEY `idx_folder_id` (`folder_id`),
    KEY `idx_uploader_id` (`uploader_id`),
    KEY `idx_scope` (`scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档表';

-- =============================================
-- 初始化数据
-- =============================================

-- ----------------------------
-- 初始化部门数据
-- ----------------------------
INSERT INTO `sys_department` (`dept_code`, `dept_name`, `parent_id`, `level`, `leader_id`, `sort`, `status`) VALUES
('D001', '总公司', 0, 1, NULL, 1, 1),
('D002', '技术部', 1, 2, NULL, 1, 1),
('D003', '市场部', 1, 2, NULL, 2, 1),
('D004', '销售部', 1, 2, NULL, 3, 1),
('D005', '行政部', 1, 2, NULL, 4, 1),
('D006', '财务部', 1, 2, NULL, 5, 1),
('D007', '人事部', 1, 2, NULL, 6, 1);

-- ----------------------------
-- 初始化职位数据
-- ----------------------------
INSERT INTO `sys_position` (`pos_code`, `pos_name`, `level`, `sort`, `status`) VALUES
('P001', 'CEO', 10, 1, 1),
('P002', 'CTO', 9, 1, 1),
('P003', '技术总监', 8, 1, 1),
('P004', '高级开发', 6, 2, 1),
('P005', '中级开发', 5, 3, 1),
('P006', '初级开发', 4, 4, 1),
('P007', '市场总监', 8, 1, 1),
('P008', '销售总监', 8, 1, 1),
('P009', '财务总监', 8, 1, 1),
('P010', '人事总监', 8, 1, 1);

-- ----------------------------
-- 初始化角色数据
-- ----------------------------
INSERT INTO `sys_role` (`role_code`, `role_name`, `description`, `sort`, `status`) VALUES
('ROLE_ADMIN', '系统管理员', '拥有系统所有权限', 1, 1),
('ROLE_HR', '人事专员', '人事管理权限', 2, 1),
('ROLE_MANAGER', '部门管理者', '部门管理权限', 3, 1),
('ROLE_USER', '普通员工', '基础办公权限', 4, 1);

-- ----------------------------
-- 初始化权限数据
-- ----------------------------
INSERT INTO `sys_permission` (`parent_id`, `permission_code`, `permission_name`, `permission_type`, `route_path`, `icon`, `sort`, `status`) VALUES
-- 一级菜单
(0, 'dashboard', '仪表盘', 'menu', '/dashboard', 'dashboard', 1, 1),
(0, 'org', '组织管理', 'menu', '/org', 'organization', 2, 1),
(0, 'office', '办公管理', 'menu', '/office', 'office', 3, 1),
(0, 'business', '业务管理', 'menu', '/business', 'business', 4, 1),
(0, 'collaboration', '沟通协作', 'menu', '/collaboration', 'collaboration', 5, 1),
(0, 'system', '系统', 'menu', '/system', 'system', 6, 1),
-- 组织管理子菜单
(2, 'org:user', '用户管理', 'menu', '/org/user', 'user', 1, 1),
(2, 'org:personnel', '人事管理', 'menu', '/org/personnel', 'team', 2, 1),
-- 办公管理子菜单
(3, 'office:attendance', '考勤管理', 'menu', '/office/attendance', 'clock', 1, 1),
(3, 'office:approval', '审批管理', 'menu', '/office/approval', 'audit', 2, 1),
(3, 'office:process', '流程管理', 'menu', '/office/process', 'api', 3, 1),
(3, 'office:meeting', '会议管理', 'menu', '/office/meeting', 'calendar', 4, 1),
(3, 'office:task', '任务管理', 'menu', '/office/task', 'check-square', 5, 1),
(3, 'office:schedule', '日程管理', 'menu', '/office/schedule', 'schedule', 6, 1),
-- 业务管理子菜单
(4, 'business:project', '项目管理', 'menu', '/business/project', 'project', 1, 1),
(4, 'business:performance', '绩效管理', 'menu', '/business/performance', 'perf', 2, 1),
(4, 'business:salary', '薪资管理', 'menu', '/business/salary', 'money', 3, 1),
(4, 'business:asset', '资产管理', 'menu', '/business/asset', 'inbox', 4, 1),
(4, 'business:expense', '报销管理', 'menu', '/business/expense', 'expense', 5, 1),
-- 沟通协作子菜单
(5, 'collaboration:handover', '工作交接', 'menu', '/collaboration/handover', 'swap', 1, 1),
(5, 'collaboration:announcement', '公告管理', 'menu', '/collaboration/announcement', 'notification', 2, 1),
(5, 'collaboration:document', '文档管理', 'menu', '/collaboration/document', 'file', 3, 1),
-- 系统子菜单
(6, 'system:settings', '系统设置', 'menu', '/system/settings', 'setting', 1, 1);

-- ----------------------------
-- 初始化管理员用户 (密码: 123456)
-- ----------------------------
INSERT INTO `sys_user` (`emp_no`, `username`, `password`, `real_name`, `gender`, `mobile`, `email`, `dept_id`, `position_id`, `status`, `entry_date`) VALUES
('10001', 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '系统管理员', 1, '13800138000', 'admin@oa.com', 1, 1, 1, CURDATE());

-- ----------------------------
-- 初始化用户角色关联
-- ----------------------------
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES
(1, 1);

-- ----------------------------
-- 初始化角色权限关联
-- ----------------------------

-- 管理员拥有所有权限
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `sys_permission`;

-- 人事专员权限
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `sys_permission` WHERE `permission_code` IN (
  'dashboard', 'org', 'org:user', 'org:personnel',
  'office', 'office:attendance', 'office:approval', 'office:task', 'office:schedule',
  'business', 'business:salary', 'business:asset', 'business:expense',
  'collaboration', 'collaboration:announcement', 'collaboration:document'
);

-- 部门管理者权限
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT 3, `id` FROM `sys_permission` WHERE `permission_code` IN (
  'dashboard',
  'office', 'office:attendance', 'office:approval', 'office:process', 'office:meeting', 'office:task', 'office:schedule',
  'business', 'business:project', 'business:performance',
  'collaboration', 'collaboration:handover', 'collaboration:announcement', 'collaboration:document'
);

-- 普通员工权限
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT 4, `id` FROM `sys_permission` WHERE `permission_code` IN (
  'office', 'office:attendance', 'office:task', 'office:schedule',
  'collaboration', 'collaboration:document'
);

-- ----------------------------
-- 初始化系统配置
-- ----------------------------
INSERT INTO `sys_config` (`config_key`, `config_value`, `config_type`, `description`, `group_name`) VALUES
('system.name', '智能OA办公系统', 'string', '系统名称', 'basic'),
('system.logo', '/assets/logo.png', 'string', '系统Logo', 'basic'),
('work.time.start', '09:00', 'string', '上班时间', 'attendance'),
('work.time.end', '18:00', 'string', '下班时间', 'attendance'),
('work.time.flexible', '15', 'number', '弹性时间(分钟)', 'attendance'),
('clock.method', 'gps,wifi', 'json', '打卡方式', 'attendance'),
('notification.approval', 'true', 'boolean', '审批提醒', 'notification'),
('notification.attendance', 'true', 'boolean', '考勤提醒', 'notification'),
('notification.meeting', 'true', 'boolean', '会议提醒', 'notification'),
('notification.announcement', 'true', 'boolean', '公告提醒', 'notification');

-- ----------------------------
-- 初始化流程模板
-- ----------------------------
INSERT INTO `oa_process_template` (`template_code`, `template_name`, `type`, `scope`, `nodes`, `form_fields`, `status`, `sort`) VALUES
('LEAVE', '请假审批流程', 'leave', 'all',
 '[{"nodeName":"发起","nodeOrder":1,"approverType":"user","approverId":"${applicant}"},{"nodeName":"主管","nodeOrder":2,"approverType":"deptLeader"},{"nodeName":"HR","nodeOrder":3,"approverType":"role","roleId":"ROLE_HR"}]',
 '[{"field":"type","label":"请假类型","type":"select","required":true,"options":"annual,sick,personal,compensatory,marriage,maternity"},{"field":"startTime","label":"开始时间","type":"datetime","required":true},{"field":"endTime","label":"结束时间","type":"datetime","required":true},{"field":"reason","label":"请假事由","type":"textarea","required":true},{"field":"attachment","label":"附件","type":"file","required":false}]',
 1, 1),
('EXPENSE', '报销审批流程', 'expense', 'all',
 '[{"nodeName":"发起","nodeOrder":1,"approverType":"user","approverId":"${applicant}"},{"nodeName":"主管","nodeOrder":2,"approverType":"deptLeader"},{"nodeName":"财务","nodeOrder":3,"approverType":"role","roleId":"ROLE_FINANCE"},{"nodeName":"出纳","nodeOrder":4,"approverType":"role","roleId":"ROLE_CASHIER"}]',
 '[{"field":"type","label":"报销类型","type":"select","required":true,"options":"travel,business,office"},{"field":"amount","label":"报销金额","type":"number","required":true},{"field":"reason","label":"报销事由","type":"textarea","required":true},{"field":"attachment","label":"附件","type":"file","required":true}]',
 1, 2),
('TRAVEL', '出差审批流程', 'travel', 'all',
 '[{"nodeName":"发起","nodeOrder":1,"approverType":"user","approverId":"${applicant}"},{"nodeName":"主管","nodeOrder":2,"approverType":"deptLeader"},{"nodeName":"总监","nodeOrder":3,"approverType":"deptLeader","level":2},{"nodeName":"行政","nodeOrder":4,"approverType":"role","roleId":"ROLE_ADMIN"}]',
 '[{"field":"location","label":"出差地点","type":"text","required":true},{"field":"startTime","label":"开始时间","type":"datetime","required":true},{"field":"endTime","label":"结束时间","type":"datetime","required":true},{"field":"reason","label":"出差事由","type":"textarea","required":true}]',
 1, 3),
('OVERTIME', '加班审批流程', 'overtime', 'all',
 '[{"nodeName":"发起","nodeOrder":1,"approverType":"user","approverId":"${applicant}"},{"nodeName":"主管","nodeOrder":2,"approverType":"deptLeader"}]',
 '[{"field":"date","label":"加班日期","type":"date","required":true},{"field":"startTime","label":"开始时间","type":"time","required":true},{"field":"endTime","label":"结束时间","type":"time","required":true},{"field":"reason","label":"加班事由","type":"textarea","required":true}]',
 1, 4),
('PURCHASE', '采购审批流程', 'purchase', 'all',
 '[{"nodeName":"发起","nodeOrder":1,"approverType":"user","approverId":"${applicant}"},{"nodeName":"主管","nodeOrder":2,"approverType":"deptLeader"},{"nodeName":"财务","nodeOrder":3,"approverType":"role","roleId":"ROLE_FINANCE"},{"nodeName":"总经理","nodeOrder":4,"approverType":"role","roleId":"ROLE_CEO"}]',
 '[{"field":"item","label":"采购物品","type":"text","required":true},{"field":"specification","label":"规格型号","type":"text","required":false},{"field":"quantity","label":"数量","type":"number","required":true},{"field":"budget","label":"预算金额","type":"number","required":true},{"field":"reason","label":"采购事由","type":"textarea","required":true}]',
 1, 5),
('SEAL', '用章审批流程', 'seal', 'all',
 '[{"nodeName":"发起","nodeOrder":1,"approverType":"user","approverId":"${applicant}"},{"nodeName":"部门负责人","nodeOrder":2,"approverType":"deptLeader"},{"nodeName":"行政","nodeOrder":3,"approverType":"role","roleId":"ROLE_ADMIN"}]',
 '[{"field":"sealType","label":"用章类型","type":"select","required":true,"options":"official,contract,finance"},{"field":"reason","label":"用章事由","type":"textarea","required":true},{"field":"attachment","label":"用章文件","type":"file","required":true}]',
 1, 6);

-- =============================================
-- 创建视图 (可选)
-- =============================================

-- 用户详情视图 (包含部门、职位、角色信息)
CREATE OR REPLACE VIEW `v_user_detail` AS
SELECT
    u.id,
    u.emp_no,
    u.username,
    u.real_name,
    u.nickname,
    u.gender,
    u.mobile,
    u.email,
    u.avatar,
    u.dept_id,
    d.dept_name,
    d.dept_code,
    u.position_id,
    p.pos_name,
    p.pos_code,
    p.level,
    u.status,
    u.entry_date,
    u.last_login_time,
    GROUP_CONCAT(DISTINCT r.role_name) AS role_names
FROM sys_user u
LEFT JOIN sys_department d ON u.dept_id = d.id AND d.is_deleted = 0
LEFT JOIN sys_position p ON u.position_id = p.id AND p.is_deleted = 0
LEFT JOIN sys_user_role ur ON u.id = ur.user_id
LEFT JOIN sys_role r ON ur.role_id = r.id AND r.is_deleted = 0
WHERE u.is_deleted = 0
GROUP BY u.id;

-- =============================================
-- 创建存储过程 (可选)
-- =============================================

DELIMITER $$

-- 生成审批编号存储过程
DROP PROCEDURE IF EXISTS `generate_approval_no`$$
CREATE PROCEDURE `generate_approval_no`(IN approval_type VARCHAR(20), OUT approval_no VARCHAR(30))
BEGIN
    DECLARE date_str VARCHAR(8);
    DECLARE seq_num INT;

    SET date_str = DATE_FORMAT(NOW(), '%Y%m%d');

    SELECT COUNT(*) + 1 INTO seq_num
    FROM oa_approval
    WHERE approval_no LIKE CONCAT('AP', date_str, '%');

    SET approval_no = CONCAT('AP', date_str, LPAD(seq_num, 5, '0'));
END$$

DELIMITER ;

-- =============================================
-- 创建触发器 (可选)
-- =============================================

-- 用户插入前触发器 (生成工号)
DELIMITER $$
DROP TRIGGER IF EXISTS `before_sys_user_insert`$$
CREATE TRIGGER `before_sys_user_insert` BEFORE INSERT ON `sys_user`
FOR EACH ROW
BEGIN
    IF NEW.emp_no IS NULL OR NEW.emp_no = '' THEN
        SET NEW.emp_no = CONCAT('1', LPAD(
            (SELECT IFNULL(MAX(CAST(SUBSTRING(emp_no, 2) AS UNSIGNED)), 0) + 1
             FROM sys_user
             WHERE emp_no LIKE '1%'),
        5, '0'));
    END IF;
END$$
DELIMITER ;

-- =============================================
-- 数据库初始化完成
-- =============================================

-- 显示初始化结果
SELECT '数据库初始化完成!' AS message;
SELECT CONCAT('部门数量: ', COUNT(*)) FROM sys_department;
SELECT CONCAT('职位数量: ', COUNT(*)) FROM sys_position;
SELECT CONCAT('角色数量: ', COUNT(*)) FROM sys_role;
SELECT CONCAT('权限数量: ', COUNT(*)) FROM sys_permission;
SELECT CONCAT('用户数量: ', COUNT(*)) FROM sys_user;
SELECT CONCAT('流程模板数量: ', COUNT(*)) FROM oa_process_template;
SET FOREIGN_KEY_CHECKS = 1;