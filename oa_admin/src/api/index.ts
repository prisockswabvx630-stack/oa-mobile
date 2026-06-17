import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 请求拦截器：携带 JWT Token
api.interceptors.request.use(
  config => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    const data = response.data;
    if (data.code === 200) {
      return data.data;
    }
    return Promise.reject(new Error(data.msg || data.error || '请求失败'));
  },
  error => Promise.reject(error)
);

// ========== 用户 ==========
export const getUsers = () => api.get('/users');

// ========== 部门 ==========
export const getDepartments = () => api.get('/departments');

// ========== 职位 ==========
export const getPositions = () => api.get('/positions');

// ========== 通讯录 ==========
export const getContacts = () => api.get('/contacts');

// ========== 公告 ==========
export const getNotices = () => api.get('/notices');

// ========== 消息 ==========
export const getMessages = (receiverId?: number) =>
  api.get('/messages', { params: receiverId ? { receiver_id: receiverId } : {} });

// ========== 审批 ==========
export const getApprovals = (params?: { status?: string; applicant_id?: number }) =>
  api.get('/approvals', { params });

// ========== 任务 ==========
export const getTasks = (params?: { assignee_id?: number; status?: string }) =>
  api.get('/tasks', { params });

// ========== 考勤 ==========
export const getAttendance = (params?: { user_id?: number; date?: string }) =>
  api.get('/attendance', { params });
export const clockIn = (data: { user_id?: number; latitude?: number; longitude?: number; device?: string; wifiName?: string; wifiMac?: string }) =>
  api.post('/attendance/clock-in', data);
export const clockOut = (data: { user_id?: number; latitude?: number; longitude?: number; device?: string; wifiName?: string; wifiMac?: string }) =>
  api.post('/attendance/clock-out', data);

// ========== 考勤详情 ==========
export const getAttendanceDetail = (id: string | number) =>
  api.get(`/attendance-detail/detail/${id}`);
export const getAttendanceSummary = () =>
  api.get('/attendance-detail/summary');
export const submitAttendanceAppeal = (data: { attendance_id: string | number; appeal_type: string; reason: string; attachments?: string }) =>
  api.post('/attendance-detail/appeal', data);
export const approveAttendanceAppeal = (id: string | number, data: { action: 'approve' | 'reject'; remark?: string }) =>
  api.put(`/attendance-detail/appeal/${id}/approve`, data);
export const getPendingAppeals = () =>
  api.get('/attendance-detail/appeals/pending');

// ========== 外勤审核 ==========
export const getFieldworkPending = (params?: { page?: number; pageSize?: number; start_date?: string; end_date?: string }) =>
  api.get('/attendance/fieldwork-pending', { params });
export const reviewFieldwork = (id: string | number, data: { review_status: 'approved' | 'rejected'; final_status?: string; remark?: string }) =>
  api.put(`/attendance/fieldwork-review/${id}`, data);
export const getFieldworkStats = () =>
  api.get('/attendance/fieldwork-stats');

// ========== 薪资 ==========
export const getSalary = (params?: { user_id?: number; month?: string }) =>
  api.get('/salary', { params });

// ========== 文档 ==========
export const getDocuments = () => api.get('/documents');

// ========== HR 员工 ==========
export const getHrEmployees = () => api.get('/hr/employees');

// ========== 项目 ==========
export const getProjects = () => api.get('/projects');

// ========== 会议 ==========
export const getMeetings = (params?: { status?: string }) =>
  api.get('/meetings', { params });

// ========== 日程 ==========
export const getSchedules = (params?: { user_id?: number }) =>
  api.get('/schedules', { params });

// ========== 资产 ==========
export const getAssets = () => api.get('/assets');

// ========== 工作交接 ==========
export const getHandovers = () => api.get('/handovers');

// ========== 登录 ==========
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

