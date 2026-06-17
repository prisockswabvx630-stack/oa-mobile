<template>
  <div id="page-meeting-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">会议管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openBookingModal">+ 预约会议</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">全部会议</div>
          <div class="stat-info-val">{{ metrics.total }}</div>
        </div>
        <div class="stat-icon-wrapper purple">📋</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">未开始</div>
          <div class="stat-info-val" style="color: var(--info);">{{ metrics.upcoming }}</div>
        </div>
        <div class="stat-icon-wrapper blue">📅</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">进行中</div>
          <div class="stat-info-val" style="color: var(--success);">{{ metrics.ongoing }}</div>
        </div>
        <div class="stat-icon-wrapper green">▶</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">已取消</div>
          <div class="stat-info-val" style="color: var(--danger);">{{ metrics.cancelled }}</div>
        </div>
        <div class="stat-icon-wrapper red">✗</div>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>关键词:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="会议主题/组织者">
      </div>
      <div class="filter-item">
        <label>状态:</label>
        <select class="form-control" v-model="searchStatus">
          <option value="">全部</option>
          <option value="未开始">未开始</option>
          <option value="进行中">进行中</option>
          <option value="已结束">已结束</option>
          <option value="已取消">已取消</option>
        </select>
      </div>
      <div class="filter-item">
        <label>会议室:</label>
        <select class="form-control" v-model="searchRoom">
          <option value="">全部</option>
          <option v-for="r in rooms" :key="r.id" :value="r.name">{{ r.name }} ({{ r.location }})</option>
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
            <th>会议主题</th>
            <th>会议室</th>
            <th>组织者</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>参会人</th>
            <th>状态</th>
            <th>外部平台</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedMeetings.length === 0">
            <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无会议记录</td>
          </tr>
          <tr v-else v-for="item in pagedMeetings" :key="item.id">
            <td style="font-weight: 500;">{{ item.title }}</td>
            <td>{{ item.room }}</td>
            <td>{{ item.organizer }}</td>
            <td style="font-size: 13px;">{{ item.startTime }}</td>
            <td style="font-size: 13px;">{{ item.endTime }}</td>
            <td>{{ item.attendees }}人</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(item.status)">{{ item.status }}</span>
            </td>
            <td>
              <span v-if="item.externalPlatform === 'tencent'" class="badge info">腾讯会议</span>
              <span v-else-if="item.externalPlatform === 'dingtalk'" class="badge warning">钉钉</span>
              <span v-else style="color: var(--text-muted); font-size: 12px;">--</span>
            </td>
            <td>
              <span class="action-link" @click="viewDetail(item)">详情</span>
              <template v-if="item.status === '未开始'">
                <span class="action-link" @click="openEditModal(item)">编辑</span>
                <span class="action-link" @click="handleSyncTencent(item)" title="同步到腾讯会议">腾讯</span>
                <span class="action-link" @click="handleSyncDingtalk(item)" title="同步到钉钉">钉钉</span>
                <span class="action-link danger" @click="handleCancel(item)">取消</span>
              </template>
              <template v-else-if="item.status === '进行中'">
                <span class="action-link" @click="openMinutesModal(item)">纪要</span>
              </template>
              <span v-if="item.status === '已取消' || item.status === '已结束'" class="action-link danger" @click="handleDelete(item)">删除</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredMeetings.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-content" style="max-width: 560px;">
        <div class="modal-header">
          <h3 class="modal-title">会议详情</h3>
          <span class="modal-close" @click="closeDetailModal">&times;</span>
        </div>
        <div class="modal-body" v-if="detailItem">
          <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
            <strong style="color: var(--text-title); font-size: 16px;">{{ detailItem.title }}</strong>
            <span class="badge" :class="getStatusBadgeClass(detailItem.status)">{{ detailItem.status }}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
            <div><span style="color: var(--text-muted);">会议编号:</span> {{ detailItem.meetingNo || '--' }}</div>
            <div><span style="color: var(--text-muted);">组织者:</span> {{ detailItem.organizer }}</div>
            <div><span style="color: var(--text-muted);">会议室:</span> {{ detailItem.room }}</div>
            <div><span style="color: var(--text-muted);">参会人数:</span> {{ detailItem.attendees }}人</div>
            <div><span style="color: var(--text-muted);">开始时间:</span> {{ detailItem.startTime }}</div>
            <div><span style="color: var(--text-muted);">结束时间:</span> {{ detailItem.endTime }}</div>
          </div>
          <div v-if="detailItem.externalPlatform" style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px;">
            <div style="font-weight: 600; margin-bottom: 8px;">外部会议平台</div>
            <div><span style="color: var(--text-muted);">平台:</span> {{ detailItem.externalPlatform === 'tencent' ? '腾讯会议' : '钉钉' }}</div>
            <div v-if="detailItem.externalMeetingId"><span style="color: var(--text-muted);">会议ID:</span> {{ detailItem.externalMeetingId }}</div>
            <div v-if="detailItem.externalMeetingUrl" style="margin-top: 4px;">
              <span style="color: var(--text-muted);">加入链接:</span>
              <a :href="detailItem.externalMeetingUrl" target="_blank" style="color: var(--primary); word-break: break-all;">{{ detailItem.externalMeetingUrl }}</a>
            </div>
          </div>
          <div v-if="detailItem.minutes" style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <span style="color: var(--text-muted); font-size: 12px; display: block; margin-bottom: 4px;">会议纪要</span>
            {{ detailItem.minutes }}
          </div>
          <div v-if="detailItem.cancelReason" style="margin-top: 12px; padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 8px; font-size: 14px;">
            <span style="color: var(--danger); font-size: 12px; display: block; margin-bottom: 4px;">取消原因</span>
            {{ detailItem.cancelReason }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetailModal">关闭</button>
          <button type="button" class="btn btn-primary" @click="openFullDetail(detailItem)">查看详情完整版</button>
          <button type="button" class="btn btn-primary" v-if="detailItem?.externalMeetingUrl" @click="openExternalMeeting">加入会议</button>
        </div>
      </div>
    </div>

    <!-- 完整详情弹窗 -->
    <div class="modal-overlay" v-if="showFullDetailModal">
      <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <MeetingDetail
          :meeting="selectedMeeting"
          @close="showFullDetailModal = false"
          @refresh="refreshData"
          @edit="handleEditFromDetail"
        />
      </div>
    </div>

    <!-- 预约会议弹窗 -->
    <div class="modal-overlay" v-if="showBookingModal">
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingMeeting ? '编辑会议' : '预约会议' }}</h3>
          <span class="modal-close" @click="showBookingModal = false">&times;</span>
        </div>
        <form @submit.prevent="handleBook">
          <div class="modal-body">
            <div class="form-group">
              <label>会议主题</label>
              <input type="text" class="form-control" v-model="form.title" style="width: 100%;" placeholder="请输入会议主题" required>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>会议室</label>
                <select class="form-control" v-model="form.room" style="width: 100%;">
                  <option v-for="r in rooms" :key="r.id" :value="r.name">{{ r.name }} ({{ r.capacity }}人 · {{ r.location }})</option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>参会人数</label>
                <input type="number" class="form-control" v-model="form.attendees" style="width: 100%;" min="1" required>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>开始时间</label>
                <input type="datetime-local" class="form-control" v-model="form.startTime" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>结束时间</label>
                <input type="datetime-local" class="form-control" v-model="form.endTime" style="width: 100%;" required>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showBookingModal = false">取消</button>
            <button type="submit" class="btn btn-primary">{{ editingMeeting ? '保存' : '预约' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 会议纪要弹窗 -->
    <div class="modal-overlay" v-if="showMinutesModal">
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">会议纪要 - {{ minutesMeeting?.title }}</h3>
          <span class="modal-close" @click="showMinutesModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>主要决议与办事项</label>
            <textarea class="form-control" style="width: 100%; height: 180px; padding: 12px; resize: none; line-height: 1.6;" v-model="minutesContent" placeholder="请输入会议纪要要点..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showMinutesModal = false">取消</button>
          <button class="btn btn-primary" @click="saveMinutes">保存纪要</button>
        </div>
      </div>
    </div>

    <!-- 同步结果弹窗 -->
    <div class="modal-overlay" v-if="showSyncModal">
      <div class="modal-content" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ syncResult?.platform === 'tencent' ? '腾讯会议' : '钉钉' }}同步结果</h3>
          <span class="modal-close" @click="showSyncModal = false">&times;</span>
        </div>
        <div class="modal-body" v-if="syncResult">
          <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; line-height: 1.8;">
            <div><span style="color: var(--text-muted);">平台:</span> {{ syncResult.platform === 'tencent' ? '腾讯会议' : '钉钉' }}</div>
            <div><span style="color: var(--text-muted);">会议ID:</span> {{ syncResult.meeting_id || syncResult.conference_id }}</div>
            <div style="word-break: break-all;"><span style="color: var(--text-muted);">加入链接:</span> <a :href="syncResult.join_url || syncResult.meeting_url" target="_blank" style="color: var(--primary);">{{ syncResult.join_url || syncResult.meeting_url }}</a></div>
          </div>
          <div style="margin-top: 12px; padding: 10px; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px; font-size: 13px; color: #ad8b00;">
            {{ syncResult.message }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showSyncModal = false">关闭</button>
          <button class="btn btn-primary" @click="copySyncLink">复制链接</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addMeeting, updateMeeting, deleteMeeting, syncMeetingToTencent, syncMeetingToDingtalk, Alert } from '../store';
