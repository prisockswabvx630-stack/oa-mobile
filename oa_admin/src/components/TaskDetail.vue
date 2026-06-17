<template>
  <div class="task-detail">
    <div class="detail-header">
      <h2>任务详情</h2>
      <button class="btn btn-secondary" @click="$emit('close')">返回</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="task">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h3>{{ task.name }}</h3>
          <div class="header-actions">
            <span :class="['status-badge', getStatusClass(task.status)]">
              {{ task.status }}
            </span>
            <span class="priority-badge" :style="{ backgroundColor: getPriorityColor(task.priority) }">
              {{ task.priority }}优先级
            </span>
          </div>
        </div>

        <div v-if="task.description" class="description-box">
          {{ task.description }}
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>所属项目</label>
            <span>{{ task.project }}</span>
          </div>
          <div class="info-item">
            <label>负责人</label>
            <span>{{ task.owner }}</span>
          </div>
          <div class="info-item">
            <label>创建者</label>
            <span>{{ task.creator || '--' }}</span>
          </div>
          <div class="info-item">
            <label>截止日期</label>
            <span :class="{ 'overdue': isOverdue }">{{ task.deadline }}</span>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-header">
            <span>任务进度</span>
            <span class="progress-value">{{ task.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: task.progress + '%', backgroundColor: getProgressColor(task.progress) }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 任务状态流转 -->
      <div class="info-card">
        <div class="card-header">
          <h3>任务状态</h3>
        </div>
        <div class="status-flow">
          <div
            v-for="(status, index) in statusFlow"
            :key="index"
            :class="['flow-item', { active: isCurrentStatus(status), completed: isCompletedStatus(status) }]"
          >
            <div class="flow-dot"></div>
            <div class="flow-label">{{ status }}</div>
            <div v-if="index < statusFlow.length - 1" class="flow-line"></div>
          </div>
        </div>
      </div>

      <!-- 操作记录 -->
      <div class="info-card">
        <div class="card-header">
          <h3>操作记录</h3>
        </div>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot active"></div>
            <div class="timeline-content">
              <div class="timeline-title">创建任务</div>
              <div class="timeline-desc">{{ task.creator || '系统' }} 创建了此任务</div>
            </div>
          </div>

          <div v-if="task.status !== '待开始'" class="timeline-item">
            <div class="timeline-dot active"></div>
            <div class="timeline-content">
              <div class="timeline-title">开始执行</div>
              <div class="timeline-desc">{{ task.owner }} 开始执行此任务</div>
            </div>
          </div>

          <div v-if="task.status === '已完成'" class="timeline-item">
            <div class="timeline-dot success"></div>
            <div class="timeline-content">
              <div class="timeline-title">任务完成</div>
              <div class="timeline-desc">{{ task.owner }} 完成了此任务</div>
            </div>
          </div>

          <div v-if="task.status === '已逾期'" class="timeline-item">
            <div class="timeline-dot danger"></div>
            <div class="timeline-content">
              <div class="timeline-title">任务逾期</div>
              <div class="timeline-desc">任务已超过截止日期</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button
          v-if="task.status === '待开始'"
          class="btn btn-primary"
          @click="handleStart"
        >
          开始任务
        </button>

        <button
          v-if="task.status === '进行中'"
          class="btn btn-success"
          @click="showProgressDialog = true"
        >
          更新进度
        </button>

        <button
          v-if="task.status === '进行中' && task.progress >= 100"
          class="btn btn-success"
          @click="handleComplete"
        >
          完成任务
        </button>

        <button
          v-if="task.status !== '已完成'"
          class="btn btn-warning"
          @click="showAssignDialog = true"
        >
          重新分配
        </button>

        <button
          class="btn btn-secondary"
          @click="$emit('edit', task)"
        >
          编辑任务
        </button>
      </div>
    </template>

    <!-- 更新进度对话框 -->
    <div v-if="showProgressDialog" class="modal-overlay" @click.self="showProgressDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>更新任务进度</h3>
          <button class="btn-close" @click="showProgressDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>当前进度: {{ progressValue }}%</label>
            <input
              type="range"
              v-model="progressValue"
              min="0"
              max="100"
              class="range-input"
            />
            <div class="progress-preview">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: progressValue + '%', backgroundColor: getProgressColor(Number(progressValue)) }"
                ></div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>进度说明</label>
            <textarea
              v-model="progressNote"
              class="form-control"
              rows="3"
              placeholder="请填写进度说明..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProgressDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleUpdateProgress">
            确认更新
          </button>
        </div>
      </div>
    </div>

    <!-- 重新分配对话框 -->
    <div v-if="showAssignDialog" class="modal-overlay" @click.self="showAssignDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>重新分配任务</h3>
          <button class="btn-close" @click="showAssignDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>当前负责人: {{ task?.owner }}</label>
          </div>
          <div class="form-group">
            <label>新负责人</label>
            <select v-model="newAssignee" class="form-control">
              <option value="">请选择</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.name">
                {{ emp.name }} ({{ emp.dept }})
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAssignDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleAssign" :disabled="!newAssignee">
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { updateTask, assignTask, completeTask } from '../api';
import { Alert, store } from '../store';

