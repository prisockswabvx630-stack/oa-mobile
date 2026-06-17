<template>
  <div class="meeting-detail">
    <div class="detail-header">
      <h2>会议详情</h2>
      <button class="btn btn-secondary" @click="$emit('close')">返回</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="meeting">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h3>{{ meeting.title }}</h3>
          <div class="header-actions">
            <span :class="['status-badge', getStatusClass(meeting.status)]">
              {{ meeting.status }}
            </span>
            <span v-if="meeting.externalPlatform" class="platform-badge">
              {{ meeting.externalPlatform === 'tencent' ? '腾讯会议' : '钉钉' }}
            </span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>会议编号</label>
            <span>{{ meeting.meetingNo || '--' }}</span>
          </div>
          <div class="info-item">
            <label>组织者</label>
            <span>{{ meeting.organizer }}</span>
          </div>
          <div class="info-item">
            <label>会议室</label>
            <span>{{ meeting.room }}</span>
          </div>
          <div class="info-item">
            <label>参会人数</label>
            <span>{{ meeting.attendees }}人</span>
          </div>
          <div class="info-item">
            <label>开始时间</label>
            <span>{{ meeting.startTime }}</span>
          </div>
          <div class="info-item">
            <label>结束时间</label>
            <span>{{ meeting.endTime }}</span>
          </div>
        </div>
      </div>

      <!-- 会议状态流转 -->
      <div class="info-card">
        <div class="card-header">
          <h3>会议状态</h3>
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

      <!-- 外部会议平台信息 -->
      <div v-if="meeting.externalPlatform" class="info-card">
        <div class="card-header">
          <h3>外部会议平台</h3>
        </div>
        <div class="external-info">
          <div class="info-item">
            <label>平台</label>
            <span>{{ meeting.externalPlatform === 'tencent' ? '腾讯会议' : '钉钉' }}</span>
          </div>
          <div v-if="meeting.externalMeetingId" class="info-item">
            <label>会议ID</label>
            <span>{{ meeting.externalMeetingId }}</span>
          </div>
          <div v-if="meeting.externalMeetingUrl" class="info-item">
            <label>加入链接</label>
            <a :href="meeting.externalMeetingUrl" target="_blank" class="meeting-link">
              {{ meeting.externalMeetingUrl }}
            </a>
          </div>
        </div>
      </div>

      <!-- 会议纪要 -->
      <div class="info-card">
        <div class="card-header">
          <h3>会议纪要</h3>
          <button
            v-if="meeting.status === '进行中' || meeting.status === '已结束'"
            class="btn btn-primary btn-sm"
            @click="showMinutesDialog = true"
          >
            {{ meeting.minutes ? '编辑纪要' : '添加纪要' }}
          </button>
        </div>
        <div v-if="meeting.minutes" class="minutes-content">
          {{ meeting.minutes }}
        </div>
        <div v-else class="empty-minutes">
          暂无会议纪要
        </div>
      </div>

      <!-- 取消原因 -->
      <div v-if="meeting.cancelReason" class="info-card">
        <div class="card-header">
          <h3>取消原因</h3>
        </div>
        <div class="cancel-reason">
          {{ meeting.cancelReason }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <template v-if="meeting.status === '未开始'">
          <button class="btn btn-primary" @click="$emit('edit', meeting)">
            编辑会议
          </button>
          <button class="btn btn-info" @click="handleSyncTencent">
            同步腾讯会议
          </button>
          <button class="btn btn-warning" @click="handleSyncDingtalk">
            同步钉钉
          </button>
          <button class="btn btn-danger" @click="showCancelDialog = true">
            取消会议
          </button>
        </template>

        <template v-if="meeting.status === '进行中'">
          <button class="btn btn-success" @click="handleEnd">
            结束会议
          </button>
          <button class="btn btn-primary" @click="showMinutesDialog = true">
            添加纪要
          </button>
        </template>

        <template v-if="meeting.externalMeetingUrl">
          <button class="btn btn-info" @click="openExternalMeeting">
            加入会议
          </button>
        </template>
      </div>
    </template>

    <!-- 取消会议对话框 -->
    <div v-if="showCancelDialog" class="modal-overlay" @click.self="showCancelDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>取消会议</h3>
          <button class="btn-close" @click="showCancelDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>取消原因 <span class="required">*</span></label>
            <textarea
              v-model="cancelReason"
              class="form-control"
              rows="4"
              placeholder="请填写取消原因..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCancelDialog = false">取消</button>
          <button class="btn btn-danger" @click="handleCancel" :disabled="!cancelReason.trim()">
            确认取消
          </button>
        </div>
      </div>
    </div>

    <!-- 会议纪要对话框 -->
    <div v-if="showMinutesDialog" class="modal-overlay" @click.self="showMinutesDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ meeting?.minutes ? '编辑会议纪要' : '添加会议纪要' }}</h3>
          <button class="btn-close" @click="showMinutesDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>会议纪要</label>
            <textarea
              v-model="minutesContent"
              class="form-control"
              rows="6"
              placeholder="请记录会议纪要..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showMinutesDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleSaveMinutes">
            保存纪要
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { updateMeeting, syncMeetingToTencent, syncMeetingToDingtalk } from '../api';
import { Alert } from '../store';

const props = defineProps<{
  meeting: any;
}>();

const emit = defineEmits(['close', 'refresh', 'edit']);

const loading = ref(false);
const showCancelDialog = ref(false);
const showMinutesDialog = ref(false);
const cancelReason = ref('');
const minutesContent = ref('');

// 状态流转
const statusFlow = ['未开始', '进行中', '已结束'];

// 初始化
onMounted(() => {
  if (props.meeting) {
    minutesContent.value = props.meeting.minutes || '';
  }
});

// 判断当前状态
const isCurrentStatus = (status: string) => {
  return props.meeting?.status === status;
};

// 判断已完成状态
const isCompletedStatus = (status: string) => {
  const statusIndex = statusFlow.indexOf(status);
  const currentIndex = statusFlow.indexOf(props.meeting?.status);
  return statusIndex < currentIndex;
};

// 同步腾讯会议
const handleSyncTencent = async () => {
  try {
    await syncMeetingToTencent(props.meeting.id);
    Alert.alert('成功', '已同步到腾讯会议');
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '同步失败');
  }
};