import type { MeetingItem } from '../store';
import MeetingDetail from './MeetingDetail.vue';

// --- 会议室 ---
interface Room { id: number; name: string; capacity: number; location: string; equipment: string[]; }
const rooms = ref<Room[]>([
  { id: 1, name: '会议室A', capacity: 10, location: '3楼东区', equipment: ['投影仪', '白板', '视频会议'] },
  { id: 2, name: '会议室B', capacity: 20, location: '3楼西区', equipment: ['投影仪', '白板', '音响'] },
  { id: 3, name: '会议室C', capacity: 6, location: '5楼北区', equipment: ['电视屏', '白板'] },
  { id: 4, name: '线上会议', capacity: 100, location: '远程', equipment: ['腾讯会议', '钉钉'] }
]);

// --- 搜索过滤 ---
const searchKeyword = ref('');
const searchStatus = ref('');
const searchRoom = ref('');
const filterKeyword = ref('');
const filterStatus = ref('');
const filterRoom = ref('');
const currentPage = ref(1);
const pageSize = 10;

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterStatus.value = searchStatus.value;
  filterRoom.value = searchRoom.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchStatus.value = '';
  searchRoom.value = '';
  handleSearch();
};

const filteredMeetings = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const status = filterStatus.value;
  const room = filterRoom.value;
  return store.meetings.filter(m => {
    const matchKeyword = !keyword || m.title.toLowerCase().includes(keyword) || m.organizer.toLowerCase().includes(keyword);
    const matchStatus = !status || m.status === status;
    const matchRoom = !room || m.room === room;
    return matchKeyword && matchStatus && matchRoom;
  });
});

