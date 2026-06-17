# 智能OA系统 API接口文档

## 基本信息

| 项目 | 说明 |
|------|------|
| 接口协议 | HTTP |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 后端地址 | http://localhost:3000 |
| 认证方式 | x-user-id 请求头（前端传用户ID，后端信任该值） |
| 技术栈 | Node.js + Express + Prisma + MySQL |

## 统一响应格式

```json
{
  "code": 200,
  "data": {},
  "msg": "success"
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 参数错误 |
| 401 | 未登录/凭证过期 |
| 403 | 权限不足 |
| 409 | 数据冲突 |
| 422 | 业务校验失败 |
| 429 | 请求过快被限流 |
| 500 | 系统错误 |

## 枚举值说明

| 类型 | 值 | 说明 |
|------|----|------|
| 用户状态 | 0/1 | 禁用/正常 |
| 性别 | 0/1 | 女/男 |
| 审批类型 | leave/expense/travel/overtime/purchase/seal | 请假/报销/出差/加班/采购/用章 |
| 审批状态 | pending/approved/rejected/cancelled | 待审批/已通过/已拒绝/已撤销 |
| 任务状态 | pending/in_progress/completed/overdue | 待处理/进行中/已完成/已逾期 |
| 任务优先级 | high/medium/low | 高/中/低 |
| 资产状态 | idle/in_use/maintenance/scrapped | 空闲/使用中/维修中/已报废 |
| 考勤状态 | normal/late/early/late_early/absent/leave | 正常/迟到/早退/迟到早退/缺勤/请假 |

---

## 一、认证模块

### 1.1 用户登录

**POST** `/api/auth/login`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | String | 是 | 用户名 |
| password | String | 是 | 密码 |

**请求示例：**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "emp_no": "10001",
    "dept_id": 1,
    "position_id": 1
  },
  "msg": "登录成功"
}
```

> **认证说明：** 登录成功后，前端存储用户ID，后续所有请求通过 `x-user-id` 请求头传递用户身份。

### 1.2 用户登出

**POST** `/api/auth/logout`

**请求头：** `x-user-id: {用户ID}`

---

## 二、系统管理模块

### 2.1 用户管理

#### 获取用户列表

**GET** `/api/users`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | String | 否 | 搜索关键词（用户名/姓名/手机） |

#### 获取用户详情

**GET** `/api/users/{id}`

#### 创建用户

**POST** `/api/users`

```json
{
  "emp_no": "E1001",
  "username": "zhangsan",
  "password": "123456",
  "real_name": "张三",
  "mobile": "13800138000",
  "email": "zhangsan@example.com",
  "dept_id": 1,
  "position_id": 1,
  "gender": 1,
  "status": 1
}
```

#### 更新用户

**PUT** `/api/users/{id}`

#### 删除用户

**DELETE** `/api/users/{id}`

#### 重置密码

**POST** `/api/users/{id}/reset-password`

密码重置为默认密码 `123456`

---

### 2.2 部门管理

#### 获取部门树

**GET** `/api/departments/tree`

#### 获取部门列表

**GET** `/api/departments`

#### 创建部门

**POST** `/api/departments`

#### 更新部门

**PUT** `/api/departments/{id}`

#### 删除部门

**DELETE** `/api/departments/{id}`

---

### 2.3 角色管理

#### 获取角色列表

**GET** `/api/roles`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleName | String | 否 | 角色名称 |

#### 获取所有角色

**GET** `/api/roles/all`

#### 创建角色

**POST** `/api/roles`

#### 更新角色

**PUT** `/api/roles/{id}`

#### 删除角色

**DELETE** `/api/roles/{id}`

#### 分配权限

**POST** `/api/roles/{id}/permissions`

请求体：`[1, 2, 3, 5]` （权限ID数组）

#### 获取角色权限

**GET** `/api/roles/{id}/permissions`

---

### 2.4 权限管理

#### 获取权限树

**GET** `/api/permissions/tree`

#### 获取所有权限

**GET** `/api/permissions`

#### 创建权限

**POST** `/api/permissions`

#### 更新权限

**PUT** `/api/permissions/{id}`

#### 删除权限

**DELETE** `/api/permissions/{id}`

---

## 三、办公管理模块

### 3.1 考勤管理

#### 上班打卡

**POST** `/api/attendance/clock-in`

```json
{
  "user_id": 1,
  "location": "公司总部",
  "device": "iPhone 15 Pro"
}
```

#### 下班打卡

**POST** `/api/attendance/clock-out`

```json
{
  "user_id": 1
}
```

#### 考勤记录

**GET** `/api/attendance`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |

#### 考勤统计

**GET** `/api/attendance/stats`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |
| month | String | 否 | 月份（YYYY-MM） |

---

### 3.2 审批管理

#### 获取审批列表

**GET** `/api/approvals`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | String | 否 | 审批类型 |
| status | String | 否 | 状态 |
| applicant_id | Number | 否 | 申请人ID |

#### 提交审批

**POST** `/api/approvals`

