# 智能OA系统架构设计方案

## 一、项目背景

基于已有的OA系统后端接口服务（Node.js + Express + Prisma + MySQL），需要开发移动端和管理后台前端，实现完整的办公自动化解决方案。

**已完成的组件：**
- 后端API服务：Node.js + Express 5 + Prisma ORM，已实现60+个接口（24个路由模块）
- 数据库设计：26张表 + 1个视图
- 接口文档：完整的REST API文档
- 原型图：管理后台HTML原型、移动端HTML原型

**技术栈迁移说明：**
- 后端已从 Java Spring Boot 迁移至 Node.js + Express + Prisma
- 所有API路径从 `/api/v1/xxx` 简化为 `/api/xxx`
- 服务端口从 8080 改为 3000

## 二、技术选型

### 2.1 移动端

| 技术    | 版本/说明                           |
| ----- | ------------------------------- |
| 框架    | React Native (通过 Expo)          |
| 开发语言  | TypeScript                      |
| 状态管理  | Redux Toolkit + RTK Query       |
| 路由    | React Navigation (Expo Router)  |
| UI组件  | React Native Paper / NativeBase |
| 网络请求  | Axios + RTK Query               |
| 本地存储  | AsyncStorage (使用 expo-storage)  |
| 地图定位  | Expo Location                   |
| 相机/相册 | expo-image-picker, expo-camera  |

### 2.2 管理后台

| 技术    | 版本/说明                     |
| ----- | ------------------------- |
| 框架    | React 18                  |
| 构建工具  | Vite 5.x                  |
| 语言    | TypeScript                |
| 状态管理  | Redux Toolkit + RTK Query |
| 路由    | React Router v6           |
| UI组件库 | Ant Design 5.x            |
| 图表    | ECharts / Recharts        |
| 表格    | Ant Design Table (支持虚拟滚动) |
| 图标    | @ant-design/icons         |
| 请求库   | Axios + RTK Query         |

### 2.3 后端服务

| 技术 | 版本/说明 |
|------|-----------|
| 运行环境 | Node.js 18+ |
| Web框架 | Express 5.x |
| ORM | Prisma 5.x |
| 数据库 | MySQL 5.7+ |
| 开发语言 | TypeScript |
| 开发热重载 | nodemon + ts-node |

### 2.4 共享依赖

| 技术 | 版本/说明 |
|------|-----------|
| 接口基地址 | http://localhost:3000 |
| 认证方式 | JWT Bearer Token |
| 数据格式 | JSON |

## 三、项目结构

### 3.1 移动端项目结构

