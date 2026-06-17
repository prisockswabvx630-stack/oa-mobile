export interface AlertButton {
  text: string;
  onPress?: (val?: string) => void;
  style?: 'cancel' | 'default' | 'destructive';
}

export interface Employee {
  id: string;
  name: string;
  gender: string;
  dept: string;
  role: string;
  position: string;
  phone: string;
  status: string;
  hrStatus: string;
  createTime: string;
  joinDate: string;
  contractEnd: string;
  userId?: number;
  idCard?: string;
  address?: string;
  currentAddress?: string;
  school?: string;
  major?: string;
}

export interface Attendance {
  date: string;
  empId: string;
  clockIn: string;
  clockOut: string;
  workHours: string;
  status: string;
  clockInLocation?: string;
  clockOutLocation?: string;
  clockInDevice?: string;
  clockOutDevice?: string;
}

export interface Todo {
  id: number;
  title: string;
  time: string;
  type: string;
  status?: string;
  priority?: string;
  assignee?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  owner: string;
  dept: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  priority: '高' | '中' | '低';
  taskCount: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploader: string;
  dept: string;
  updateTime: string;
  permission: string;
  remark?: string;
  viewCount: number;
  downloadCount: number;
}

export interface Performance {
  empId: string;
  name: string;
  dept: string;
  workScore: number;
  attitudeScore: number;
  teamworkScore: number;
  totalScore: number;
  grade: string;
}

export interface Salary {
  empId: string;
  name: string;
  dept: string;
  baseSalary: number;
  allowance: number;
  bonus: number;
  socialSec: number;
  housingFund: number;
  tax: number;
  netPay: number;
  status: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  model: string;
  user: string;
  dept: string;
  purchaseDate: string;
  status: string;
}

export interface Handover {
  id: number;
  title: string;
  sender: string;
  receiver: string;
  createTime: string;
  progress: number;
  status: string;
}

export interface Notice {
  id: number;
  title: string;
  type: string;
  publisher: string;
  scope: string;
  publishTime: string;
  reads: number;
  status: string;
}

export interface Activity {
  id: number;
  text: string;
  time: string;
}

export interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  content?: string;
  applicant: string;
  dept: string;
  time: string;
  status: '待审批' | '已通过' | '已拒绝' | '已撤回';
  reject_reason?: string;
  cancel_reason?: string;
  approved_time?: string;
}

export interface TemplateItem {
  name: string;
  code: string;
  scope: string;
  nodes: string;
  status: '启用' | '停用';
  createTime: string;
}

export interface MeetingItem {
  id: number;
  meetingNo?: string;
  title: string;
  room: string;
  organizer: string;
  startTime: string;
  endTime: string;
  attendees: number;
  status: '进行中' | '未开始' | '已取消' | '已结束';
  minutes?: string;
  cancelReason?: string;
  externalPlatform?: string;
  externalMeetingUrl?: string;
  externalMeetingId?: string;
}

export interface ScheduleItem {
  id: number;
  date: string;
  time: string;
  title: string;
  location: string;
  duration?: string;
  attendees?: number;
  color: 'purple' | 'yellow' | 'green';
}

export interface TaskItem {
  id: number;
  name: string;
  description?: string;
  project: string;
  owner: string;
  creator?: string;
  priority: '高' | '中' | '低';
  deadline: string;
  progress: number;
  status: '已完成' | '进行中' | '待开始' | '已逾期';
}

export interface Contract {
  id: string;
  empId: string;
  empName: string;
  dept: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  salary: string;
  status: string;
  signDate: string;
  remark: string;
}

export interface Transfer {
  id: string;
  empId: string;
  empName: string;
  type: string;
  fromDept: string;
  toDept: string;
  fromPosition: string;
  toPosition: string;
  effectiveDate: string;
  reason: string;
  approver: string;
  status: string;
  createTime: string;
}

export interface Training {
  id: string;
  name: string;
  type: string;
  instructor: string;
  startDate: string;
  endDate: string;
  location: string;
  hours: number;
  participants: number;
  status: string;
  score?: number;
  remark: string;
}

export interface Offboarding {
  id: string;
  empId: string;
  empName: string;
  dept: string;
  position: string;
  type: string;
  applyDate: string;
  lastWorkDate: string;
  reason: string;
  handoverStatus: string;
  approver: string;
  status: string;
  archiveStatus: string;
  createTime: string;
}