const props = defineProps<{
  task: any;
}>();

const emit = defineEmits(['close', 'refresh', 'edit']);

const loading = ref(false);
const showProgressDialog = ref(false);
const showAssignDialog = ref(false);
const progressValue = ref(0);
const progressNote = ref('');
const newAssignee = ref('');

// 状态流转
const statusFlow = ['待开始', '进行中', '已完成'];

// 计算属性
const isOverdue = computed(() => {
  if (!props.task?.deadline) return false;
  return new Date(props.task.deadline) < new Date() && props.task.status !== '已完成';
});

const employees = computed(() => store.employees.filter(e => e.hrStatus !== '离职'));

// 初始化
onMounted(() => {
  if (props.task) {
    progressValue.value = props.task.progress || 0;
  }
});

// 判断当前状态
const isCurrentStatus = (status: string) => {
  return props.task?.status === status;
};

// 判断已完成状态
const isCompletedStatus = (status: string) => {
  const statusIndex = statusFlow.indexOf(status);
  const currentIndex = statusFlow.indexOf(props.task?.status);
  return statusIndex < currentIndex;
};

// 开始任务
const handleStart = async () => {
  Alert.alert('确认开始', '确定要开始执行此任务吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '确认',
      onPress: async () => {
        try {
          await updateTask(props.task.id, { progress: 10 });
          Alert.alert('成功', '任务已开始');
          emit('refresh');
        } catch (error: any) {
          Alert.alert('错误', error.message || '操作失败');
        }
      }
    }
  ]);
};

// 更新进度
const handleUpdateProgress = async () => {
  try {
    await updateTask(props.task.id, { progress: Number(progressValue.value) });
    Alert.alert('成功', '进度已更新');
    showProgressDialog.value = false;
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '操作失败');
  }
};

// 完成任务
const handleComplete = async () => {
  Alert.alert('确认完成', '确定要将此任务标记为完成吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '确认完成',
      onPress: async () => {
        try {
          await completeTask(props.task.id);
          Alert.alert('成功', '任务已完成');
          emit('refresh');
        } catch (error: any) {
          Alert.alert('错误', error.message || '操作失败');
        }
      }
    }
  ]);
};

// 分配任务
const handleAssign = async () => {
  if (!newAssignee.value) {
    Alert.alert('提示', '请选择新负责人');
    return;
  }

  try {
    await assignTask(props.task.id, newAssignee.value);
    Alert.alert('成功', `任务已分配给 ${newAssignee.value}`);
    showAssignDialog.value = false;
    newAssignee.value = '';
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '操作失败');
  }
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    '待开始': 'status-info',
    '进行中': 'status-warning',
    '已完成': 'status-success',
    '已逾期': 'status-danger'
  };
  return map[status] || 'status-default';
};

// 获取优先级颜色
const getPriorityColor = (priority: string) => {
  const map: Record<string, string> = {
    '高': '#ff4d4f',
    '中': '#faad14',
    '低': '#52c41a'
  };
  return map[priority] || '#d9d9d9';
};

// 获取进度颜色
const getProgressColor = (progress: number) => {
  if (progress >= 100) return '#52c41a';
  if (progress >= 60) return '#1890ff';
  if (progress >= 30) return '#faad14';
  return '#ff4d4f';
};
</script>

<style scoped>
.task-detail {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-info { background: #e6f7ff; color: #1890ff; }
.status-warning { background: #fff7e6; color: #faad14; }
.status-success { background: #e6f7e6; color: #52c41a; }
.status-danger { background: #fff2e8; color: #ff4d4f; }

.priority-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.description-box {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  line-height: 1.6;
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

.overdue {
  color: #ff4d4f;
}

.progress-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-value {
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.status-flow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.flow-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #d9d9d9;
  margin-bottom: 8px;
}

.flow-item.active .flow-dot { background: #1890ff; }
.flow-item.completed .flow-dot { background: #52c41a; }

.flow-label {
  font-size: 12px;
  color: #666;
}

.flow-item.active .flow-label { color: #1890ff; font-weight: 500; }
.flow-item.completed .flow-label { color: #52c41a; }

.flow-line {
  position: absolute;
  top: 12px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: #d9d9d9;
}

.flow-item.completed .flow-line { background: #52c41a; }

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

.timeline-dot.active { background: #1890ff; }
.timeline-dot.success { background: #52c41a; }
.timeline-dot.danger { background: #ff4d4f; }

.timeline-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 13px;
  color: #666;
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
.btn-warning { background: #faad14; color: #fff; }

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

.range-input {
  width: 100%;
  margin: 8px 0;
}

.progress-preview {
  margin-top: 8px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}
</style>
