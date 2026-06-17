<template>
  <div class="attendance-detail">
    <div class="detail-header">
      <h2>考勤详情</h2>
      <button class="btn btn-secondary" @click="$emit('close')">返回</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="detail">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h3>{{ formatDate(detail.attend_date) }} 考勤记录</h3>
          <span :class="['status-badge', getStatusClass(detail.status)]">
            {{ getStatusText(detail.status) }}
          </span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>员工姓名</label>
            <span>{{ detail.user_name }}</span>
          </div>
          <div class="info-item">
            <label>部门</label>
            <span>{{ detail.dept_name }}</span>
          </div>
          <div class="info-item">
            <label>职位</label>
            <span>{{ detail.position_name }}</span>
          </div>
          <div class="info-item">
            <label>上班打卡</label>
            <span>{{ formatTime(detail.clock_in_time) }}</span>
          </div>
          <div class="info-item">
            <label>下班打卡</label>
            <span>{{ formatTime(detail.clock_out_time) }}</span>
          </div>
          <div class="info-item">
            <label>工作时长</label>
            <span>{{ detail.work_hours || 0 }}小时</span>
          </div>
          <div class="info-item">
            <label>打卡地点</label>
            <span>{{ detail.clock_in_location || detail.clock_out_location || '--' }}</span>
          </div>
        </div>
      </div>

      <!-- 工资影响卡片 -->
      <div class="info-card" v-if="detail.salaryImpact">
        <div class="card-header">
          <h3>工资影响</h3>
        </div>
        <div :class="['salary-impact', detail.salaryImpact.type]">
          <div class="impact-icon">
            {{ detail.salaryImpact.type === 'bonus' ? '💰' : detail.salaryImpact.type === 'penalty' ? '⚠️' : '✅' }}
          </div>
          <div class="impact-info">
            <div class="impact-amount">
              {{ detail.salaryImpact.type === 'bonus' ? '+' : '' }}{{ detail.salaryImpact.amount }}元
            </div>
            <div class="impact-desc">{{ detail.salaryImpact.description }}</div>
          </div>
        </div>
      </div>

      <!-- 处罚记录卡片 -->
      <div class="info-card" v-if="detail.penalties && detail.penalties.length > 0">
        <div class="card-header">
          <h3>处罚记录</h3>
        </div>
        <div class="penalty-list">
          <div v-for="penalty in detail.penalties" :key="penalty.id" class="penalty-item">
            <div class="penalty-info">
              <div class="penalty-type">{{ getPenaltyTypeText(penalty.type) }}</div>
              <div class="penalty-desc">{{ penalty.description }}</div>
              <div class="penalty-amount">处罚金额: {{ penalty.amount }}元</div>
            </div>
            <div class="penalty-status">
              <span :class="['status-badge', getPenaltyStatusClass(penalty.status)]">
                {{ getPenaltyStatusText(penalty.status) }}
              </span>
              <button
                v-if="penalty.status === 'pending'"
                class="btn btn-primary btn-sm"
                @click="openAppealDialog(penalty)"
              >
                申诉
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 申诉记录卡片 -->
      <div class="info-card" v-if="detail.appeals && detail.appeals.length > 0">
        <div class="card-header">
          <h3>申诉记录</h3>
        </div>
        <div class="appeal-list">
          <div v-for="appeal in detail.appeals" :key="appeal.id" class="appeal-item">
            <div class="appeal-info">
              <div class="appeal-type">{{ getAppealTypeText(appeal.type) }}</div>
              <div class="appeal-reason">{{ appeal.reason }}</div>
              <div class="appeal-time">提交时间: {{ formatDateTime(appeal.createTime) }}</div>
            </div>
            <div class="appeal-status">
              <span :class="['status-badge', getAppealStatusClass(appeal.status)]">
                {{ getAppealStatusText(appeal.status) }}
              </span>
              <div v-if="appeal.approveRemark" class="approve-remark">
                审批备注: {{ appeal.approveRemark }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button
          v-if="canAppeal"
          class="btn btn-primary"
          @click="openAppealDialog(null)"
        >
          提交申诉
        </button>
        <button
          v-if="hasPendingAppeals"
          class="btn btn-warning"
          @click="goToApproval"
        >
          前往审批
        </button>
      </div>
    </template>

    <!-- 申诉对话框 -->
    <div v-if="showAppealDialog" class="modal-overlay" @click.self="closeAppealDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h3>提交考勤申诉</h3>
          <button class="btn-close" @click="closeAppealDialog">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>申诉类型</label>
            <select v-model="appealForm.type" class="form-control">
              <option value="late">迟到申诉</option>
              <option value="early">早退申诉</option>
              <option value="absent">缺勤申诉</option>
            </select>
          </div>
          <div class="form-group">
            <label>申诉原因</label>
            <textarea
              v-model="appealForm.reason"
              class="form-control"
              rows="4"
              placeholder="请详细说明申诉原因..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAppealDialog">取消</button>
          <button class="btn btn-primary" @click="submitAppeal" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交申诉' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAttendanceDetail, submitAttendanceAppeal } from '../api';
import { Alert } from '../store';

const props = defineProps<{
  attendanceId: string;
}>();

const emit = defineEmits(['close', 'goToApproval']);

const loading = ref(true);
const detail = ref<any>(null);
const showAppealDialog = ref(false);
const submitting = ref(false);
const appealForm = ref({
  type: 'late',
  reason: ''
});

// 计算属性
const canAppeal = computed(() => {
  if (!detail.value) return false;
  const hasPendingPenalty = detail.value.penalties?.some((p: any) => p.status === 'pending');
  const hasNoPendingAppeal = !detail.value.appeals?.some((a: any) => a.status === 'pending');
  return hasPendingPenalty && hasNoPendingAppeal;
});

const hasPendingAppeals = computed(() => {
  if (!detail.value) return false;
  return detail.value.appeals?.some((a: any) => a.status === 'pending');
});

// 加载数据
const loadDetail = async () => {
  loading.value = true;
  try {
    const res = await getAttendanceDetail(props.attendanceId);
    detail.value = res;
  } catch (error: any) {
    Alert.alert('错误', error.message || '加载考勤详情失败');
  } finally {
    loading.value = false;
  }
};

// 打开申诉对话框
const openAppealDialog = (penalty: any) => {
  if (penalty) {
    appealForm.value.type = penalty.type;
  }
  showAppealDialog.value = true;
};

// 关闭申诉对话框
const closeAppealDialog = () => {
  showAppealDialog.value = false;
  appealForm.value = { type: 'late', reason: '' };
};

// 提交申诉
const submitAppeal = async () => {
  if (!appealForm.value.reason.trim()) {
    Alert.alert('提示', '请填写申诉原因');
    return;
  }

  submitting.value = true;
  try {
    await submitAttendanceAppeal({
      attendance_id: props.attendanceId,
      appeal_type: appealForm.value.type,
      reason: appealForm.value.reason
    });
    Alert.alert('成功', '申诉提交成功，等待审批');
    closeAppealDialog();
    loadDetail(); // 重新加载数据
  } catch (error: any) {
    Alert.alert('错误', error.message || '申诉提交失败');
  } finally {
    submitting.value = false;
  }
};

// 前往审批
const goToApproval = () => {
  emit('goToApproval');
};

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('zh-CN');
};

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '--:--';
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 格式化日期时间
const formatDateTime = (datetime: string) => {
  if (!datetime) return '--';
  return new Date(datetime).toLocaleString('zh-CN');
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    normal: 'status-success',
    late: 'status-warning',
    early: 'status-warning',
    late_early: 'status-danger',
    absent: 'status-danger',
    out_of_range: 'status-info'
  };
  return map[status] || 'status-default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    normal: '正常',
    late: '迟到',
    early: '早退',
    late_early: '迟到+早退',
    absent: '缺勤',
    out_of_range: '外勤打卡'
  };
  return map[status] || status;
};

