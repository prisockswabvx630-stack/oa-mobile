import { reactive } from 'vue';
import * as api from '../api';
import type {
  Employee,
  Attendance,
  Todo,
  Project,
  Document,
  Performance,
  Salary,
  Asset,
  Handover,
  Notice,
  Activity,
  ApprovalItem,
  TemplateItem,
  MeetingItem,
  ScheduleItem,
  TaskItem,
  Contract,
  Transfer,
  Training,
  Offboarding
} from './types';

export { Alert, alertState } from './alert';
export { Loading, loadingState } from './loading';
export type {
  Employee,
  Attendance,
  Todo,
  Project,
  Document,
  Performance,
  Salary,
  Asset,
  Handover,
  Notice,
  Activity,
  ApprovalItem,
  TemplateItem,
  MeetingItem,
  ScheduleItem,
  TaskItem,
  Contract,
  Transfer,
  Training,
  Offboarding
} from './types';

// 声明全局响应式状态
export const store = reactive({
  searchVisible: false,
  employees: [] as Employee[],
  attendance: [] as Attendance[],
  todos: [] as Todo[],
  projects: [] as Project[],
  documents: [] as Document[],
  performance: [] as Performance[],
  salary: [] as Salary[],
  assets: [] as Asset[],
  handovers: [] as Handover[],
  notices: [] as Notice[],
  activities: [] as Activity[],
  approvals: [] as ApprovalItem[],
  meetings: [] as MeetingItem[],
  schedules: [] as ScheduleItem[],
  processTemplates: [] as TemplateItem[],
  tasks: [] as TaskItem[],
  contracts: [] as Contract[],
  transfers: [] as Transfer[],
  trainings: [] as Training[],
  offboardings: [] as Offboarding[],
  systemSettings: reactive({
    systemName: '智能OA办公系统',
    logo: '默认Logo',
    version: 'v1.0.0',
    workTimeStart: '09:00',
    workTimeEnd: '18:00',
    flexTime: 15,
    latitude: 38.820564,
    longitude: 115.498772,
    radius: 300,
    wifiMac: '',
    wifiName: '',
    deviceCheck: false,
    // 公司信息
    companyLegalRep: '法定代表人',
    companyCreditCode: '',
    companyAddress: '',
    companyPhone: '',
    workLocation: '',
    payDay: '15'
  }),
  userPermissions: {
    roleCode: '',
    roleName: '',
    permissions: [] as string[]
  }
});