```
oa-mobile/
├── app.json                          # Expo配置
├── assets/                           # 静态资源
│   ├── images/
│   ├── fonts/
│   └── icons/
├── src/
│   ├── components/                    # 公共组件
│   │   ├── common/                   # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/                   # 布局组件
│   │   │   ├── SafeArea.tsx
│   │   │   ├── Header.tsx
│   │   │   └── TabBar.tsx
│   │   └── business/                 # 业务组件
│   │       ├── AttendanceCard.tsx
│   │       ├── ApprovalItem.tsx
│   │       └── TaskItem.tsx
│   ├── screens/                       # 页面
│   │   ├── auth/                     # 认证页面
│   │   │   ├── LoginScreen.tsx
│   │   │   └── PasswordScreen.tsx
│   │   ├── workbench/                # 工作台
│   │   │   └── WorkbenchScreen.tsx
│   │   ├── approvals/                # 审批
│   │   │   ├── ApprovalListScreen.tsx
│   │   │   ├── ApprovalDetailScreen.tsx
│   │   │   └── CreateApprovalScreen.tsx
│   │   ├── attendance/                # 考勤
│   │   │   ├── AttendanceScreen.tsx
│   │   ├── AttendanceStatsScreen.tsx
│   │   └── ClockInScreen.tsx
│   │   ├── tasks/                     # 任务
│   │   │   ├── TaskListScreen.tsx
│   │   │   ├── TaskDetailScreen.tsx
│   │   │   └── CreateTaskScreen.tsx
│   │   ├── schedule/                  # 日程
│   │   │   └── ScheduleScreen.tsx
│   │   ├── meetings/                  # 会议
│   │   │   ├── MeetingListScreen.tsx
│   │   │   └── MeetingDetailScreen.tsx
│   │   ├── assets/                    # 资产
│   │   │   ├── AssetListScreen.tsx
│   │   └── AssetBorrowScreen.tsx
│   │   ├── announcements/             # 公告
│   │   │   ├── AnnouncementListScreen.tsx
│   │   │   └── AnnouncementDetailScreen.tsx
│   │   ├── documents/                 # 文档
│   │   │   └── DocumentListScreen.tsx
│   │   └── profile/                   # 个人中心
│   │       ├── ProfileScreen.tsx
│   │       ├── SettingsScreen.tsx
│   │       └── AboutScreen.tsx
│   ├── navigation/                    # 路由配置
│   │   ├── AppNavigator.tsx           # 底部Tab导航
│   │   ├── AuthNavigator.tsx         # 认证导航
│   │   └── RootNavigator.tsx          # 根导航
│   ├── store/                          # Redux Store
│   │   ├── index.ts
│   │   ├── slices/                   # Redux Slices
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   └── appSlice.ts
│   │   └── api/                       # RTK Query API
│   │       └── api.ts
│   ├── services/                       # API服务
│   │   ├── api.ts                     # 基础API配置
│   │   ├── authService.ts             # 认证API
│   │   ├── userService.ts             # 用户API
│   │   ├── attendanceService.ts        # 考勤API
│   │   ├── approvalService.ts          # 审批API
│   │   ├── taskService.ts             # 任务API
│   │   └── ...
│   ├── utils/                          # 工具函数
│   │   ├── request.ts                 # Axios封装
│   │   ├── storage.ts                 # 本地存储
│   │   ├── dateUtils.ts               # 日期工具
│   │   └── validator.ts               # 表单验证
│   ├── hooks/                          # 自定义Hooks
│   │   ├── useAuth.ts                  # 认证Hook
│   │   ├── useLocation.ts             # 定位Hook
│   │   └── useCamera.ts               # 相机Hook
│   ├── constants/                      # 常量
│   │   ├── api.ts                     # API地址
│   │   ├── storage.ts                 # 存储Key
│   │   └── theme.ts                   # 主题配置
│   ├── types/                          # TypeScript类型
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   └── ...
│   └── App.tsx                         # App入口
├── App.tsx                            # Expo入口
├── package.json
├── tsconfig.json
└── metro.config.js
```

### 3.2 管理后台项目结构

