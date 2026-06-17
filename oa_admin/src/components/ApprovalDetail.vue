<template>
  <div class="approval-detail">
    <div class="detail-header">
      <h2>审批详情</h2>
      <button class="btn btn-secondary" @click="$emit('close')">返回</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="approval">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h3>审批单号: {{ approval.approval_no }}</h3>
          <span :class="['status-badge', getStatusClass(approval.status)]">
            {{ getStatusText(approval.status) }}
          </span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>审批类型</label>
            <span>{{ approval.type }}</span>
          </div>
          <div class="info-item">
            <label>审批标题</label>
            <span>{{ approval.title }}</span>
          </div>
          <div class="info-item">
            <label>申请人</label>
            <span>{{ approval.applicant_name }}</span>
          </div>
          <div class="info-item">
            <label>所属部门</label>
            <span>{{ approval.dept_name }}</span>
          </div>
          <div class="info-item">
            <label>申请时间</label>
            <span>{{ formatDateTime(approval.create_time) }}</span>
          </div>
          <div class="info-item">
            <label>审批时间</label>
            <span>{{ approval.approved_time ? formatDateTime(approval.approved_time) : '--' }}</span>
          </div>
        </div>
      </div>

      <!-- 申请内容卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h3>申请内容</h3>
        </div>
        <div class="content-box">
          {{ approval.content || '无详细内容' }}
        </div>
      </div>

      <!-- 审批流程时间线 -->
      <div class="info-card">
        <div class="card-header">
          <h3>审批流程</h3>
        </div>
        <div class="timeline">
          <div class="timeline-item active">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-title">提交申请</div>
              <div class="timeline-desc">{{ approval.applicant_name }} 提交了审批申请</div>
              <div class="timeline-time">{{ formatDateTime(approval.create_time) }}</div>
            </div>
          </div>

          <div v-if="approval.status !== 'pending'" class="timeline-item" :class="approval.status === 'approved' ? 'success' : 'danger'">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-title">{{ approval.status === 'approved' ? '审批通过' : '审批拒绝' }}</div>
              <div class="timeline-desc">
                {{ approval.status === 'approved' ? '审批人已通过此申请' : `审批人已拒绝此申请` }}
              </div>
              <div v-if="approval.reject_reason" class="timeline-reason">
                拒绝原因: {{ approval.reject_reason }}
              </div>
              <div class="timeline-time">{{ formatDateTime(approval.approved_time) }}</div>
            </div>
          </div>

          <div v-if="approval.status === 'cancelled'" class="timeline-item warning">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-title">已撤回</div>
              <div class="timeline-desc">申请人撤回了此审批申请</div>
              <div v-if="approval.cancel_reason" class="timeline-reason">
                撤回原因: {{ approval.cancel_reason }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <!-- 待审批状态 -->
        <template v-if="approval.status === 'pending'">
          <button
            v-if="canApprove"
            class="btn btn-success"
            @click="handleApprove"
          >
            通过
          </button>
          <button
            v-if="canApprove"
            class="btn btn-danger"
            @click="showRejectDialog = true"
          >
            拒绝
          </button>
          <button
            v-if="isApplicant"
            class="btn btn-warning"
            @click="showCancelDialog = true"
          >
            撤回申请
          </button>
        </template>

        <!-- 已通过状态 -->
        <template v-if="approval.status === 'approved'">
          <div class="approved-info">
            <span class="approved-icon">✓</span>
            <span>此申请已通过</span>
          </div>
        </template>

        <!-- 已拒绝状态 -->
        <template v-if="approval.status === 'rejected'">
          <div class="rejected-info">
            <span class="rejected-icon">✗</span>
            <span>此申请已被拒绝</span>
          </div>
          <button
            v-if="isApplicant"
            class="btn btn-primary"
            @click="handleResubmit"
          >
            重新申请
          </button>
        </template>
      </div>
    </template>

    <!-- 拒绝原因对话框 -->
    <div v-if="showRejectDialog" class="modal-overlay" @click.self="showRejectDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>拒绝审批</h3>
          <button class="btn-close" @click="showRejectDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>拒绝原因 <span class="required">*</span></label>
            <textarea
              v-model="rejectReason"
              class="form-control"
              rows="4"
              placeholder="请填写拒绝原因..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRejectDialog = false">取消</button>
          <button class="btn btn-danger" @click="handleReject" :disabled="!rejectReason.trim()">
            确认拒绝
          </button>
        </div>
      </div>
    </div>

    <!-- 撤回原因对话框 -->
    <div v-if="showCancelDialog" class="modal-overlay" @click.self="showCancelDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>撤回申请</h3>
          <button class="btn-close" @click="showCancelDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>撤回原因</label>
            <textarea
              v-model="cancelReason"
              class="form-control"
              rows="4"
              placeholder="请填写撤回原因（可选）..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCancelDialog = false">取消</button>
          <button class="btn btn-warning" @click="handleCancel">
            确认撤回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { approveApproval, rejectApproval, cancelApproval } from '../api';
import { Alert, store } from '../store';

const props = defineProps<{
  approval: any;
}>();

const emit = defineEmits(['close', 'refresh']);

const loading = ref(false);
const showRejectDialog = ref(false);
const showCancelDialog = ref(false);
const rejectReason = ref('');
const cancelReason = ref('');

// 计算属性
const isApplicant = computed(() => {
  if (!props.approval) return false;
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return String(props.approval.applicant_id) === String(currentUser.id);
});

const canApprove = computed(() => {
  if (!props.approval) return false;
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  // 管理员可以审批所有
  if (currentUser.username === 'admin') return true;
  // 当前审批人可以审批
  return String(props.approval.current_approver_id) === String(currentUser.id);
});

// 通过审批
const handleApprove = async () => {
  Alert.alert('确认通过', '确定要通过此审批吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '确认通过',
      onPress: async () => {
        try {
          await approveApproval(props.approval.id || props.approval.approval_no);
          Alert.alert('成功', '审批已通过');
          emit('refresh');
        } catch (error: any) {
          Alert.alert('错误', error.message || '操作失败');
        }
      }
    }
  ]);
};