// 同步钉钉
const handleSyncDingtalk = async () => {
  try {
    await syncMeetingToDingtalk(props.meeting.id);
    Alert.alert('成功', '已同步到钉钉');
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '同步失败');
  }
};

// 取消会议
const handleCancel = async () => {
  if (!cancelReason.value.trim()) {
    Alert.alert('提示', '请填写取消原因');
    return;
  }

  try {
    await updateMeeting(props.meeting.id, {
      status: '已取消',
      cancelReason: cancelReason.value
    });
    Alert.alert('成功', '会议已取消');
    showCancelDialog.value = false;
    cancelReason.value = '';
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '操作失败');
  }
};

// 结束会议
const handleEnd = async () => {
  Alert.alert('确认结束', '确定要结束此会议吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '确认结束',
      onPress: async () => {
        try {
          await updateMeeting(props.meeting.id, { status: '已结束' });
          Alert.alert('成功', '会议已结束');
          emit('refresh');
        } catch (error: any) {
          Alert.alert('错误', error.message || '操作失败');
        }
      }
    }
  ]);
};

// 保存会议纪要
const handleSaveMinutes = async () => {
  try {
    await updateMeeting(props.meeting.id, { minutes: minutesContent.value });
    Alert.alert('成功', '会议纪要已保存');
    showMinutesDialog.value = false;
    emit('refresh');
  } catch (error: any) {
    Alert.alert('错误', error.message || '操作失败');
  }
};

// 打开外部会议
const openExternalMeeting = () => {
  if (props.meeting?.externalMeetingUrl) {
    window.open(props.meeting.externalMeetingUrl, '_blank');
  }
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    '未开始': 'status-info',
    '进行中': 'status-success',
    '已结束': 'status-default',
    '已取消': 'status-danger'
  };
  return map[status] || 'status-default';
};
</script>

<style scoped>
.meeting-detail {
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
.status-success { background: #e6f7e6; color: #52c41a; }
.status-danger { background: #fff2e8; color: #ff4d4f; }

.platform-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #f0f0f0;
  color: #666;
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

.external-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.meeting-link {
  color: #1890ff;
  word-break: break-all;
  text-decoration: none;
}

.meeting-link:hover {
  text-decoration: underline;
}

.minutes-content {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.empty-minutes {
  color: #999;
  text-align: center;
  padding: 20px;
}

.cancel-reason {
  background: #fff2e8;
  padding: 16px;
  border-radius: 8px;
  color: #ff4d4f;
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
.btn-info { background: #1890ff; color: #fff; }
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