```
oa-admin/
├── public/                           # 公共资源
├── src/
│   ├── assets/                        # 静态资源
│   │   ├── images/
│   │   └── styles/
│   ├── components/                    # 公共组件
│   │   ├── common/                   # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Form.tsx
│   │   │   └── Upload.tsx
│   │   ├── layout/                   # 布局组件
│   │   │   ├── MainLayout.tsx           # 主布局
│   │   │   ├── Sidebar.tsx              # 侧边栏
│   │   │   ├── Header.tsx               # 顶部导航
│   │   │   └── Breadcrumb.tsx          # 面包屑
│   │   └── business/                 # 业务组件
│   │       ├── UserTable.tsx
│   │       ├── DepartmentTree.tsx
│   │       ├── RoleForm.tsx
│   │       └── ApprovalFlow.tsx
│   ├── pages/                          # 页面
│   │   ├── auth/                     # 认证
│   │   │   └── Login.tsx
│   │   ├── dashboard/                 # 仪表盘
│   │   │   └── Dashboard.tsx
│   │   ├── system/                     # 系统管理
│   │   │   ├── user/
│   │   │   │   ├── UserList.tsx
│   │   │   │   ├── UserForm.tsx
│   │   │   │   └── UserDetail.tsx
│   │   │   ├── department/
│   │   │   │   ├── DepartmentList.tsx
│   │   │   │   ├── DepartmentTree.tsx
│   │   │   │   └── DepartmentForm.tsx
│   │   │   ├── role/
│   │   │   │   ├── RoleList.tsx
│   │   │   │   ├── RoleForm.tsx
│   │   │   │   └── PermissionAssign.tsx
│   │   │   └── permission/
│   │   │       ├── PermissionList.tsx
│   │   │       ├── PermissionTree.tsx
│   │   │       └── PermissionForm.tsx
│   │   ├── office/                     # 办公管理
│   │   │   ├── attendance/
│   │   │   │   ├── AttendanceList.tsx
│   │   │   │   ├── AttendanceStats.tsx
│   │   │   │   └── AttendanceDetail.tsx
│   │   │   ├── approval/
│   │   │   │   ├── ApprovalList.tsx
│   │   │   │   ├── ApprovalDetail.tsx
│   │   │   │   └── ApprovalFlow.tsx
│   │   │   └── task/
│   │   │       ├── TaskList.tsx
│   │   │       ├── TaskForm.tsx
│   │   │       └── TaskDetail.tsx
│   │   ├── hr/                         # 人力资源
│   │   │   └── contract/
│   │   │       ├── ContractList.tsx
│   │   │       ├── ContractForm.tsx
│   │   │       └── ContractDetail.tsx
│   │   └── collaboration/              # 协作沟通
│   │       ├── announcement/
│   │       │   ├── AnnouncementList.tsx
│   │       │   ├── AnnouncementForm.tsx
│   │       │   └── AnnouncementDetail.tsx
│   │       ├── meeting/
│   │       │   ├── MeetingList.tsx
│   │       │   ├── MeetingForm.tsx
│   │       │   └── MeetingDetail.tsx
│   │       ├── asset/
│   │       │   ├── AssetList.tsx
│   │       │   ├── AssetForm.tsx
│   │       │   └── AssetRecord.tsx
│   │       └── document/
│   │           ├── DocumentList.tsx
│   │           ├── DocumentUpload.tsx
│   │           └── DocumentDetail.tsx
│   ├── store/                          # Redux Store
│   │   ├── index.ts
│   │   ├── slices/                   # Redux Slices
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   ├── appSlice.ts
│   │   │   └── settingsSlice.ts
│   │   └── api/                       # RTK Query API
│   │       ├── api.ts
│   │       ├── authApi.ts
│   │       ├── userApi.ts
│   │       └── ...
│   ├── services/                       # API服务
│   │   ├── api.ts
│   │   └── ...
│   ├── hooks/                          # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── usePermission.ts
│   │   └── useTable.ts
│   ├── utils/                          # 工具函数
│   │   ├── request.ts
│   │   ├── dateUtils.ts
│   │   └── validator.ts
│   ├── types/                          # TypeScript类型
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   └── ...
│   ├── router/                         # 路由配置
│   │   ├── index.tsx
│   │   └── routes.tsx
│   ├── App.tsx
│   └── main.tsx
├── .env.development                  # 开发环境变量
├── .env.production                   # 生产环境变量
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 四、状态管理设计

### 4.1 移动端 Redux Toolkit

**authSlice (认证状态):**
```typescript
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
}
```

**userSlice (用户信息):**
```typescript
interface UserState {
  profile: UserProfile | null;
  permissions: string[];
  notifications: number;
}
```

**appSlice (应用状态):**
```typescript
interface AppState {
  isLoading: boolean;
  networkStatus: boolean;
  currentTab: 'workbench' | 'messages' | 'contacts' | 'profile';
}
```

### 4.2 管理后台 Redux Toolkit

**authSlice (认证状态):**
```typescript
interface AuthState {
  token: string | null;
  user: AdminUser | null;
  permissions: Permission[];
  isAuthenticated: boolean;
}
```

**settingsSlice (设置状态):**
```typescript
interface SettingsState {
  collapsed: boolean;           // 侧边栏折叠
  theme: 'light' | 'dark';    // 主题
  language: 'zh' | 'en';     // 语言
  tableDensity: 'default' | 'middle' | 'small';
}
```

## 五、路由设计

### 5.1 移动端路由 (Expo Router)

```typescript
// RootNavigator.tsx
<Stack.Navigator>
  {/* 未登录 */}
  <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />

  {/* 已登录 */}
  <Stack.Screen name="Main" component={AppNavigator} options={{ headerShown: false }} />
</Stack.Navigator>

// AppNavigator.tsx (底部Tab导航)
<Tab.Navigator>
  <Tab.Screen name="workbench" component={WorkbenchScreen} options={WorkbenchOptions} />
  <Tab.Screen name="messages" component={MessagesScreen} options={MessagesOptions} />
  <Tab.Screen name="contacts" component={ContactsScreen} options={ContactsOptions} />
  <Tab.Screen name="profile" component={ProfileScreen} options={ProfileOptions} />
