import { apiGet, apiPost, apiPut, apiDelete } from './client';

// ========== 通讯录 ==========
export const fetchContacts = () => apiGet('/contacts');

// ========== 消息 ==========
export const fetchMessages = (receiverId?: number) =>
  apiGet('/messages', receiverId ? { receiver_id: receiverId } : undefined);

// ========== 审批 ==========
export const fetchApprovals = (params?: { status?: string; applicant_id?: number }) =>
  apiGet('/approvals', params as any);

export const createApproval = (body: any) =>
  apiPost('/approvals', body);

export const updateApproval = (id: number | string, body: any) =>
  apiPut(`/approvals/${id}`, body);

export const deleteApproval = (id: number | string) =>
  apiDelete(`/approvals/${id}`);

// ========== 任务 ==========
export const fetchTasks = (params?: { assignee_id?: number; status?: string }) =>
  apiGet('/tasks', params as any);

export const createTask = (body: any) =>
  apiPost('/tasks', body);

export const updateTask = (id: number | string, body: any) =>
  apiPut(`/tasks/${id}`, body);

export const deleteTask = (id: number | string) =>
  apiDelete(`/tasks/${id}`);

// ========== 考勤 ==========
export const fetchAttendance = (params?: { user_id?: number; date?: string }) =>
  apiGet('/attendance', params as any);

export const clockIn = (payload: { user_id: number; latitude?: number; longitude?: number; device?: string; wifiName?: string; wifiMac?: string }) =>
  apiPost('/attendance/clock-in', payload);

export const clockOut = (payload: { user_id: number; latitude?: number; longitude?: number; device?: string; wifiName?: string; wifiMac?: string }) =>
  apiPost('/attendance/clock-out', payload);

export const unbindDevice = (payload: { user_id: number }) =>
  apiPost('/attendance/unbind-device', payload);

// ========== 考勤详情 ==========
export const fetchAttendanceDetail = (id: number | string) =>
  apiGet(`/attendance-detail/detail/${id}`);

export const fetchAttendanceSummary = () =>
  apiGet('/attendance-detail/summary');

export const submitAttendanceAppeal = (payload: { attendance_id: number | string; appeal_type: string; reason: string; attachments?: string }) =>
  apiPost('/attendance-detail/appeal', payload);

export const fetchPendingAppeals = () =>
  apiGet('/attendance-detail/appeals/pending');

// ========== 薪资 ==========
export const fetchSalary = (params?: { user_id?: number; month?: string }) =>
  apiGet('/salary', params as any);

// ========== 文档 ==========
export const fetchDocuments = () => apiGet('/documents');

export const deleteDocument = (id: number | string) =>
  apiDelete(`/documents/${id}`);

// ========== HR 员工 ==========
export const fetchEmployees = () => apiGet('/hr/employees');

// ========== 公告 ==========
export const fetchNotices = () => apiGet('/notices');

export const createNotice = (body: any) =>
  apiPost('/notices', body);

// ========== 项目 ==========
export const fetchProjects = () => apiGet('/projects');

export const createProject = (body: any) =>
  apiPost('/projects', body);

export const updateProject = (id: number | string, body: any) =>
  apiPut(`/projects/${id}`, body);

export const deleteProject = (id: number | string) =>
  apiDelete(`/projects/${id}`);

// ========== 会议 ==========
export const fetchMeetings = (params?: { status?: string }) =>
  apiGet('/meetings', params as any);

export const createMeeting = (body: any) =>
  apiPost('/meetings', body);

export const updateMeeting = (id: number | string, body: any) =>
  apiPut(`/meetings/${id}`, body);

export const deleteMeeting = (id: number | string) =>
  apiDelete(`/meetings/${id}`);

// ========== 日程 ==========
export const fetchSchedules = (params?: { user_id?: number }) =>
  apiGet('/schedules', params as any);

export const createSchedule = (body: any) =>
  apiPost('/schedules', body);

export const updateSchedule = (id: number | string, body: any) =>
  apiPut(`/schedules/${id}`, body);

export const deleteSchedule = (id: number | string) =>
  apiDelete(`/schedules/${id}`);

// ========== 资产 ==========
export const fetchAssets = () => apiGet('/assets');

// ========== 工作交接 ==========
export const fetchHandovers = () => apiGet('/handovers');

// ========== 登录 ==========
export const login = (username: string, password: string) =>
  apiPost('/auth/login', { username, password });

// ========== 费用报销 ==========
export const fetchExpenses = (params?: { user_id?: number | string; status?: string; type?: string }) =>
  apiGet('/expenses', params as any);

export const fetchExpenseDetail = (id: number | string) =>
  apiGet(`/expenses/${id}`);

export const createExpense = (body: any) =>
  apiPost('/expenses', body);

export const updateExpense = (id: number | string, body: any) =>
  apiPut(`/expenses/${id}`, body);

export const deleteExpense = (id: number | string) =>
  apiDelete(`/expenses/${id}`);

export const changePassword = (id: number | string, body: { oldPassword: string; newPassword: string }) =>
  apiPost(`/users/${id}/change-password`, body);

export const markMessageAsRead = (id: number | string) =>
  apiPut(`/messages/${id}/read`);

// ========== 审批补充 ==========
export const approveApproval = (id: number | string) =>
  apiPut(`/approvals/${id}/approve`);

export const rejectApproval = (id: number | string, reason?: string) =>
  apiPut(`/approvals/${id}/reject`, { reason });

export const cancelApproval = (id: number | string, reason?: string) =>
  apiPut(`/approvals/${id}/cancel`, { reason });

// ========== 任务补充 ==========
export const completeTask = (id: number | string) =>
  apiPost(`/tasks/${id}/complete`);