// 状态映射函数
const mapUserStatus = (status: number, entryDate: string | null, contractExpire: string | null): { status: string; hrStatus: string } => {
  if (status === 0) return { status: '禁用', hrStatus: '离职' };
  if (entryDate) {
    const entry = new Date(entryDate);
    const now = new Date();
    const probationEnd = new Date(entry.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (now < probationEnd) return { status: '正常', hrStatus: '试用期' };
  }
  return { status: '正常', hrStatus: '在职' };
};

const formatDate = (d: string | Date | null | undefined): string => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (d: string | Date | null | undefined): string => {
  if (!d) return '--:--';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toTimeString().slice(0, 5);
};

// ========== 从 API 加载所有数据 ==========
export const loadAllData = async () => {
  try {
    // 并行加载所有数据
    const [
      usersData,
      attendanceData,
      projectsData,
      documentsData,
      salaryData,
      assetsData,
      handoversData,
      noticesData,
      tasksData,
      settingsData,
      approvalsData,
      meetingsData,
      schedulesData,
      processTemplatesData,
      permsData,
      contractsData,
      transfersData,
      trainingsData,
      offboardingsData
    ] = await Promise.allSettled([
      api.getUsers(),
      api.getAttendance(),
      api.getProjects(),
      api.getDocuments(),
      api.getSalary(),
      api.getAssets(),
      api.getHandovers(),
      api.getNotices(),
      api.getTasks(),
      api.getSystemSettings(),
      api.getApprovals(),
      api.getMeetings(),
      api.getSchedules(),
      api.getProcessTemplates(),
      api.getCurrentPermissions(),
      api.getContracts(),
      api.getTransfers(),
      api.getTrainings(),
      api.getOffboardings()
    ]);

    // 用户 -> 员工
    if (usersData.status === 'fulfilled') {
      store.employees = (usersData.value as any).map((u: any) => {
        const { status: s, hrStatus } = mapUserStatus(u.status, u.entry_date, u.contract_expire);
        return {
          id: u.emp_no || String(u.id),
          name: u.real_name,
          gender: u.gender === 1 ? '男' : '女',
          dept: u.sys_department?.dept_name || '',
          role: u.sys_position?.pos_name || '',
          position: u.sys_position?.pos_name || '',
          phone: u.mobile,
          status: s,
          hrStatus: hrStatus,
          createTime: formatDate(u.create_time),
          joinDate: formatDate(u.entry_date),
          contractEnd: formatDate(u.contract_expire),
          userId: u.id,
          idCard: u.id_card || '',
          address: u.address || '',
          currentAddress: u.current_address || '',
          school: u.school || '',
          major: u.major || ''
        };
      });
    }

    // 构建ID到真实姓名映射
    const userMapById = new Map<string, string>();
    if (usersData.status === 'fulfilled') {
      (usersData.value as any).forEach((u: any) => {
        userMapById.set(String(u.id), u.real_name);
      });
    }

    // 考勤
    if (attendanceData.status === 'fulfilled') {
      store.attendance = (attendanceData.value as any).map((a: any) => {
        const emp = store.employees.find(e => e.id === String(a.user_id));
        const statusMap: Record<string, string> = {
          normal: '正常',
          late: '迟到',
          early: '早退',
          late_early: '迟到+早退',
          absent: '缺勤',
          out_of_range: '外勤打卡'
        };
        return {
          date: formatDate(a.attend_date),
          empId: emp?.id || String(a.user_id),
          clockIn: formatTime(a.clock_in_time),
          clockOut: formatTime(a.clock_out_time),
          workHours: a.work_hours ? `${a.work_hours}h` : '--',
          status: statusMap[a.status] || a.status,
          clockInLocation: a.clock_in_location || '',
          clockOutLocation: a.clock_out_location || '',
          clockInDevice: a.clock_in_device || '',
          clockOutDevice: a.clock_out_device || ''
        };
      });
    }

    // 项目
    if (projectsData.status === 'fulfilled') {
      store.projects = (projectsData.value as any).map((p: any) => ({
        id: Number(p.id),
        name: p.project_name,
        description: p.description || '',
        owner: p.manager_name || '',
        dept: p.dept_name || '',
        startDate: formatDate(p.start_date),
        endDate: formatDate(p.end_date),
        progress: p.progress || 0,
        status: p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : p.status === 'pending' ? '未开始' : p.status,
        priority: p.priority === 'high' ? '高' : p.priority === 'low' ? '低' : '中',
        taskCount: p.task_count || 0
      }));
    }

    // 文档
    if (documentsData.status === 'fulfilled') {
      store.documents = (documentsData.value as any).map((d: any) => ({
        id: `DOC${String(d.id).padStart(3, '0')}`,
        name: d.doc_name,
        type: d.doc_type?.toUpperCase() || 'PDF',
        size: d.file_size ? `${(Number(d.file_size) / 1024).toFixed(0)}KB` : '--',
        uploader: d.uploader_name || '',
        dept: d.dept_name || '总公司',
        updateTime: formatDate(d.update_time || d.create_time),
        permission: d.scope === 'all' ? '全员可见' : d.scope === 'dept' ? '部门可见' : '项目组',
        remark: d.remark || '',
        viewCount: Number(d.view_count || 0),
        downloadCount: Number(d.download_count || 0)
      }));
    }

    // 薪资
    if (salaryData.status === 'fulfilled') {
      store.salary = (salaryData.value as any).map((s: any) => {
        const emp = store.employees.find(e => String(e.userId) === String(s.user_id));
        const dept = emp?.dept || '';
        const baseSalary = Number(s.base_salary);
        const allowance = Number(s.position_allowance) + Number(s.meal_allowance || 0) + Number(s.transport_allowance || 0);
        const bonus = Number(s.performance_bonus) || 0;
        const socialSec = Number(s.social_security) || 0;
        const housingFund = Number(s.housing_fund) || 0;
        const tax = Number(s.income_tax) || 0;
        const netPay = Number(s.net_salary) || (baseSalary + allowance + bonus - socialSec - housingFund - tax);

        return {
          empId: emp?.id || String(s.user_id),
          name: emp?.name || '',
          dept: dept,
          baseSalary,
          allowance,
          bonus,
          socialSec,
          housingFund,
          tax,
          netPay,
          status: s.status === 'paid' ? '已发放' : '未发放'
        };
      });
    }

    // 资产
    if (assetsData.status === 'fulfilled') {
      store.assets = (assetsData.value as any).map((a: any) => ({
        id: a.asset_no,
        name: a.asset_name,
        category: a.category,
        model: a.model || '',
        user: a.user_name || '-',
        dept: a.dept_name || '-',
        purchaseDate: formatDate(a.purchase_date),
        status: a.status === 'in_use' ? '在用' : a.status === 'idle' ? '闲置' : a.status === 'scrapped' ? '报废' : a.status
      }));
    }

    // 工作交接
    if (handoversData.status === 'fulfilled') {
      store.handovers = (handoversData.value as any).map((h: any) => ({
        id: Number(h.id),
        title: h.title,
        sender: h.initiator_name || '',
        receiver: h.receiver_name || '',
        createTime: formatDate(h.create_time),
        progress: h.progress || 0,
        status: h.status === 'pending' ? '待确认' : h.status === 'in_progress' ? '交接中' : h.status === 'completed' ? '已完成' : h.status
      }));
    }

    // 公告
    if (noticesData.status === 'fulfilled') {
      store.notices = (noticesData.value as any).map((n: any) => ({
        id: Number(n.id),
        title: n.title,
        type: n.type === 'company' ? '公司公告' : '部门通知',
        publisher: '',
        scope: n.scope === 'all' ? '全员' : '部门可见',
        publishTime: formatDate(n.publish_time || n.create_time),
        reads: n.view_count || 0,
        status: n.status === 'published' ? '已发布' : n.status === 'withdrawn' ? '已撤回' : n.status
      }));
    }

    // 任务 -> 待办（只显示待开始和进行中的任务）
    if (tasksData.status === 'fulfilled') {
      store.todos = (tasksData.value as any)
        .filter((t: any) => t.status === 'pending' || t.status === 'in_progress')
        .slice(0, 5)
        .map((t: any, i: number) => ({
          id: i + 1,
          title: t.title || '未命名任务',
          time: t.create_time || '',
          type: 'task',
          status: t.status === 'in_progress' ? '进行中' : '待开始',
          priority: t.priority === 'high' ? '高' : (t.priority === 'medium' ? '中' : '低'),
          assignee: t.assignee_name || ''
        }));
    }

    // 系统设置
    if (settingsData.status === 'fulfilled') {
      const s = settingsData.value as any;
      store.systemSettings.systemName = s.systemName;
      store.systemSettings.logo = s.logo;
      store.systemSettings.version = s.version;
      store.systemSettings.workTimeStart = s.workTimeStart;
      store.systemSettings.workTimeEnd = s.workTimeEnd;
      store.systemSettings.flexTime = s.flexTime;
      store.systemSettings.latitude = s.latitude;
      store.systemSettings.longitude = s.longitude;
      store.systemSettings.radius = s.radius;
      store.systemSettings.wifiMac = s.wifiMac;
      store.systemSettings.wifiName = s.wifiName;
      store.systemSettings.deviceCheck = s.deviceCheck;
      // 公司信息
      store.systemSettings.companyLegalRep = s.companyLegalRep || '法定代表人';
      store.systemSettings.companyCreditCode = s.companyCreditCode || '';
      store.systemSettings.companyAddress = s.companyAddress || '';
      store.systemSettings.companyPhone = s.companyPhone || '';
      store.systemSettings.workLocation = s.workLocation || '';
      store.systemSettings.payDay = s.payDay || '15';
    }

    // 审批数据加载
    if (approvalsData.status === 'fulfilled') {
      store.approvals = (approvalsData.value as any).map((a: any) => ({
        id: a.approval_no || String(a.id),
        type: a.type || '请假',
        title: a.title || '',
        content: a.content || '',
        applicant: a.applicant_name || '管理员',
        dept: a.dept_name || '技术部',
        time: formatDate(a.create_time) + ' ' + formatTime(a.create_time),
        status: a.status === 'approved' ? '已通过' : (a.status === 'rejected' ? '已拒绝' : (a.status === 'cancelled' ? '已撤回' : '待审批')),
        reject_reason: a.reject_reason || '',
        cancel_reason: a.cancel_reason || '',
        approved_time: a.approved_time ? (formatDate(a.approved_time) + ' ' + formatTime(a.approved_time)) : ''
      }));
    }

    // 会议数据加载
    if (meetingsData.status === 'fulfilled') {
      store.meetings = (meetingsData.value as any).map((m: any) => ({
        id: Number(m.id),
        meetingNo: m.meeting_no || '',
        title: m.title,
        room: m.room_name || '',
        organizer: m.organizer_name || userMapById.get(String(m.organizer_id)) || '管理员',
        startTime: formatDate(m.start_time) + ' ' + formatTime(m.start_time),
        endTime: formatDate(m.end_time) + ' ' + formatTime(m.end_time),
        attendees: Number(m.attendees || 0),
        status: m.status === 'ongoing' ? '进行中' : (m.status === 'cancelled' ? '已取消' : (m.status === 'ended' ? '已结束' : '未开始')),
        minutes: m.minutes || '',
        cancelReason: m.cancel_reason || '',
        externalPlatform: m.external_platform || '',
        externalMeetingUrl: m.external_meeting_url || '',
        externalMeetingId: m.external_meeting_id || ''
      }));
    }

    // 日程数据加载
    if (schedulesData.status === 'fulfilled') {
      store.schedules = (schedulesData.value as any).map((s: any) => {
        const diffMin = Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000);
        let duration = '';
        if (diffMin > 0) {
          if (diffMin < 60) {
            duration = `${diffMin}分钟`;
          } else {
            duration = `${(diffMin / 60).toFixed(1).replace('.0', '')}小时`;
          }
        }
        return {
          id: Number(s.id),
          date: formatDate(s.start_time),
          time: formatTime(s.start_time),
          title: s.title,
          location: s.location,
          duration: duration || undefined,
          attendees: s.attendees ? Number(s.attendees) : undefined,
          color: s.type || 'purple'
        };
      });
    }

    // 流程模板数据加载
    if (processTemplatesData.status === 'fulfilled') {
      store.processTemplates = (processTemplatesData.value as any).map((pt: any) => ({
        name: pt.template_name,
        code: pt.template_code,
        scope: pt.scope,
        nodes: pt.nodes,
        status: pt.status === 1 ? '启用' : '停用',
        createTime: formatDate(pt.create_time)
      }));
    }

    // 任务数据加载
    if (tasksData.status === 'fulfilled') {
      store.tasks = (tasksData.value as any).map((t: any) => ({
        id: Number(t.id),
        name: t.title,
        description: t.description || '',
        project: t.project_name || '智能OA系统',
        owner: t.assignee_name || '管理员',
        creator: t.creator_name || '',
        priority: t.priority === 'high' ? '高' : (t.priority === 'medium' ? '中' : '低'),
        deadline: formatDate(t.due_date),
        progress: Number(t.progress || 0),
        status: t.status === 'completed' ? '已完成' : (t.status === 'in_progress' ? '进行中' : (t.status === 'overdue' ? '已逾期' : '待开始'))
      }));
    }

    // 活动日志
    store.activities = [
      { id: 1, text: "系统 已从数据库加载最新数据", time: "刚刚" }
    ];

    // 绩效（暂无API，从员工数据初始化）
    store.performance = store.employees.map(emp => ({
      empId: emp.id,
      name: emp.name,
      dept: emp.dept,
      workScore: 80,
      attitudeScore: 80,
      teamworkScore: 80,
      totalScore: 80,
      grade: 'B'
    }));

    // 合同
    if (contractsData.status === 'fulfilled') {
      store.contracts = (contractsData.value as any).map((c: any) => ({
        id: c.contract_no || String(c.id),
        empId: c.emp_no || String(c.user_id),
        empName: c.user_name || c.emp_name || '',
        dept: c.dept_name || '',
        type: c.contract_type || '固定期限',
        startDate: formatDate(c.start_date),
        endDate: formatDate(c.end_date),
        duration: c.start_date && c.end_date ? (() => {
          const months = Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / (30 * 24 * 60 * 60 * 1000));
          return months >= 12 ? `${Math.round(months / 12)}年` : `${months}个月`;
        })() : '',
        salary: c.salary || '',
        status: c.status === 'active' ? '生效中' : c.status === 'expired' ? '已到期' : c.status === 'pending' ? '待签署' : c.status === 'renewed' ? '已续签' : c.status,
        signDate: formatDate(c.sign_date),
        remark: c.remark || ''
      }));
    }

    // 异动调岗
    if (transfersData.status === 'fulfilled') {
      store.transfers = (transfersData.value as any).map((t: any) => ({
        id: t.transfer_no || String(t.id),
        empId: t.emp_no || String(t.user_id),
        empName: t.emp_name || '',
        type: t.transfer_type || '调岗',
        fromDept: t.from_dept || '',
        toDept: t.to_dept || '',
        fromPosition: t.from_position || '',
        toPosition: t.to_position || '',
        effectiveDate: formatDate(t.effective_date),
        reason: t.reason || '',
        approver: t.approver_name || '',
        status: t.status === 'pending' ? '待审批' : t.status === 'approved' ? '已通过' : t.status === 'rejected' ? '已拒绝' : t.status === 'effective' ? '已生效' : t.status,
        createTime: formatDate(t.create_time)
      }));
    }

    // 培训
    if (trainingsData.status === 'fulfilled') {
      store.trainings = (trainingsData.value as any).map((t: any) => ({
        id: t.training_no || String(t.id),
        name: t.training_name || t.name,
        type: t.training_type || '技能培训',
        instructor: t.instructor || '',
        startDate: formatDate(t.start_date),
        endDate: formatDate(t.end_date),
        location: t.location || '',
        hours: Number(t.hours) || 0,
        participants: Number(t.participants) || 0,
        status: t.status === 'not_started' ? '未开始' : t.status === 'in_progress' ? '进行中' : t.status === 'completed' ? '已完成' : t.status === 'cancelled' ? '已取消' : t.status,
        score: t.score,
        remark: t.remark || ''
      }));
    }

    // 离职
    if (offboardingsData.status === 'fulfilled') {
      store.offboardings = (offboardingsData.value as any).map((o: any) => ({
        id: o.offboard_no || String(o.id),
        empId: o.emp_no || String(o.user_id),
        empName: o.emp_name || '',
        dept: o.dept_name || '',
        position: o.position_name || '',
        type: o.offboard_type || '主动辞职',
        applyDate: formatDate(o.apply_date),
        lastWorkDate: formatDate(o.last_work_date),
        reason: o.reason || '',
        handoverStatus: o.handover_status === 'pending' ? '未交接' : o.handover_status === 'in_progress' ? '交接中' : o.handover_status === 'completed' ? '已交接' : o.handover_status || '未交接',
        approver: o.approver_name || '',
        status: o.status === 'pending' ? '待审批' : o.status === 'reviewing' ? '审批中' : o.status === 'approved' ? '已通过' : o.status === 'completed' ? '已完成' : o.status === 'rejected' ? '已拒绝' : o.status,
        archiveStatus: o.archive_status === 'archived' ? '已归档' : '未归档',
        createTime: formatDate(o.create_time)
      }));
    }

    // 加载当前用户权限
    if (permsData && permsData.status === 'fulfilled') {
      const p = permsData.value as any;
      store.userPermissions.roleCode = p.roleCode || '';
      store.userPermissions.roleName = p.roleName || '';
      store.userPermissions.permissions = p.permissions || [];
    }

  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

export const loadUserPermissions = async () => {
  try {
    const res: any = await api.getCurrentPermissions();
    if (res) {
      store.userPermissions.roleCode = res.roleCode || '';
      store.userPermissions.roleName = res.roleName || '';
      store.userPermissions.permissions = res.permissions || [];
    }
  } catch (error) {
    console.error('加载当前用户权限失败:', error);
  }
};

export const getStats = (selectedDate?: string) => {
  const now = new Date();
  const date = selectedDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const activeEmps = store.employees.filter(e => e.hrStatus !== '离职');
  const totalEmployees = activeEmps.length;

  const todayAtt = store.attendance.filter(a => a.date === date);
  const presentCount = todayAtt.filter(a => ['正常', '进行中', '迟到'].includes(a.status)).length;

  return {
    totalEmployees,
    presentCount,
    attendanceRate: totalEmployees > 0 ? ((presentCount / totalEmployees) * 100).toFixed(1) : "0",
    pendingApprovals: store.approvals.filter(a => a.status === '待审批').length,
    activeProjects: store.projects.filter(p => p.status === '进行中').length
  };
};

// 导出所有actions
export * from './actions';