</Tab.Navigator>
```

### 5.2 管理后台路由 (React Router)

```typescript
// routes.tsx
const routes = [
  { path: '/login', element: <Login /> },
  { path: '/',
    element: <MainLayout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'system/user', element: <UserList /> },
      { path: 'system/user/:id', element: <UserDetail /> },
      // ... 其他路由
    ]
  }
];
```

## 六、API集成设计

### 6.1 RTK Query API配置

**baseApi.ts:**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8080/api/v1',
  prepareHeaders: async (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});
```

**authApi.ts:**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials: { username: string, password: string }) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
});
```

### 6.2 移动端API服务

**authService.ts:**
```typescript
import { authApi } from '@/store/api/authApi';

export const authService = {
  login: async (username: string, password: string) => {
    const response = await authApi.endpoints.login.initiate({
      username,
      password,
    });
    return response.data;
  },
  logout: async () => {
    await authApi.endpoints.logout.initiate();
  },
};
```

### 6.3 管理后台API服务

**authApi.ts:**
```typescript
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation({ query: () => ({ url: '/auth/login' }) }),
    logout: builder.mutation({ query: () => ({ url: '/auth/logout' }) }),
    getCurrentUser: builder.query({ query: () => ({ url: '/auth/current' }) }),
  }),
});
```

## 七、组件设计

### 7.1 移动端核心组件

**SafeArea (安全区域处理):**
```typescript
// 兼容刘海屏、底部指示条
<SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
  {/* 页面内容 */}
</SafeAreaView>
```

**Button (通用按钮):**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}
```

**AttendanceCard (考勤卡片):**
```typescript
interface AttendanceCardProps {
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  status: 'normal' | 'late' | 'early' | 'absent';
  onPress?: () => void;
}
```

**ApprovalItem (审批项):**
```typescript
interface ApprovalItemProps {
  title: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  applicant: string;
  time: string;
  onPress?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}
```

### 7.2 管理后台核心组件

**UserTable (用户表格):**
```typescript
interface UserTableProps {
  loading?: boolean;
  dataSource: User[];
  pagination?: PaginationProps;
  onEdit?: (record: User) => void;
  onDelete?: (id: number) => void;
  onResetPassword?: (id: number) => void;
}
```

**DepartmentTree (部门树):**
```typescript
interface DepartmentTreeProps {
  dataSource: Department[];
  onSelect?: (node: Department) => void;
  onAdd?: (parentId: number) => void;
  onEdit?: (node: Department) => void;
  onDelete?: (id: number) => void;
}
```

**ApprovalFlow (审批流程图):**
```typescript
interface ApprovalFlowProps {
  flowData: FlowNode[];
  status: 'pending' | 'approved' | 'rejected';
  currentUser: string;
}
```

## 八、认证流程

### 8.1 认证流程图

```
┌──────────────┐
│   移动端登录   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ 调用登录API    │
│ /auth/login      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 返回Token       │
│ Token存储到AsyncStorage  │
│ Redux状态更新   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 跳转主页面      │
│ 底部Tab导航    │
└──────────────────┘
```

### 8.2 Token管理

**Token存储:**
```typescript
// 存储到 AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  set: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  get: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  remove: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};
```

**Token自动刷新:**
```typescript
// 401错误时自动刷新token
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    const token = getState().auth.token;
    const refreshToken = getState().auth.refreshToken;

    if (token && isTokenExpired(token)) {
      const newToken = await refreshAccessToken(refreshToken);
      headers.set('Authorization', `Bearer ${newToken}`);
    } else {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});
```

## 九、API接口调用

### 9.1 移动端API调用

**获取用户列表:**
```typescript
import { useGetUsersQuery } from '@/store/api/userApi';

const UserListScreen = () => {
  const { data, isLoading, refetch } = useGetUsersQuery({ current: 1, size: 20 });

  return (
    <FlatList
      data={data?.records || []}
      refreshing={isLoading}
      onRefresh={refetch}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <UserItem key={item.id} user={item} />
      )}
    />
  );
};
```

