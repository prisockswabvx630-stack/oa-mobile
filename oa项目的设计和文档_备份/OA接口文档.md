# 智能OA系统 API接口文档

## 基本信息

| 项目 | 说明 |
|------|------|
| 接口协议 | HTTP |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 访问地址 | http://localhost:3000 |
| 技术栈 | Node.js + Express + Prisma + MySQL |

## 统一响应格式

### 成功响应
```json
{
  "code": 200,
  "data": {},
  "msg": "success"
}
```

### 错误响应
```json
{
  "code": 500,
  "error": "错误信息"
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 参数错误 |
| 500 | 系统错误 |

## 枚举值说明

### 用户状态
| 值 | 说明 |
|----|------|
| 0 | 禁用 |
| 1 | 正常 |

### 性别
| 值 | 说明 |
|----|------|
| 0 | 女 |
| 1 | 男 |

### 审批类型
| 值 | 说明 |
|----|------|
| leave | 请假 |
| expense | 报销 |
| travel | 出差 |
| overtime | 加班 |
| purchase | 采购 |
| seal | 用章 |

### 审批状态
| 值 | 说明 |
|----|------|
| pending | 待审批 |
| approved | 已通过 |
| rejected | 已拒绝 |
| cancelled | 已撤销 |

### 任务状态
| 值 | 说明 |
|----|------|
| pending | 待处理 |
| in_progress | 进行中 |
| completed | 已完成 |
| overdue | 已逾期 |

### 任务优先级
| 值 | 说明 |
|----|------|
| high | 高 |
| medium | 中 |
| low | 低 |

### 资产状态
| 值 | 说明 |
|----|------|
| idle | 空闲 |
| in_use | 使用中 |
| maintenance | 维修中 |
| scrapped | 已报废 |

### 考勤状态
| 值 | 说明 |
|----|------|
| normal | 正常 |
| late | 迟到 |
| early | 早退 |
| late_early | 迟到早退 |
| absent | 缺勤 |
| leave | 请假 |

---

## 认证模块

### 用户登录

**接口地址：** `POST /api/auth/login`

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
    "token": "eyJhbGciOiJIUzM4NCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "real_name": "系统管理员"
    }
  },
  "msg": "登录成功"
}
```

### 用户登出

**接口地址：** `POST /api/auth/logout`

---

## 系统管理模块

### 用户管理

#### 获取用户列表
**接口地址：** `GET /api/users`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | String | 否 | 搜索关键词（用户名/姓名/手机） |

#### 获取用户详情
**接口地址：** `GET /api/users/{id}`

#### 创建用户
**接口地址：** `POST /api/users`

**请求参数：**
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
**接口地址：** `PUT /api/users/{id}`

#### 删除用户
**接口地址：** `DELETE /api/users/{id}`

#### 重置密码
**接口地址：** `POST /api/users/{id}/reset-password`

**说明：** 密码重置为默认密码 `123456`

---

### 部门管理

#### 获取部门树
**接口地址：** `GET /api/departments/tree`

#### 获取部门列表
**接口地址：** `GET /api/departments`

#### 创建部门
**接口地址：** `POST /api/departments`

#### 更新部门
**接口地址：** `PUT /api/departments/{id}`

#### 删除部门
**接口地址：** `DELETE /api/departments/{id}`

---

### 角色管理

#### 获取角色列表
**接口地址：** `GET /api/roles`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleName | String | 否 | 角色名称 |

#### 获取所有角色
**接口地址：** `GET /api/roles/all`

#### 创建角色
**接口地址：** `POST /api/roles`

#### 更新角色
**接口地址：** `PUT /api/roles/{id}`

#### 删除角色
**接口地址：** `DELETE /api/roles/{id}`

#### 分配权限
**接口地址：** `POST /api/roles/{id}/permissions`

**请求参数：** `[1, 2, 3, 5]` （权限ID数组）

#### 获取角色权限
**接口地址：** `GET /api/roles/{id}/permissions`

---

### 权限管理

#### 获取权限树
**接口地址：** `GET /api/permissions/tree`

#### 获取所有权限
**接口地址：** `GET /api/permissions`

#### 创建权限
**接口地址：** `POST /api/permissions`

#### 更新权限
**接口地址：** `PUT /api/permissions/{id}`

#### 删除权限
**接口地址：** `DELETE /api/permissions/{id}`

---

## 办公管理模块

### 考勤管理

#### 上班打卡
**接口地址：** `POST /api/attendance/clock-in`

**请求参数：**
```json
{
  "user_id": 1,
  "location": "公司总部",
  "device": "iPhone 15 Pro"
}
```

#### 下班打卡
**接口地址：** `POST /api/attendance/clock-out`

**请求参数：**
```json
{
  "user_id": 1
}
```

#### 考勤记录
**接口地址：** `GET /api/attendance`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |

#### 考勤统计
**接口地址：** `GET /api/attendance/stats`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |
| month | String | 否 | 月份（YYYY-MM） |

---

### 审批管理

#### 获取审批列表
**接口地址：** `GET /api/approvals`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | String | 否 | 审批类型 |
| status | String | 否 | 状态 |
| applicant_id | Number | 否 | 申请人ID |

#### 提交审批
**接口地址：** `POST /api/approvals`

**请求参数：**
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
**接口地址：** `PUT /api/approvals/{id}/approve`

#### 审批拒绝
**接口地址：** `PUT /api/approvals/{id}/reject`

**请求参数：**
```json
{
  "reason": "申请理由不充分"
}
```

#### 撤销审批
**接口地址：** `PUT /api/approvals/{id}/cancel`