// ========== 用户 / 员工管理 ==========
export const createUser = (data: any) => api.post('/users', data);
export const updateUser = (id: string | number, data: any) => api.put(`/users/${id}`, data);
export const resetUserPassword = (id: string | number) => api.post(`/users/${id}/reset-password`);
export const deleteUser = (id: string | number) => api.delete(`/users/${id}`);

// ========== 项目管理 ==========
export const createProject = (data: any) => api.post('/projects', data);
export const updateProject = (id: string | number, data: any) => api.put(`/projects/${id}`, data);
export const deleteProject = (id: string | number) => api.delete(`/projects/${id}`);
export const getProjectStats = (id: string | number) => api.get(`/projects/${id}/stats`);

// ========== 文档管理 ==========
export const createDocument = (data: any) => api.post('/documents', data);
export const updateDocument = (id: string | number, data: any) => api.put(`/documents/${id}`, data);
export const deleteDocument = (id: string | number) => api.delete(`/documents/${id}`);
export const viewDocument = (id: string | number) => api.post(`/documents/${id}/view`);
export const downloadDocument = (id: string | number) => api.post(`/documents/${id}/download`);

// ========== 薪资管理 ==========
export const updateSalary = (empId: string | number, data: any) => api.put(`/salary/${empId}`, data);

// ========== 资产管理 ==========
export const createAsset = (data: any) => api.post('/assets', data);
export const updateAsset = (id: string | number, data: any) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id: string | number) => api.delete(`/assets/${id}`);

// ========== 交接管理 ==========
export const createHandover = (data: any) => api.post('/handovers', data);
export const updateHandover = (id: string | number, data: any) => api.put(`/handovers/${id}`, data);

// ========== 公告管理 ==========
export const createNotice = (data: any) => api.post('/notices', data);
export const withdrawNotice = (id: string | number) => api.put(`/notices/${id}/withdraw`);
export const deleteNotice = (id: string | number) => api.delete(`/notices/${id}`);

// ========== 系统设置 ==========
export const getSystemSettings = () => api.get('/system/settings');
export const updateSystemSettings = (data: any) => api.put('/system/settings', data);

// ========== 任务管理 ==========
export const createTask = (data: any) => api.post('/tasks', data);
export const updateTask = (id: string | number, data: any) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id: string | number) => api.delete(`/tasks/${id}`);
export const completeTask = (id: string | number) => api.post(`/tasks/${id}/complete`);
export const assignTask = (id: string | number, data: { assigneeName: string }) => api.post(`/tasks/${id}/assign`, data);

// ========== 审批管理 ==========
export const createApproval = (data: any) => api.post('/approvals', data);
export const updateApproval = (id: string | number, data: any) => api.put(`/approvals/${id}`, data);
export const deleteApproval = (id: string | number) => api.delete(`/approvals/${id}`);
export const approveApproval = (id: string | number) => api.put(`/approvals/${id}/approve`);
export const rejectApproval = (id: string | number, reason?: string) => api.put(`/approvals/${id}/reject`, { reason });
export const cancelApproval = (id: string | number, reason?: string) => api.put(`/approvals/${id}/cancel`, { reason });

// ========== 会议管理 ==========
export const createMeeting = (data: any) => api.post('/meetings', data);
export const updateMeeting = (id: string | number, data: any) => api.put(`/meetings/${id}`, data);
export const deleteMeeting = (id: string | number) => api.delete(`/meetings/${id}`);
export const getMeetingRooms = () => api.get('/meetings/rooms');
export const getMeetingDetail = (id: string | number) => api.get(`/meetings/${id}`);
export const syncMeetingToTencent = (id: string | number) => api.post(`/meetings/${id}/sync-tencent`);
export const syncMeetingToDingtalk = (id: string | number) => api.post(`/meetings/${id}/sync-dingtalk`);

// ========== 日程管理 ==========
export const createSchedule = (data: any) => api.post('/schedules', data);
export const updateSchedule = (id: string | number, data: any) => api.put(`/schedules/${id}`, data);
export const deleteSchedule = (id: string | number) => api.delete(`/schedules/${id}`);