const totalPages = computed(() => Math.ceil(filteredMeetings.value.length / pageSize) || 1);
const pagedMeetings = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredMeetings.value.slice(start, start + pageSize);
});

// --- 统计 ---
const metrics = computed(() => ({
  total: store.meetings.length,
  upcoming: store.meetings.filter(m => m.status === '未开始').length,
  ongoing: store.meetings.filter(m => m.status === '进行中').length,
  cancelled: store.meetings.filter(m => m.status === '已取消').length
}));

// --- 样式 ---
const getStatusBadgeClass = (status: string) => {
  if (status === '进行中') return 'info';
  if (status === '已取消') return 'danger';
  if (status === '已结束') return 'success';
  return 'warning';
};

// --- 详情 ---
const showDetailModal = ref(false);
const detailItem = ref<MeetingItem | null>(null);
const viewDetail = (item: MeetingItem) => { detailItem.value = item; showDetailModal.value = true; };
const closeDetailModal = () => { showDetailModal.value = false; detailItem.value = null; };

// --- 完整详情 ---
const showFullDetailModal = ref(false);
const selectedMeeting = ref<any>(null);

const openFullDetail = (item: MeetingItem) => {
  selectedMeeting.value = item;
  showFullDetailModal.value = true;
  showDetailModal.value = false;
};

const refreshData = async () => {
  showFullDetailModal.value = false;
};

const handleEditFromDetail = (item: MeetingItem) => {
  showFullDetailModal.value = false;
  openEditModal(item);
};

// --- 预约/编辑 ---
const showBookingModal = ref(false);
const editingMeeting = ref<MeetingItem | null>(null);
const form = ref({ title: '', room: '会议室A', attendees: 5, startTime: '', endTime: '' });

const formatDatetimeLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
};