// 获取处罚类型文本
const getPenaltyTypeText = (type: string) => {
  const map: Record<string, string> = {
    late: '迟到处罚',
    early: '早退处罚',
    absent: '缺勤处罚',
    overtime: '加班奖励'
  };
  return map[type] || type;
};

// 获取处罚状态样式类
const getPenaltyStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'status-warning',
    appealed: 'status-info',
    approved: 'status-success',
    rejected: 'status-danger'
  };
  return map[status] || 'status-default';
};

// 获取处罚状态文本
const getPenaltyStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    appealed: '已申诉',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return map[status] || status;
};

// 获取申诉类型文本
const getAppealTypeText = (type: string) => {
  const map: Record<string, string> = {
    late: '迟到申诉',
    early: '早退申诉',
    absent: '缺勤申诉'
  };
  return map[type] || type;
};

// 获取申诉状态样式类
const getAppealStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'status-warning',
    approved: 'status-success',
    rejected: 'status-danger'
  };
  return map[status] || 'status-default';
};

// 获取申诉状态文本
const getAppealStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return map[status] || status;
};

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.attendance-detail {
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

.status-success { background: #e6f7e6; color: #52c41a; }
.status-warning { background: #fff7e6; color: #faad14; }
.status-danger { background: #fff2e8; color: #ff4d4f; }
.status-info { background: #e6f7ff; color: #1890ff; }

.salary-impact {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
}

.salary-impact.bonus { background: #f6ffed; }
.salary-impact.penalty { background: #fff2e8; }
.salary-impact.normal { background: #f0f0f0; }

.impact-icon {
  font-size: 32px;
}

.impact-amount {
  font-size: 20px;
  font-weight: bold;
}

.salary-impact.bonus .impact-amount { color: #52c41a; }
.salary-impact.penalty .impact-amount { color: #ff4d4f; }

.penalty-list, .appeal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.penalty-item, .appeal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.penalty-type, .appeal-type {
  font-weight: 500;
  margin-bottom: 4px;
}

.penalty-desc, .appeal-reason {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.penalty-amount, .appeal-time {
  font-size: 12px;
  color: #999;
}

.approve-remark {
  font-size: 12px;
  color: #666;
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
.btn-warning { background: #faad14; color: #fff; }
.btn-sm { padding: 4px 8px; font-size: 12px; }

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