// ========== 流程模板管理 ==========
export const getProcessTemplates = () => api.get('/process-templates');
export const createProcessTemplate = (data: any) => api.post('/process-templates', data);
export const updateProcessTemplate = (id: string | number, data: any) => api.put(`/process-templates/${id}`, data);
export const deleteProcessTemplate = (id: string | number) => api.delete(`/process-templates/${id}`);

// ========== 操作日志 ==========
export const getOperationLogs = (params: any) => api.get('/system/logs', { params });

// ========== 系统监控 ==========
export const getServerMonitor = () => api.get('/monitor/server');
export const getOnlineUsers = () => api.get('/monitor/online');
export const kickOnlineUser = (userId: string | number) => api.post('/monitor/online/kick', { userId });

// ========== 统一回收站 ==========
export const getRecycleBin = () => api.get('/recycle');
export const recoverRecycleItem = (id: string | number, type: string) => api.post('/recycle/recover', { id, type });
export const deleteRecycleItem = (id: string | number, type: string) => api.post('/recycle/delete', { id, type });
export const cleanRecycleBin = () => api.post('/recycle/clean');

// ========== 费用报销 ==========
export const getExpenses = (params?: { user_id?: number | string; status?: string; type?: string }) =>
  api.get('/expenses', { params });
export const getExpenseDetail = (id: string | number) => api.get(`/expenses/${id}`);
export const createExpense = (data: any) => api.post('/expenses', data);
export const updateExpense = (id: string | number, data: any) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id: string | number) => api.delete(`/expenses/${id}`);
export const approveExpense = (id: string | number) => api.post(`/expenses/${id}/approve`);
export const rejectExpense = (id: string | number, remark?: string) => api.post(`/expenses/${id}/reject`, { remark });
export const verifyExpense = (id: string | number, remark?: string) => api.post(`/expenses/${id}/verify`, { remark });

// ========== 角色与权限 ==========
export const getActiveRoles = (): Promise<any> => api.get('/roles/all');
export const getPermissionTree = (): Promise<any> => api.get('/permissions/tree');
export const getRolePermissions = (roleId: string | number): Promise<any> => api.get(`/roles/${roleId}/permissions`);
export const updateRolePermissions = (roleId: string | number, permissionIds: number[]): Promise<any> => api.post(`/roles/${roleId}/permissions`, { permissionIds });
export const getCurrentPermissions = (): Promise<any> => api.get('/auth/permissions');

// ========== 合同管理 ==========
export const getContracts = (params?: any) => api.get('/hr/contracts', { params });
export const createContract = (data: any) => api.post('/hr/contracts', data);
export const updateContract = (id: string, data: any) => api.put(`/hr/contracts/${id}`, data);
export const deleteContract = (id: string) => api.delete(`/hr/contracts/${id}`);
export const batchGenerateContracts = () => api.post('/hr/contracts/batch-generate');

// ========== 异动调岗 ==========
export const getTransfers = (params?: any) => api.get('/transfers', { params });
export const createTransfer = (data: any) => api.post('/transfers', data);
export const updateTransfer = (id: string, data: any) => api.put(`/transfers/${id}`, data);

// ========== 培训管理 ==========
export const getTrainings = (params?: any) => api.get('/trainings', { params });
export const createTraining = (data: any) => api.post('/trainings', data);
export const updateTraining = (id: string, data: any) => api.put(`/trainings/${id}`, data);
export const deleteTraining = (id: string) => api.delete(`/trainings/${id}`);

// ========== 离职管理 ==========
export const getOffboardings = (params?: any) => api.get('/offboardings', { params });
export const createOffboarding = (data: any) => api.post('/offboardings', data);
export const updateOffboarding = (id: string, data: any) => api.put(`/offboardings/${id}`, data);

export default api;

