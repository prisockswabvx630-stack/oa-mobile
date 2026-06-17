<template>
  <div id="page-approval-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">审批管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreateModal">+ 发起审批</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">全部审批</div>
          <div class="stat-info-val">{{ metrics.total }}</div>
        </div>
        <div class="stat-icon-wrapper purple">📋</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">待审批</div>
          <div class="stat-info-val" style="color: var(--warning);">{{ metrics.pending }}</div>
        </div>
        <div class="stat-icon-wrapper yellow">⏳</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">已通过</div>
          <div class="stat-info-val" style="color: var(--success);">{{ metrics.approved }}</div>
        </div>
        <div class="stat-icon-wrapper green">✓</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">已拒绝</div>
          <div class="stat-info-val" style="color: var(--danger);">{{ metrics.rejected }}</div>
        </div>
        <div class="stat-icon-wrapper red">✗</div>
      </div>
    </div>

    <!-- 选项卡分类 -->
    <div class="approval-tabs">
      <div class="approval-tab" :class="{ active: currentTab === 'all' }" @click="currentTab = 'all'; currentPage = 1;">
        全部
      </div>
      <div class="approval-tab" :class="{ active: currentTab === 'pending' }" @click="currentTab = 'pending'; currentPage = 1;">
        待审批
        <span class="tab-badge" v-if="metrics.pending > 0">{{ metrics.pending }}</span>
      </div>
      <div class="approval-tab" :class="{ active: currentTab === 'approved' }" @click="currentTab = 'approved'; currentPage = 1;">
        已通过
      </div>
      <div class="approval-tab" :class="{ active: currentTab === 'rejected' }" @click="currentTab = 'rejected'; currentPage = 1;">
        已拒绝
      </div>
      <div class="approval-tab" :class="{ active: currentTab === 'cancelled' }" @click="currentTab = 'cancelled'; currentPage = 1;">
        已撤回
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>关键词:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="标题/申请人/编号">
      </div>
      <div class="filter-item">
        <label>类型:</label>
        <select class="form-control" v-model="searchType">
          <option value="">全部</option>
          <option value="请假">请假</option>
          <option value="报销">报销</option>
          <option value="出差">出差</option>
          <option value="加班">加班</option>
          <option value="采购">采购</option>
          <option value="其他">其他</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="handleSearch">🔍 搜索</button>
      <button class="btn btn-secondary" @click="handleReset">🔄 重置</button>
    </div>

    <!-- 数据列表 -->
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>审批编号</th>
            <th>类型</th>
            <th>标题</th>
            <th>申请人</th>
            <th>部门</th>
            <th>申请时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedApprovals.length === 0">
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无审批记录</td>
          </tr>
          <tr v-else v-for="item in pagedApprovals" :key="item.id">
            <td style="font-weight: 600; font-family: var(--font-title);">{{ item.id }}</td>
            <td>
              <span class="type-badge" :style="getTypeBadgeStyle(item.type) as any">{{ item.type }}</span>
            </td>
            <td style="font-weight: 500;">{{ item.title }}</td>
            <td>{{ item.applicant }}</td>
            <td>{{ item.dept }}</td>
            <td style="color: var(--text-muted); font-size: 13px;">{{ item.time }}</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(item.status)">{{ item.status }}</span>
            </td>
            <td>
              <span v-if="item.status === '待审批' && hasApprovalPermission" class="action-link" @click="openApprovalDialog(item)">审批</span>
              <span class="action-link" @click="viewDetail(item)">详情</span>
              <span v-if="item.status === '待审批' && currentUser && item.applicant === currentUser.real_name" class="action-link" @click="handleCancel(item)">撤回</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ tabFilteredApprovals.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 发起审批弹窗 -->
    <div class="modal-overlay" v-if="showCreateModal">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">发起审批</h3>
          <span class="modal-close" @click="closeCreateModal">&times;</span>
        </div>
        <form @submit.prevent="handleCreate">
          <div class="modal-body">
            <div class="form-group">
              <label>审批类型</label>
              <select class="form-control" v-model="createForm.type" style="width: 100%;" required>
                <option value="请假">请假</option>
                <option value="报销">报销</option>
                <option value="出差">出差</option>
                <option value="加班">加班</option>
                <option value="采购">采购</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <!-- 请假专属字段 -->
            <template v-if="createForm.type === '请假'">
              <div class="form-group">
                <label>请假类型</label>
                <select class="form-control" v-model="createForm.leaveType" style="width: 100%;">
                  <option value="事假">事假</option>
                  <option value="病假">病假</option>
                  <option value="年假">年假</option>
                  <option value="婚假">婚假</option>
                  <option value="产假">产假</option>
                  <option value="陪产假">陪产假</option>
                  <option value="丧假">丧假</option>
                  <option value="调休">调休</option>
                </select>
              </div>
              <div style="display: flex; gap: 12px;">
                <div class="form-group" style="flex: 1;">
                  <label>开始日期</label>
                  <input type="date" class="form-control" v-model="createForm.leaveStartDate" @change="calcLeaveDays" style="width: 100%;">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>结束日期</label>
                  <input type="date" class="form-control" v-model="createForm.leaveEndDate" @change="calcLeaveDays" style="width: 100%;">
                </div>
                <div class="form-group" style="flex: 0 0 100px;">
                  <label>天数</label>
                  <input type="number" class="form-control" v-model="createForm.leaveDays" style="width: 100%;" readonly>
                </div>
              </div>
            </template>

            <div class="form-group">
              <label>审批标题</label>
              <input type="text" class="form-control" v-model="createForm.title" style="width: 100%;" :required="createForm.type !== '请假'" :placeholder="createForm.type === '请假' ? '不填则自动生成' : '请输入审批标题'">
            </div>
            <div class="form-group">
              <label>{{ createForm.type === '请假' ? '请假事由' : '申请事由' }}</label>
              <textarea class="form-control" v-model="createForm.content" style="width: 100%; min-height: 80px; resize: vertical;" required placeholder="请详细描述申请事由..."></textarea>
            </div>
            <div class="form-group">
              <label>预计流转审批节点</label>
              <div class="workflow-preview-steps">
                <span v-for="(node, index) in getWorkflowNodes(createForm.type)" :key="index" class="preview-step">
                  <span v-if="index > 0" class="step-arrow">➔</span>
                  <span class="step-label" :class="{ highlight: node !== '发起' && node !== '归档' }">{{ node }}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeCreateModal">取消</button>
            <button type="submit" class="btn btn-primary">提交申请</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 审批处理弹窗 -->
    <div class="modal-overlay" v-if="showModal && selectedItem">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">审批处理</h3>
          <span class="modal-close" @click="closeModal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="approval-info-box">
            <p><strong>审批单号：</strong>{{ selectedItem?.id }}</p>
            <p><strong>申请人：</strong>{{ selectedItem?.applicant }} ({{ selectedItem?.dept }})</p>
            <p><strong>类型/标题：</strong>[{{ selectedItem?.type }}] {{ selectedItem?.title }}</p>
            <p><strong>申请时间：</strong>{{ selectedItem?.time }}</p>
          </div>
          <div v-if="selectedItem?.content" style="margin-top: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <span style="color: var(--text-muted); font-size: 12px; display: block; margin-bottom: 4px;">申请事由</span>
            {{ selectedItem.content }}
          </div>
          
          <!-- 流程审批节点进度 -->
          <div class="detail-workflow-flow" style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 12px; color: var(--text-title);">⛵ 流程审批节点进度</div>
            <div class="workflow-timeline-flow">
              <div 
                v-for="(node, index) in getWorkflowNodes(selectedItem.type)" 
                :key="index" 
                class="flow-node-step"
                :class="{ 
                  completed: isNodeCompleted(selectedItem.status, index),
                  active: isNodeActive(selectedItem.status, index)
                }"
              >
                <div class="node-circle">{{ index + 1 }}</div>
                <div class="node-text-label">{{ node }}</div>
              </div>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 16px;">
            <label>审批意见 (可选)</label>
            <textarea class="form-control" style="width: 100%; height: 80px; padding: 10px; resize: none;" v-model="opinion" placeholder="请输入同意或拒绝的原因..."></textarea>
          </div>
        </div>
        <div class="modal-footer" style="gap: 12px;">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-danger" @click="handleApprove(false)">拒绝</button>
          <button class="btn btn-primary" @click="handleApprove(true)">同意</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">审批详情</h3>
          <span class="modal-close" @click="closeDetailModal">&times;</span>
        </div>
        <div class="modal-body" v-if="detailItem">
          <div style="margin-bottom: 12px;">
            <button class="btn btn-primary btn-sm" @click="openFullDetail(detailItem)">查看完整详情</button>
          </div>
          <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
            <span class="type-badge" :style="getTypeBadgeStyle(detailItem.type) as any">{{ detailItem.type }}</span>
            <strong style="color: var(--text-title); font-size: 16px;">{{ detailItem.title }}</strong>
            <span class="badge" :class="getStatusBadgeClass(detailItem.status)">{{ detailItem.status }}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
            <div><span style="color: var(--text-muted);">审批编号:</span> {{ detailItem.id }}</div>
            <div><span style="color: var(--text-muted);">申请人:</span> {{ detailItem.applicant }}</div>
            <div><span style="color: var(--text-muted);">所属部门:</span> {{ detailItem.dept }}</div>
            <div><span style="color: var(--text-muted);">申请时间:</span> {{ detailItem.time }}</div>
            <div v-if="detailItem.approved_time"><span style="color: var(--text-muted);">处理时间:</span> {{ detailItem.approved_time }}</div>
          </div>
          <div v-if="detailItem.content" style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <span style="color: var(--text-muted); font-size: 12px; display: block; margin-bottom: 4px;">申请事由</span>
            {{ detailItem.content }}
          </div>
          <div v-if="detailItem.reject_reason" style="margin-top: 12px; padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 8px; font-size: 14px;">
            <span style="color: var(--danger); font-size: 12px; display: block; margin-bottom: 4px;">拒绝原因</span>
            {{ detailItem.reject_reason }}
          </div>
          <div v-if="detailItem.cancel_reason" style="margin-top: 12px; padding: 12px; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px; font-size: 14px;">
            <span style="color: var(--warning); font-size: 12px; display: block; margin-bottom: 4px;">撤回原因</span>
            {{ detailItem.cancel_reason }}
          </div>
          
          <!-- 流程审批节点进度 -->
          <div class="detail-workflow-flow" style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 12px; color: var(--text-title);">⛵ 流程审批节点进度</div>
            <div class="workflow-timeline-flow">
              <div 
                v-for="(node, index) in getWorkflowNodes(detailItem.type)" 
                :key="index" 
                class="flow-node-step"
                :class="{ 
                  completed: isNodeCompleted(detailItem.status, index),
                  active: isNodeActive(detailItem.status, index)
                }"
              >
                <div class="node-circle">{{ index + 1 }}</div>
                <div class="node-text-label">{{ node }}</div>
              </div>
            </div>
          </div>
          
        </div>
        <div class="modal-footer">
          <button v-if="detailItem?.type === '请假'" type="button" class="btn btn-primary" @click="viewLeaveDocument(detailItem)">查看请假条</button>
          <button type="button" class="btn btn-secondary" @click="closeDetailModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 完整详情弹窗 -->
    <div class="modal-overlay" v-if="showFullDetailModal">
      <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <ApprovalDetail
          :approval="selectedApproval"
          @close="showFullDetailModal = false"
          @refresh="refreshData"
        />
      </div>
    </div>

    <!-- 请假条预览弹窗 -->
    <ContractPreviewModal
      v-model:visible="showLeavePreview"
      :title="previewLeaveTitle"
      :contractHTML="previewLeaveHTML"
      :employeeName="previewLeaveName"
      contractType="请假条"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addApproval, updateApproval, cancelApproval, Alert, loadAllData } from '../store';