// 拒绝审批
const handleReject = async () => {
  if (!rejectReason.value.trim()) {
    Alert.alert('提示', '请填写拒绝原因');
    return;
  }

  try {
    await rejectApproval(props.approval.id || props.approval.approval_no, rejectReason.value);
    Alert.alert('成功', '审批已拒绝');
    showRejectDialog.value = false;
    rejectReason.value = '';
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '操作失败');
  }
};

// 撤回申请
const handleCancel = async () => {
  try {
    await cancelApproval(props.approval.id || props.approval.approval_no, cancelReason.value);
    Alert.alert('成功', '申请已撤回');
    showCancelDialog.value = false;
    cancelReason.value = '';
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '操作失败');
  }
};

// 重新申请
const handleResubmit = () => {
  Alert.alert('提示', '即将跳转到申请页面...');
  emit('close');
};

// 格式化日期时间
const formatDateTime = (datetime: string) => {
  if (!datetime) return '--';
  return new Date(datetime).toLocaleString('zh-CN');
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'status-warning',
    approved: 'status-success',
    rejected: 'status-danger',
    cancelled: 'status-info'
  };
  return map[status] || 'status-default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已撤回'
  };
  return map[status] || status;
};
</script>

<style scoped>
.approval-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.info-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #666;
}

.info-item span {
  font-size: 14px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-warning { background: #fff7e6; color: #faad14; }
.status-success { background: #e6f7e6; color: #52c41a; }
.status-danger { background: #fff2e8; color: #ff4d4f; }
.status-info { background: #e6f7ff; color: #1890ff; }

.content-box {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e8e8e8;
}

.timeline-item {
  position: relative;
  margin-bottom: 24px;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d9d9d9;
  border: 2px solid #fff;
}

.timeline-item.active .timeline-dot { background: #1890ff; }
.timeline-item.success .timeline-dot { background: #52c41a; }
.timeline-item.danger .timeline-dot { background: #ff4d4f; }
.timeline-item.warning .timeline-dot { background: #faad14; }

.timeline-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 13px;
  color: #666;
}

.timeline-reason {
  font-size: 13px;
  color: #ff4d4f;
  margin-top: 4px;
  padding: 8px;
  background: #fff2e8;
  border-radius: 4px;
}

.timeline-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary { background: #1890ff; color: #fff; }
.btn-secondary { background: #f0f0f0; color: #333; }
.btn-success { background: #52c41a; color: #fff; }
.btn-danger { background: #ff4d4f; color: #fff; }
.btn-warning { background: #faad14; color: #fff; }

.approved-info, .rejected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
}

.approved-info { background: #f6ffed; color: #52c41a; }
.rejected-info { background: #fff2e8; color: #ff4d4f; }

.approved-icon, .rejected-icon {
  font-size: 20px;
  font-weight: bold;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

textarea.form-control {
  resize: vertical;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}
</style>