**提交审批:**
```typescript
import { useCreateApprovalMutation } from '@/store/api/approvalApi';

const CreateApprovalScreen = () => {
  const [createApproval, { isLoading }] = useCreateApprovalMutation();

  const handleSubmit = async (formData: any) => {
    try {
      await createApproval(formData).unwrap();
      navigation.goBack();
    } catch (error) {
      message.error('提交失败');
    }
  };

  return <Form onSubmit={handleSubmit}>...</Form>;
};
```

### 9.2 管理后台API调用

**用户表格数据加载:**
```typescript
import { useGetUsersQuery, useDeleteUserMutation } from '@/store/api/userApi';

const UserList = () => {
  const [params, setParams] = useState({ current: 1, size: 10 });
  const { data, isLoading } = useGetUsersQuery(params);
  const [deleteUser] = useDeleteUserMutation();

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      onOk: async () => {
        await deleteUser(id).unwrap();
        message.success('删除成功');
        params.current = 1;
      },
    });
  };

  return (
    <Table
      dataSource={data?.records || []}
      loading={isLoading}
      pagination={{
        current: params.current,
        pageSize: params.size,
        total: data?.total || 0,
        onChange: (page, pageSize) => setParams({ current: page, size: pageSize }),
      }}
      actions={{
        render: (record) => (
          <>
            <Button size="small" onClick={() => onEdit(record)}>编辑</Button>
            <Popconfirm
              title="确定要删除吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger size="small">删除</Button>
            </Popconfirm>
          </>
        ),
      }}
    />
  );
};
```

## 十、权限控制

### 10.1 移动端权限控制

**基于角色的导航控制:**
```typescript
// AppNavigator.tsx
const role = useSelector((state: RootState) => state.auth.userInfo?.roleCode);

const WorkbenchOptions = {
  tabBarLabel: '工作台',
  tabBarIcon: ({ color }) => <WorkbenchIcon color={color} />,
  tabBarBadge: userSlice().notifications,
};
```

**组件级权限控制:**
```typescript
const hasPermission = (permissionCode: string) => {
  const permissions = useSelector((state: RootState) => state.user.permissions);
  return permissions.includes(permissionCode);
};

// 使用
<ApprovalButton hasPermission="approval:approve" />
```

### 10.2 管理后台权限控制

**路由权限控制:**
```typescript
// ProtectedRoute.tsx
const ProtectedRoute = ({ children, permission }: ProtectedRouteProps) => {
  const permissions = useSelector((state: RootState) => state.auth.permissions);

  const hasAccess = permission ? permissions.includes(permission) : true;

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

// 使用
<ProtectedRoute permission="system:user:create">
  <UserCreate />
</ProtectedRoute>
```

**按钮级权限控制:**
```typescript
const PermissionButton = ({ permission, children, ...props }: PermissionButtonProps) => {
  const permissions = useSelector((state: RootState) => state.auth.permissions);

  const hasPermission = permission ? permissions.includes(permission) : true;

  if (!hasPermission) {
    return null;
  }

  return <Button {...props}>{children}</Button>;
};
```

## 十一、样式设计

### 11.1 移动端主题配置

```typescript
// constants/theme.ts
export const theme = {
  colors: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    background: '#f5f7fa',
    surface: '#ffffff',
    text: {
      primary: '#1a1a2e',
      secondary: '#6b7280',
    },
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '600' },
    h2: { fontSize: 24, fontWeight: '600' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 14, lineHeight: 1.5 },
    caption: { fontSize: 12, color: '#9ca3af' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};
```

### 11.2 管理后台主题配置

```typescript
// Ant Design主题定制
const theme = {
  token: {
    colorPrimary: '#4f46e5',
    colorBgLayout: '#f5f7fa',
    borderRadius: 8,
    colorTextSecondary: '#6b7280',
  },
  components: {
    Layout: {
      sider: {
        background: '#1a1a2e',
        color: '#fff',
      },
  },
};
```

## 十二、开发计划

### 阶段一：项目初始化 (1-2天)

1. 创建移动端项目
   - 安装 Expo CLI
   - 初始化 Expo 项目
   - 安装必要依赖

2. 创建管理后台项目
   - 使用 Vite 创建 React 项目
   - 安装 Ant Design
   - 配置 TypeScript

3. 基础配置
   - 环境变量配置
   - 路由配置
   - Redux配置

### 阶段二：公共模块开发 (2-3天)