```json
{
  "type": "leave",
  "title": "年假申请",
  "content": "申请年假3天",
  "dept_id": 1,
  "applicant_id": 2
}
```

#### 审批通过

**PUT** `/api/approvals/{id}/approve`

#### 审批拒绝

**PUT** `/api/approvals/{id}/reject`

```json
{
  "reason": "申请理由不充分"
}
```

#### 撤销审批

**PUT** `/api/approvals/{id}/cancel`

#### 待办列表

**GET** `/api/approvals/todos`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| approver_id | Number | 是 | 审批人ID |

---

### 3.3 任务管理

#### 获取任务列表

**GET** `/api/tasks`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| assignee_id | Number | 否 | 执行人ID |
| status | String | 否 | 状态 |

#### 创建任务

**POST** `/api/tasks`

```json
{
  "title": "完成月度报表",
  "description": "整理本月销售数据",
  "assignee_name": "张三",
  "creator_name": "管理员",
  "priority": "高",
  "due_date": "2026-05-25",
  "project_name": "数据迁移项目"
}
```

#### 更新任务

**PUT** `/api/tasks/{id}`

#### 删除任务

**DELETE** `/api/tasks/{id}`

#### 完成任务

**POST** `/api/tasks/{id}/complete`

#### 分配任务

**POST** `/api/tasks/{id}/assign`

```json
{
  "assigneeName": "李四"
}
```

---

### 3.4 项目管理

#### 获取项目列表

**GET** `/api/projects`

#### 创建项目

**POST** `/api/projects`

#### 更新项目

**PUT** `/api/projects/{id}`

#### 删除项目

**DELETE** `/api/projects/{id}`

---

### 3.5 会议管理

#### 获取会议列表

**GET** `/api/meetings`

#### 创建会议

**POST** `/api/meetings`

```json
{
  "title": "周例会",
  "organizer_name": "张三",
  "room_name": "会议室A",
  "start_time": "2026-05-20 10:00:00",
  "end_time": "2026-05-20 11:00:00",
  "attendees": "李四,王五"
}
```

#### 更新会议

**PUT** `/api/meetings/{id}`

#### 删除会议

**DELETE** `/api/meetings/{id}`

#### 取消会议

**POST** `/api/meetings/{id}/cancel`

---

### 3.6 日程管理

#### 获取日程列表

**GET** `/api/schedules`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |

#### 创建日程

**POST** `/api/schedules`

#### 更新日程

**PUT** `/api/schedules/{id}`

#### 删除日程

**DELETE** `/api/schedules/{id}`

---

### 3.7 公告管理

#### 获取公告列表

**GET** `/api/notices`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | String | 否 | 类型 |
| status | String | 否 | 状态 |

#### 发布公告

**POST** `/api/notices`

#### 更新公告

**PUT** `/api/notices/{id}`

#### 删除公告

**DELETE** `/api/notices/{id}`

#### 标记已读

**POST** `/api/notices/{id}/read`

```json
{
  "user_id": 2
}
```

#### 获取未读数量

**GET** `/api/notices/unread-count`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 是 | 用户ID |

---

### 3.8 文档管理

#### 获取文档列表

**GET** `/api/documents`

#### 创建文档

**POST** `/api/documents`

#### 删除文档

**DELETE** `/api/documents/{id}`

#### 重命名文档

**PUT** `/api/documents/{id}/rename`

#### 移动文档

**PUT** `/api/documents/{id}/move`

---

### 3.9 资产管理

#### 获取资产列表

**GET** `/api/assets`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | String | 否 | 状态 |
| keyword | String | 否 | 搜索关键词 |

#### 创建资产

**POST** `/api/assets`

#### 更新资产

**PUT** `/api/assets/{id}`

#### 删除资产

**DELETE** `/api/assets/{id}`

#### 资产领用

**POST** `/api/assets/{id}/borrow`

```json
{
  "user_id": 3,
  "expected_return_date": "2026-06-19"
}
```

#### 资产归还

**POST** `/api/assets/{id}/return`

#### 我的资产记录

**GET** `/api/assets/my-records`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 是 | 用户ID |

---

### 3.10 交接管理

#### 获取交接列表

**GET** `/api/handovers`

#### 创建交接

**POST** `/api/handovers`

```json
{
  "title": "项目文档交接",
  "sender": "张三",
  "receiver": "李四"
}
```

#### 更新交接

**PUT** `/api/handovers/{id}`

---

## 四、人力资源模块

### 4.1 合同管理

#### 获取合同列表

**GET** `/api/hr/contracts`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Number | 否 | 用户ID |
| status | String | 否 | 状态 |

#### 获取我的合同

**GET** `/api/hr/contracts/my`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Number | 是 | 用户ID |

#### 创建合同

**POST** `/api/hr/contracts`

```json
{
  "user_id": 2,
  "contract_type": "正式",
  "start_date": "2026-01-01",
  "end_date": "2029-01-01",
  "probation_months": 3,
  "salary": 15000,
  "sign_date": "2026-01-01"
}
```

#### 更新合同

**PUT** `/api/hr/contracts/{id}`

#### 删除合同

**DELETE** `/api/hr/contracts/{id}`