const openBookingModal = () => {
  editingMeeting.value = null;
  const now = new Date();
  form.value = { title: '', room: '会议室A', attendees: 5, startTime: formatDatetimeLocal(now), endTime: formatDatetimeLocal(new Date(now.getTime() + 3600000)) };
  showBookingModal.value = true;
};

const openEditModal = (item: MeetingItem) => {
  editingMeeting.value = item;
  form.value = {
    title: item.title,
    room: item.room,
    attendees: item.attendees,
    startTime: item.startTime.replace(' ', 'T'),
    endTime: item.endTime.replace(' ', 'T')
  };
  showBookingModal.value = true;
};

const handleBook = async () => {
  const start = form.value.startTime.replace('T', ' ');
  const end = form.value.endTime.replace('T', ' ');
  try {
    if (editingMeeting.value) {
      await updateMeeting(editingMeeting.value.id, { title: form.value.title, room: form.value.room, startTime: start, endTime: end, attendees: form.value.attendees });
      alert('会议信息已更新！');
    } else {
      await addMeeting({ title: form.value.title, room: form.value.room, startTime: start, endTime: end, attendees: form.value.attendees });
      alert('预约成功！已通过系统自动向参会人下发日程通知。');
    }
    showBookingModal.value = false;
  } catch {
    alert('操作失败，请重试');
  }
};

// --- 取消 ---
const handleCancel = async (item: MeetingItem) => {
  Alert.prompt(
    '取消会议',
    `确定要取消会议「${item.title}」吗？请输入取消原因：`,
    [
      { text: '保留会议', style: 'cancel' },
      {
        text: '确认取消',
        style: 'destructive',
        onPress: async (reason) => {
          try {
            await updateMeeting(item.id, { status: '已取消', cancelReason: reason || '组织者取消了会议' });
            alert('会议已取消。');
          } catch {
            alert('取消失败，请重试');
          }
        }
      }
    ]
  );
};

// --- 删除 ---
const handleDelete = async (item: MeetingItem) => {
  Alert.alert('删除会议', `确定要删除会议「${item.title}」吗？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteMeeting(item.id);
          alert('会议已删除！');
        } catch {
          alert('删除失败，请重试');
        }
      }
    }
  ]);
};

// --- 会议纪要 ---
const showMinutesModal = ref(false);
const minutesMeeting = ref<MeetingItem | null>(null);
const minutesContent = ref('');

const openMinutesModal = (item: MeetingItem) => {
  minutesMeeting.value = item;
  minutesContent.value = item.minutes || '';
  showMinutesModal.value = true;
};

const saveMinutes = async () => {
  if (!minutesMeeting.value) return;
  try {
    await updateMeeting(minutesMeeting.value.id, { minutes: minutesContent.value });
    alert('会议纪要保存成功！');
    showMinutesModal.value = false;
  } catch {
    alert('保存失败，请重试');
  }
};

// --- 第三方同步 ---
const showSyncModal = ref(false);
const syncResult = ref<any>(null);

const handleSyncTencent = async (item: MeetingItem) => {
  Alert.alert('同步腾讯会议', `将会议「${item.title}」同步到腾讯会议？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '同步',
      onPress: async () => {
        try {
          const res = await syncMeetingToTencent(item.id);
          syncResult.value = res;
          showSyncModal.value = true;
        } catch {
          alert('同步腾讯会议失败，请重试');
        }
      }
    }
  ]);
};

const handleSyncDingtalk = async (item: MeetingItem) => {
  Alert.alert('同步钉钉', `将会议「${item.title}」同步到钉钉？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '同步',
      onPress: async () => {
        try {
          const res = await syncMeetingToDingtalk(item.id);
          syncResult.value = res;
          showSyncModal.value = true;
        } catch {
          alert('同步钉钉失败，请重试');
        }
      }
    }
  ]);
};

const copySyncLink = () => {
  const url = syncResult.value?.join_url || syncResult.value?.meeting_url || '';
  navigator.clipboard.writeText(url).then(() => alert('链接已复制！')).catch(() => alert('复制失败'));
};

const openExternalMeeting = () => {
  if (detailItem.value?.externalMeetingUrl) {
    window.open(detailItem.value.externalMeetingUrl, '_blank');
  }
};
</script>

<style scoped>
.action-link.danger {
  color: var(--danger);
}
.action-link.danger:hover {
  text-decoration: underline;
}
</style>