1. 移动端公共组件
   - Button, Input, Card, Modal, Toast
   - SafeArea, Header, TabBar

2. 管理后台公共组件
   - Button, Input, Table, Modal, Form, Upload
   - MainLayout, Sidebar, Header, Breadcrumb

### 阶段三：认证模块开发 (2-3天)

1. 移动端
   - 登录页面
   - Token管理
   - 路由守卫

2. 管理后台
   - 登录页面
   - 权限控制
   - 路由守卫

### 阶段四：核心功能开发 (7-10天)

**移动端:**
- 工作台页面 (2天)
- 审批管理 (2天)
- 考勤管理 (1天)
- 任务管理 (1天)
- 其他模块 (2天)

**管理后台:**
- 系统管理 (2天)
- 办公管理 (2天)
- 人力资源 (1天)
- 协作沟通 (1天)
- 系统设置 (1天)

### 阶段五：测试优化 (3-5天)

1. 功能测试
2. UI/UX优化
3. 性能优化
4. 兼容性测试

## 十三、关键技术点

### 13.1 移动端

1. **异步存储**: 使用 `@react-native-async-storage/async-storage`
2. **安全区域**: 使用 `SafeAreaView` 处理刘海屏
3. **键盘处理**: 使用 `KeyboardAvoidingView`
4. **手势导航**: 使用 `react-native-gesture-handler`
5. **状态保持**: 使用 `react-native-screens`

### 13.2 管理后台

1. **虚拟滚动**: 大数据量表格使用虚拟滚动
2. **表单验证**: 使用 Form + 自定义校验规则
3. **Excel导入导出**: 使用 `xlsx` 库
4. **权限控制**: 路由级 + 按钮级权限
5. **主题切换**: 支持 Light/Dark 模式

## 十四、部署方案

### 14.1 开发环境

**移动端:**
- 使用 Expo Go 开发者工具预览
- 或使用 Android Studio / Xcode 本地调试

**管理后台:**
- 使用 Vite 开发服务器
- 热加载自动更新

### 14.2 生产环境

**移动端:**
- 构建为 APK/IPA 发布
- 或使用 Expo OTA 更新

**管理后台:**
- 使用 Vite 构建静态资源
- Nginx 反向代理到 API 服务

## 十五、项目依赖

### 15.1 移动端核心依赖

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@reduxjs/toolkit": "^2.x",
    "@reduxjs/toolkit/query": "^2.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "@react-native-community/async-storage": "^1.x",
    "expo-camera": "^15.x",
    "expo-location": "^17.x",
    "axios": "^1.x",
    "react-native-paper": "^5.x",
    "@react-native-vector-icons": "^13.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-native": "^0.73.x",
    "typescript": "^5.x"
  }
}
```

### 15.2 管理后台核心依赖

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.0",
    "@reduxjs/toolkit/query": "^2.0.0",
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6",
    "axios": "^1.6.0",
    "dayjs": "^1.11.10",
    "recharts": "^2.10.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

## 十六、开发规范

### 16.1 命名规范

**文件命名:**
- 组件文件：PascalCase (例: `UserProfile.tsx`)
- 工具文件：camelCase (例: `request.ts`)
- 常量文件：UPPER_CASE (例: `API_BASE_URL.ts`)

**变量命名:**
- 组件内：camelCase
- 常量：UPPER_CASE_SNAKE_CASE

### 16.2 代码规范

**组件定义:**
```typescript
// 使用函数式组件
interface Props {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<Props> = ({ title, onAction }) => {
  return <div>{title}</div>;
};
```

**样式定义:**
```typescript
// 使用 StyleSheet
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## 十七、验收标准

### 17.1 移动端

- [ ] 支持登录登出
- [ ] 完整的Tab导航
- [ ] 考勤打卡功能
- [ ] 审批提交和审批操作
- [ ] Token自动刷新
- [ ] 网络错误处理
- [ ] 智能提示信息

### 17.2 管理后台

- [ ] 登录页面
- [ ] 侧边栏导航
- [ ] 用户管理CRUD
- [ ] 部门树形结构
- [ ] 角色权限管理
- [ ] 审批流程管理
- [ ] 数据导出功能
- [ ] 主题切换功能

---

**预计开发周期：** 15-25 个工作日
**团队规模建议：** 1人 AI 全流程开发