---

### 4.2 薪资管理

#### 获取薪资列表

**GET** `/api/salary`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |
| month | String | 否 | 月份 |

#### 获取我的薪资

**GET** `/api/salary/my`

#### 创建薪资记录

**POST** `/api/salary`

#### 更新薪资记录

**PUT** `/api/salary/{id}`

#### 删除薪资记录

**DELETE** `/api/salary/{id}`

---

### 4.3 异动调岗

#### 获取异动列表

**GET** `/api/transfers`

#### 创建异动

**POST** `/api/transfers`

```json
{
  "user_id": 2,
  "transfer_type": "调岗",
  "from_dept": "技术部",
  "to_dept": "产品部",
  "from_position": "前端工程师",
  "to_position": "产品经理",
  "effective_date": "2026-07-01",
  "reason": "个人发展"
}
```

#### 更新异动

**PUT** `/api/transfers/{id}`

---

### 4.4 培训管理

#### 获取培训列表

**GET** `/api/trainings`

#### 创建培训

**POST** `/api/trainings`

```json
{
  "training_name": "React高级培训",
  "training_type": "技能培训",
  "instructor": "张讲师",
  "start_date": "2026-07-01",
  "end_date": "2026-07-03",
  "location": "会议室A",
  "hours": 24,
  "participants": 20
}
```

#### 更新培训

**PUT** `/api/trainings/{id}`

#### 删除培训

**DELETE** `/api/trainings/{id}`

---

### 4.5 离职管理

#### 获取离职列表

**GET** `/api/offboardings`

#### 创建离职申请

**POST** `/api/offboardings`

```json
{
  "user_id": 5,
  "offboard_type": "主动辞职",
  "apply_date": "2026-06-01",
  "last_work_date": "2026-06-30",
  "reason": "个人原因"
}
```

#### 更新离职申请

**PUT** `/api/offboardings/{id}`

---

### 4.6 考勤详情

#### 获取考勤详情

**GET** `/api/attendance-detail/detail/{id}`

#### 获取月度考勤汇总

**GET** `/api/attendance-detail/summary`

#### 提交考勤申诉

**POST** `/api/attendance-detail/appeal`

```json
{
  "attendance_id": 1,
  "appeal_type": "late",
  "reason": "地铁故障导致迟到"
}
```

#### 审批申诉

**PUT** `/api/attendance-detail/appeal/{id}/approve`

```json
{
  "action": "approve",
  "remark": "同意申诉"
}
```

#### 获取待审批申诉

**GET** `/api/attendance-detail/appeals/pending`

---

### 4.7 费用报销

#### 获取报销列表

**GET** `/api/expenses`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |
| status | String | 否 | 状态 |
| type | String | 否 | 报销类型 |

#### 获取报销详情

**GET** `/api/expenses/{id}`

#### 创建报销

**POST** `/api/expenses`

```json
{
  "user_id": 2,
  "type": "差旅",
  "title": "出差报销",
  "total_amount": 3500,
  "reason": "北京出差",
  "details": [
    {
      "item_date": "2026-05-20",
      "category": "交通",
      "amount": 1500,
      "description": "高铁往返"
    }
  ]
}
```

#### 更新报销

**PUT** `/api/expenses/{id}`

#### 删除报销

**DELETE** `/api/expenses/{id}`

#### 审批通过

**POST** `/api/expenses/{id}/approve`

#### 审批拒绝

**POST** `/api/expenses/{id}/reject`

```json
{
  "remark": "发票不合规"
}
```

#### 财务核销

**POST** `/api/expenses/{id}/verify`

---

### 4.8 系统监控

#### 服务器监控

**GET** `/api/monitor/server`

#### 在线用户

**GET** `/api/monitor/online`

#### 强退用户

**POST** `/api/monitor/online/kick`

```json
{
  "userId": 3
}
```

---

### 4.9 回收站

#### 获取回收站

**GET** `/api/recycle`

#### 恢复数据

**POST** `/api/recycle/recover`

```json
{
  "id": 5,
  "type": "user"
}
```

#### 彻底删除

**POST** `/api/recycle/delete`

#### 清空回收站

**POST** `/api/recycle/clean`

---

### 4.10 操作日志

**GET** `/api/system/logs`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Number | 否 | 页码 |
| limit | Number | 否 | 每页条数 |
| username | String | 否 | 用户名筛选 |
| module | String | 否 | 模块筛选 |

---

## 五、其他接口

### 5.1 通讯录

**GET** `/api/contacts`

### 5.2 岗位列表

**GET** `/api/positions`

### 5.3 人事信息

**GET** `/api/hr`

### 5.4 消息列表

**GET** `/api/messages`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| receiver_id | Number | 是 | 接收人ID |

### 5.5 流程模板

**GET** `/api/processTemplates`

### 5.6 系统配置

**GET** `/api/system/config`

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| group | String | 否 | 配置分组 |

### 5.7 健康检查

**GET** `/api/health`

---

## 六、测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 系统管理员 |

---

**文档结束** | 版本: v1.0 | 日期: 2026-05-29