#### 待办列表
**接口地址：** `GET /api/approvals/todos`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| approver_id | Number | 是 | 审批人ID |

---

### 任务管理

#### 获取任务列表
**接口地址：** `GET /api/tasks`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| assignee_id | Number | 否 | 执行人ID |
| status | String | 否 | 状态 |

#### 创建任务
**接口地址：** `POST /api/tasks`

**请求参数：**
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
**接口地址：** `PUT /api/tasks/{id}`

#### 删除任务
**接口地址：** `DELETE /api/tasks/{id}`

#### 完成任务
**接口地址：** `POST /api/tasks/{id}/complete`

#### 分配任务
**接口地址：** `POST /api/tasks/{id}/assign`

**请求参数：**
```json
{
  "assigneeName": "李四"
}
```

---

### 项目管理

#### 获取项目列表
**接口地址：** `GET /api/projects`

#### 创建项目
**接口地址：** `POST /api/projects`

#### 更新项目
**接口地址：** `PUT /api/projects/{id}`

#### 删除项目
**接口地址：** `DELETE /api/projects/{id}`

---

### 会议管理

#### 获取会议列表
**接口地址：** `GET /api/meetings`

#### 创建会议
**接口地址：** `POST /api/meetings`

**请求参数：**
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
**接口地址：** `PUT /api/meetings/{id}`

#### 删除会议
**接口地址：** `DELETE /api/meetings/{id}`

#### 取消会议
**接口地址：** `POST /api/meetings/{id}/cancel`

---

### 日程管理

#### 获取日程列表
**接口地址：** `GET /api/schedules`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |

#### 创建日程
**接口地址：** `POST /api/schedules`

#### 更新日程
**接口地址：** `PUT /api/schedules/{id}`

#### 删除日程
**接口地址：** `DELETE /api/schedules/{id}`

---

### 公告管理

#### 获取公告列表
**接口地址：** `GET /api/notices`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | String | 否 | 类型 |
| status | String | 否 | 状态 |

#### 发布公告
**接口地址：** `POST /api/notices`

#### 更新公告
**接口地址：** `PUT /api/notices/{id}`

#### 删除公告
**接口地址：** `DELETE /api/notices/{id}`

#### 标记已读
**接口地址：** `POST /api/notices/{id}/read`

**请求参数：**
```json
{
  "user_id": 2
}
```

#### 获取未读数量
**接口地址：** `GET /api/notices/unread-count`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 是 | 用户ID |

---

### 文档管理

#### 获取文档列表
**接口地址：** `GET /api/documents`

#### 创建文档
**接口地址：** `POST /api/documents`

#### 删除文档
**接口地址：** `DELETE /api/documents/{id}`

#### 重命名文档
**接口地址：** `PUT /api/documents/{id}/rename`

#### 移动文档
**接口地址：** `PUT /api/documents/{id}/move`

---

### 资产管理

#### 获取资产列表
**接口地址：** `GET /api/assets`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | String | 否 | 状态 |
| keyword | String | 否 | 搜索关键词 |

#### 创建资产
**接口地址：** `POST /api/assets`

#### 更新资产
**接口地址：** `PUT /api/assets/{id}`

#### 删除资产
**接口地址：** `DELETE /api/assets/{id}`

#### 资产领用
**接口地址：** `POST /api/assets/{id}/borrow`

**请求参数：**
```json
{
  "user_id": 3,
  "expected_return_date": "2026-06-19"
}
```

#### 资产归还
**接口地址：** `POST /api/assets/{id}/return`

#### 我的资产记录
**接口地址：** `GET /api/assets/my-records`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 是 | 用户ID |

---

### 交接管理

#### 获取交接列表
**接口地址：** `GET /api/handovers`

#### 创建交接
**接口地址：** `POST /api/handovers`

**请求参数：**
```json
{
  "title": "项目文档交接",
  "sender": "张三",
  "receiver": "李四"
}
```

#### 更新交接
**接口地址：** `PUT /api/handovers/{id}`

---

## 人力资源模块

### 合同管理

#### 获取合同列表
**接口地址：** `GET /api/hr/contracts`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Number | 否 | 用户ID |
| status | String | 否 | 状态 |

#### 获取我的合同
**接口地址：** `GET /api/hr/contracts/my`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Number | 是 | 用户ID |

#### 创建合同
**接口地址：** `POST /api/hr/contracts`

**请求参数：**
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
**接口地址：** `PUT /api/hr/contracts/{id}`

#### 删除合同
**接口地址：** `DELETE /api/hr/contracts/{id}`

---

### 薪资管理

#### 获取薪资列表
**接口地址：** `GET /api/salary`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | Number | 否 | 用户ID |
| month | String | 否 | 月份 |

#### 获取我的薪资
**接口地址：** `GET /api/salary/my`

#### 创建薪资记录
**接口地址：** `POST /api/salary`

#### 更新薪资记录
**接口地址：** `PUT /api/salary/{id}`

#### 删除薪资记录
**接口地址：** `DELETE /api/salary/{id}`

---

## 其他接口

### 通讯录
**接口地址：** `GET /api/contacts`

### 岗位列表
**接口地址：** `GET /api/positions`

### 人事信息
**接口地址：** `GET /api/hr`

### 消息列表
**接口地址：** `GET /api/messages`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| receiver_id | Number | 是 | 接收人ID |

### 流程模板
**接口地址：** `GET /api/processTemplates`

### 系统配置
**接口地址：** `GET /api/system/config`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| group | String | 否 | 配置分组 |

### 健康检查
**接口地址：** `GET /api/health`

---

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 系统管理员 |