export const assignTask = (id: number | string, body: { assigneeName: string }) =>
  apiPost(`/tasks/${id}/assign`, body);

// ========== 会议补充 ==========
export const fetchMeetingRooms = () => apiGet('/meetings/rooms');

export const fetchMeetingDetail = (id: number | string) =>
  apiGet(`/meetings/${id}`);

// ========== 公告补充 ==========
export const fetchNoticeDetail = (id: number | string) =>
  apiGet(`/notices/${id}`);

export const withdrawNotice = (id: number | string) =>
  apiPut(`/notices/${id}/withdraw`);

export const deleteNotice = (id: number | string) =>
  apiDelete(`/notices/${id}`);

// ========== 文档补充 ==========
export const createDocument = (body: any) =>
  apiPost('/documents', body);

export const updateDocument = (id: number | string, body: any) =>
  apiPut(`/documents/${id}`, body);

export const viewDocument = (id: number | string) =>
  apiPost(`/documents/${id}/view`);

export const downloadDocument = (id: number | string) =>
  apiPost(`/documents/${id}/download`);

// ========== 资产补充 ==========
export const createAsset = (body: any) =>
  apiPost('/assets', body);

export const updateAsset = (id: number | string, body: any) =>
  apiPut(`/assets/${id}`, body);

export const deleteAsset = (id: number | string) =>
  apiDelete(`/assets/${id}`);

// ========== 工作交接补充 ==========
export const createHandover = (body: any) =>
  apiPost('/handovers', body);

export const updateHandover = (id: number | string, body: any) =>
  apiPut(`/handovers/${id}`, body);

// ========== 用户管理 ==========
export const fetchUsers = () => apiGet('/users');

export const createUser = (body: any) =>
  apiPost('/users', body);

export const updateUser = (id: number | string, body: any) =>
  apiPut(`/users/${id}`, body);

export const deleteUser = (id: number | string) =>
  apiDelete(`/users/${id}`);

export const resetUserPassword = (id: number | string) =>
  apiPost(`/users/${id}/reset-password`);

// ========== 部门/职位 ==========
export const fetchDepartments = () => apiGet('/departments');

export const createDepartment = (body: any) =>
  apiPost('/departments', body);

export const updateDepartment = (id: number | string, body: any) =>
  apiPut(`/departments/${id}`, body);

export const deleteDepartment = (id: number | string) =>
  apiDelete(`/departments/${id}`);

export const fetchPositions = () => apiGet('/positions');

export const createPosition = (body: any) =>
  apiPost('/positions', body);

export const updatePosition = (id: number | string, body: any) =>
  apiPut(`/positions/${id}`, body);

export const deletePosition = (id: number | string) =>
  apiDelete(`/positions/${id}`);

// ========== 员工详情 ==========
export const fetchEmployeeDetail = (id: number | string) =>
  apiGet(`/hr/employees/${id}`);

export const updateEmployee = (id: number | string, body: any) =>
  apiPut(`/hr/employees/${id}`, body);

// ========== 系统设置 ==========
export const fetchSystemSettings = () => apiGet('/system/settings');

export const updateSystemSettings = (body: any) =>
  apiPut('/system/settings', body);

// ========== 流程模板 ==========
export const fetchProcessTemplates = () => apiGet('/process-templates');

// ========== 费用报销补充 ==========
export const approveExpense = (id: number | string) =>
  apiPost(`/expenses/${id}/approve`);

export const rejectExpense = (id: number | string, remark?: string) =>
  apiPost(`/expenses/${id}/reject`, { remark });

export const verifyExpense = (id: number | string, remark?: string) =>
  apiPost(`/expenses/${id}/verify`, { remark });

// ========== 绩效管理 ==========
export const fetchPerformance = (params?: { user_id?: number; period?: string }) =>
  apiGet('/performance', params as any);

export const submitPerformance = (body: any) =>
  apiPost('/performance', body);

// ========== 合同管理 ==========
export const fetchContracts = (params?: any) =>
  apiGet('/hr/contracts', params);

export const createContract = (body: any) =>
  apiPost('/hr/contracts', body);

export const updateContract = (id: string, body: any) =>
  apiPut(`/hr/contracts/${id}`, body);

export const deleteContract = (id: string) =>
  apiDelete(`/hr/contracts/${id}`);

// ========== 异动调岗 ==========
export const fetchTransfers = (params?: any) =>
  apiGet('/transfers', params);

export const createTransfer = (body: any) =>
  apiPost('/transfers', body);

export const updateTransfer = (id: string, body: any) =>
  apiPut(`/transfers/${id}`, body);

// ========== 培训管理 ==========
export const fetchTrainings = (params?: any) =>
  apiGet('/trainings', params);

export const createTraining = (body: any) =>
  apiPost('/trainings', body);

export const updateTraining = (id: string, body: any) =>
  apiPut(`/trainings/${id}`, body);

export const deleteTraining = (id: string) =>
  apiDelete(`/trainings/${id}`);

// ========== 离职管理 ==========
export const fetchOffboardings = (params?: any) =>
  apiGet('/offboardings', params);

export const createOffboarding = (body: any) =>
  apiPost('/offboardings', body);

export const updateOffboarding = (id: string, body: any) =>
  apiPut(`/offboardings/${id}`, body);

// ========== 操作日志 ==========
export const fetchOperationLogs = (params?: any) =>
  apiGet('/system/logs', params);

// ========== 回收站 ==========
export const fetchRecycleBin = () => apiGet('/recycle');

export const recoverRecycleItem = (id: number | string, type: string) =>
  apiPost('/recycle/recover', { id, type });

export const deleteRecycleItem = (id: number | string, type: string) =>
  apiPost('/recycle/delete', { id, type });

export const cleanRecycleBin = () => apiPost('/recycle/clean');