import type { ApprovalItem } from '../store';
import ApprovalDetail from './ApprovalDetail.vue';
import ContractPreviewModal from './ContractPreviewModal.vue';
import { generateLeaveHTML } from '../utils/leaveTemplates';
import type { LeaveTemplateData } from '../utils/leaveTemplates';

// 根据审批类型匹配流程模板
const getWorkflowNodes = (type: string): string[] => {
  const codeMap: Record<string, string> = {
    '请假': 'LEAVE',
    '报销': 'EXPENSE',
    '出差': 'TRIP',
    '加班': 'OVERTIME',
    '采购': 'PROCUREMENT'
  };
  const code = codeMap[type];
  if (!code) return ['发起', '审批', '归档'];
  
  const template = store.processTemplates.find(t => t.code === code && t.status === '启用');
  if (template) {
    const nodesStr = template.nodes;
    if (!nodesStr) return ['发起', '审批', '归档'];
    try {
      const parsed = JSON.parse(nodesStr);
      if (Array.isArray(parsed)) {
        return ['发起', ...parsed.map((n: any) => n.nodeName || n.node_name || '').filter(Boolean), '归档'];
      }
    } catch {}
    return ['发起', ...nodesStr.split(',').map(n => n.trim()).filter(Boolean), '归档'];
  }
  
  return ['发起', '审批', '归档'];
};

const isNodeCompleted = (status: string, index: number) => {
  if (status === '已通过') return true;
  if (status === '待审批') {
    return index === 0; // 仅发起完成
  }
  return false;
};

const isNodeActive = (status: string, index: number) => {
  if (status === '待审批') {
    return index === 1; // 仅当前审批节点（如主管）活跃
  }
  return false;
};

// --- 选项卡 ---
const currentTab = ref('all');

// --- 搜索过滤 ---
const searchKeyword = ref('');
const searchType = ref('');
const filterKeyword = ref('');
const filterType = ref('');
const currentPage = ref(1);
const pageSize = 10;

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterType.value = searchType.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchType.value = '';
  handleSearch();
};

const tabFilteredApprovals = computed(() => {
  let list = store.approvals;

  // 没有审批权限的人只能看到自己的审批
  if (!hasApprovalPermission.value) {
    const userName = currentUser.value?.real_name || '';
    list = list.filter(a => a.applicant === userName);
  }

  if (currentTab.value === 'pending') list = list.filter(a => a.status === '待审批');
  else if (currentTab.value === 'approved') list = list.filter(a => a.status === '已通过');
  else if (currentTab.value === 'rejected') list = list.filter(a => a.status === '已拒绝');
  else if (currentTab.value === 'cancelled') list = list.filter(a => a.status === '已撤回');

  const keyword = filterKeyword.value.trim().toLowerCase();
  const type = filterType.value;
  return list.filter(a => {
    const matchKeyword = !keyword || a.title.toLowerCase().includes(keyword) || a.applicant.toLowerCase().includes(keyword) || a.id.toLowerCase().includes(keyword);
    const matchType = !type || a.type === type;
    return matchKeyword && matchType;
  });
});

const totalPages = computed(() => Math.ceil(tabFilteredApprovals.value.length / pageSize) || 1);

const pagedApprovals = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return tabFilteredApprovals.value.slice(start, start + pageSize);
});

// --- 当前用户 ---
const currentUser = computed(() => {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
});

// --- 权限判断 ---
const isAdmin = computed(() => {
  return store.userPermissions.roleCode === 'ROLE_ADMIN' || currentUser.value?.username === 'admin';
});

const hasApprovalPermission = computed(() => {
  return isAdmin.value || store.userPermissions.permissions.includes('office:approval');
});

// --- 统计 ---
const metrics = computed(() => {
  let list = store.approvals;
  // 没有审批权限的人只统计自己的审批
  if (!hasApprovalPermission.value) {
    const userName = currentUser.value?.real_name || '';
    list = list.filter(a => a.applicant === userName);
  }
  return {
    total: list.length,
    pending: list.filter(a => a.status === '待审批').length,
    approved: list.filter(a => a.status === '已通过').length,
    rejected: list.filter(a => a.status === '已拒绝').length
  };
});

// --- 样式辅助 ---
const getTypeBadgeStyle = (type: string) => {
  const map: Record<string, object> = {
    '请假': { backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #dbeafe' },
    '报销': { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' },
    '出差': { backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5' },
    '加班': { backgroundColor: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' },
    '采购': { backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' }
  };
  return map[type] || { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' };
};

const getStatusBadgeClass = (status: string) => {
  if (status === '已通过') return 'success';
  if (status === '已拒绝') return 'danger';
  if (status === '已撤回') return 'warning';
  return 'info';
};

// --- 发起审批 ---
const showCreateModal = ref(false);
const createForm = ref({ type: '请假', title: '', content: '', leaveType: '事假', leaveStartDate: '', leaveEndDate: '', leaveDays: 0 });

// 请假预览状态
const showLeavePreview = ref(false);
const previewLeaveHTML = ref('');
const previewLeaveTitle = ref('');
const previewLeaveName = ref('');

const openCreateModal = () => {
  createForm.value = { type: '请假', title: '', content: '', leaveType: '事假', leaveStartDate: '', leaveEndDate: '', leaveDays: 0 };
  showCreateModal.value = true;
};

const closeCreateModal = () => { showCreateModal.value = false; };

// 计算请假天数
const calcLeaveDays = () => {
  const { leaveStartDate, leaveEndDate } = createForm.value;
  if (leaveStartDate && leaveEndDate) {
    const diff = Math.ceil((new Date(leaveEndDate).getTime() - new Date(leaveStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    createForm.value.leaveDays = diff > 0 ? diff : 0;
  }
};

const handleCreate = async () => {
  const user = currentUser.value;
  const emp = user ? store.employees.find(e => e.name === user.real_name || String(e.userId) === String(user.id)) : null;
  try {
    let content = createForm.value.content;
    // 如果是请假类型，将请假详细信息附加到content中
    if (createForm.value.type === '请假') {
      const leaveInfo = [
        `请假类型：${createForm.value.leaveType}`,
        `请假时间：${createForm.value.leaveStartDate} 至 ${createForm.value.leaveEndDate}`,
        `请假天数：${createForm.value.leaveDays}天`,
        `事由：${createForm.value.content}`
      ].join('\n');
      content = leaveInfo;
    }

    await addApproval({
      type: createForm.value.type,
      title: createForm.value.title || (createForm.value.type === '请假' ? `${createForm.value.leaveType}申请` : ''),
      content,
      applicant: user?.real_name || emp?.name || '当前用户',
      dept: emp?.dept || '技术部'
    });

    // 如果是请假类型，生成请假条预览
    if (createForm.value.type === '请假' && createForm.value.leaveStartDate && createForm.value.leaveEndDate) {
      const leaveData: LeaveTemplateData = {
        empName: user?.real_name || emp?.name || '当前用户',
        empId: emp?.id || '',
        dept: emp?.dept || '技术部',
        position: emp?.position || '',
        leaveType: createForm.value.leaveType,
        startDate: createForm.value.leaveStartDate,
        endDate: createForm.value.leaveEndDate,
        days: createForm.value.leaveDays,
        reason: createForm.value.content
      };
      previewLeaveHTML.value = generateLeaveHTML(leaveData);
      previewLeaveTitle.value = `请假条 - ${createForm.value.leaveType}`;
      previewLeaveName.value = leaveData.empName;
      closeCreateModal();
      showLeavePreview.value = true;
    } else {
      alert('审批申请已提交！');
      closeCreateModal();
    }
  } catch {
    alert('提交失败，请重试');
  }
};

// --- 审批处理 ---
const showModal = ref(false);
const selectedItem = ref<ApprovalItem | null>(null);
const opinion = ref('');

const openApprovalDialog = (item: ApprovalItem) => {
  const user = currentUser.value;
  const isSuperAdmin = store.userPermissions.roleCode === 'ROLE_ADMIN' || user?.username === 'admin';

  if (!isSuperAdmin) {
    let userDept = user?.sys_department?.dept_name;
    if (!userDept) {
      const emp = store.employees.find(e => String(e.userId) === String(user?.id) || e.name === user?.real_name);
      if (emp) userDept = emp.dept;
    }
    if (!userDept || userDept !== item.dept) {
      alert(`审批失败：您属于【${userDept || '未知部门'}】，无权审批【${item.dept}】部门的单据！`);
      return;
    }
  }

  selectedItem.value = item;
  opinion.value = '';
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; selectedItem.value = null; };

const handleApprove = async (isApproved: boolean) => {
  if (!selectedItem.value) return;
  try {
    const status = isApproved ? '已通过' : '已拒绝';
    await updateApproval(selectedItem.value.id, { status, reject_reason: opinion.value });
    alert(`审批操作成功！此单据已判定为：${status}。`);
  } catch {
    alert('审批操作失败，请重试');
  }
  closeModal();
};

// --- 撤回 ---
const handleCancel = async (item: ApprovalItem) => {
  Alert.prompt(
    '撤回申请',
    `请输入撤回「${item.title}」的原因（选填）：`,
    [
      { text: '取消', style: 'cancel' },
      {
        text: '确定撤回',
        style: 'destructive',
        onPress: async (reason) => {
          try {
            await cancelApproval(item.id, reason || '主动撤回');
            alert('审批已撤回！');
          } catch {
            alert('撤回失败，请重试');
          }
        }
      }
    ]
  );
};

// --- 详情 ---
const showDetailModal = ref(false);
const detailItem = ref<ApprovalItem | null>(null);

const viewDetail = (item: ApprovalItem) => {
  detailItem.value = item;
  showDetailModal.value = true;
};

const closeDetailModal = () => { showDetailModal.value = false; detailItem.value = null; };

// 查看请假条
const viewLeaveDocument = (item: ApprovalItem) => {
  const user = currentUser.value;
  const emp = user ? store.employees.find(e => e.name === user.real_name || String(e.userId) === String(user.id)) : null;
  // 解析content中的请假信息
  const content = item.content || '';
  const typeMatch = content.match(/请假类型：(.+)/);
  const timeMatch = content.match(/请假时间：(.+)/);
  const daysMatch = content.match(/请假天数：(\d+)/);
  const reasonMatch = content.match(/事由：(.+)/s);

  const leaveType = typeMatch ? typeMatch[1] : '事假';
  const timeRange = timeMatch ? timeMatch[1].split(' 至 ') : ['', ''];
  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  const reason = reasonMatch ? reasonMatch[1] : item.content || '';

  const leaveData: LeaveTemplateData = {
    empName: item.applicant,
    empId: emp?.id || '',
    dept: item.dept,
    position: emp?.position || '',
    leaveType,
    startDate: timeRange[0] || '',
    endDate: timeRange[1] || '',
    days,
    reason
  };
  previewLeaveHTML.value = generateLeaveHTML(leaveData);
  previewLeaveTitle.value = `请假条 - ${leaveType}`;
  previewLeaveName.value = item.applicant;
  showLeavePreview.value = true;
};

// --- 完整详情 ---
const showFullDetailModal = ref(false);
const selectedApproval = ref<any>(null);

const openFullDetail = (item: ApprovalItem) => {
  selectedApproval.value = item;
  showFullDetailModal.value = true;
  showDetailModal.value = false;
};

const refreshData = async () => {
  // 刷新审批数据
  await loadAllData();
  showFullDetailModal.value = false;
};
</script>

<style scoped>
.approval-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1.5px solid var(--border-color);
  margin-bottom: 24px;
  padding-bottom: 2px;
}

.approval-tab {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  transition: var(--transition);
}

.approval-tab:hover {
  color: var(--primary);
}

.approval-tab.active {
  color: var(--primary);
}

.approval-tab.active::after {
  content: '';
  position: absolute;
  bottom: -3.5px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--primary);
  border-radius: 2px;
}

.tab-badge {
  display: inline-block;
  background-color: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  text-align: center;
  line-height: 16px;
  margin-left: 4px;
  vertical-align: middle;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.approval-info-box {
  background-color: #fafbfc;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  font-size: 14px;
  line-height: 1.8;
}

/* 流程预览步骤样式 */
.workflow-preview-steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  background-color: var(--bg-secondary, #f8fafc);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.preview-step {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-arrow {
  color: var(--text-muted, #94a3b8);
  font-size: 12px;
}

.step-label {
  font-size: 13px;
  color: var(--text-body, #475569);
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
}

.step-label.highlight {
  color: var(--primary, #6358ee);
  border-color: #c7d2fe;
  background-color: #eef2ff;
  font-weight: 600;
}

/* 详情流程轴样式 */
.workflow-timeline-flow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  padding: 10px 0;
}

.workflow-timeline-flow::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 20px;
  right: 20px;
  height: 2px;
  background-color: #e2e8f0;
  z-index: 1;
}

.flow-node-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  flex: 1;
}

.node-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 2px solid #cbd5e1;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.node-text-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-top: 8px;
  text-align: center;
  transition: all 0.3s ease;
}

.flow-node-step.completed .node-circle {
  border-color: #10b981;
  background-color: #10b981;
  color: #ffffff;
}

.flow-node-step.completed .node-text-label {
  color: #10b981;
}

.flow-node-step.active .node-circle {
  border-color: #6358ee;
  background-color: #eef2ff;
  color: #6358ee;
  box-shadow: 0 0 0 3px rgba(99, 88, 238, 0.15);
}

.flow-node-step.active .node-text-label {
  color: #6358ee;
}
</style>
