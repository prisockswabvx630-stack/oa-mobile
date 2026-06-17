<template>
  <div id="page-schedule-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">日程管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreateModal">+ 新建日程</button>
      </div>
    </div>

    <!-- 顶层周历看板 -->
    <div class="card" style="padding: 20px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 13px;" @click="changeWeek(-1)">◀ 上周</button>
        <h3 style="font-size: 15px; margin: 0; color: var(--text-title);">{{ weekTitle }}</h3>
        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 13px;" @click="changeWeek(1)">下周 ▶</button>
      </div>
      <div class="calendar-ribbon">
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="calendar-col"
          :class="{ active: selectedDate === day.dateStr, today: day.isToday }"
          @click="selectedDate = day.dateStr"
        >
          <div class="calendar-weekday">{{ day.weekdayName }}</div>
          <div class="calendar-day-num" :class="{ 'today-num': day.isToday }">{{ day.day }}</div>
          <div
            v-if="getScheduleCountForDate(day.dateStr) > 0"
            class="calendar-badge"
          >
            {{ getScheduleCountForDate(day.dateStr) }}项
          </div>
          <div v-else style="height: 18px;"></div>
        </div>
      </div>
    </div>

    <!-- 下半部分日程卡片流 -->
    <div class="card" style="padding: 24px;">
      <h3 style="font-size: 16px; margin-bottom: 24px; color: var(--text-title);">
        {{ formatSelectedDateLabel }} 日程安排
      </h3>

      <div class="schedule-timeline">
        <div v-if="filteredSchedules.length === 0" class="no-schedule">
          ☕ 今日暂无日程安排，享受轻松的一天吧！
        </div>
        <div v-else v-for="item in filteredSchedules" :key="item.id" class="schedule-row">
          <div class="schedule-time">{{ item.time }}</div>
          <div class="schedule-card-wrapper" :style="getCardStyle(item.color)">
            <div class="schedule-card-title">{{ item.title }}</div>
            <div class="schedule-card-sub">
              {{ item.location }} <span v-if="item.duration">· {{ item.duration }}</span> <span v-if="item.attendees">· {{ item.attendees }}人</span>
            </div>
            <span class="schedule-delete-btn" @click.stop="deleteSchedule(item.id)">&times;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建日程弹窗 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title">新建日程</h3>
          <span class="modal-close" @click="showModal = false">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group">
              <label>日程主题</label>
              <input type="text" class="form-control" v-model="form.title" style="width: 100%;" placeholder="如：部门周会 / 客户拜访" required>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>日期</label>
                <input type="date" class="form-control" v-model="form.date" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>时间</label>
                <input type="time" class="form-control" v-model="form.time" style="width: 100%;" required>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>地点</label>
                <input type="text" class="form-control" v-model="form.location" style="width: 100%;" placeholder="如：会议室A" required>
              </div>
              <div style="flex: 1;">
                <label>卡片颜色</label>
                <select class="form-control" v-model="form.color" style="width: 100%;">
                  <option value="purple">紫卡 (会议/活动)</option>
                  <option value="yellow">黄卡 (个人待办)</option>
                  <option value="green">绿卡 (评审/关键)</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>持续时间</label>
                <input type="text" class="form-control" v-model="form.duration" style="width: 100%;" placeholder="如：1小时 / 30分钟">
              </div>
              <div style="flex: 1;">
                <label>参会人数 (可选)</label>
                <input type="number" class="form-control" v-model="form.attendees" style="width: 100%;" min="1">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addSchedule, deleteSchedule as storeDeleteSchedule, Alert } from '../store';

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const selectedDate = ref(todayStr);
const showModal = ref(false);
const weekOffset = ref(0); // 0=本周, -1=上周, 1=下周

const form = ref({
  title: '',
  date: todayStr,
  time: '09:00',
  location: '',
  color: 'purple' as 'purple' | 'yellow' | 'green',
  duration: '1小时',
  attendees: 1
});

const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];

// 动态生成周日历数据
const weekDays = computed(() => {
  const now = new Date();
  // 找到本周日（周日为一周起始）
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay + weekOffset.value * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      weekdayName: weekdayNames[d.getDay()],
      day: d.getDate(),
      dateStr,
      isToday: dateStr === todayStr
    };
  });
});

const weekTitle = computed(() => {
  const first = weekDays.value[0];
  const last = weekDays.value[6];
  const f = new Date(first.dateStr);
  const l = new Date(last.dateStr);
  return `${f.getFullYear()}年${f.getMonth() + 1}月${f.getDate()}日 — ${l.getMonth() + 1}月${l.getDate()}日`;
});

const changeWeek = (dir: number) => {
  weekOffset.value += dir;
  // 切换周后自动选中第一天
  selectedDate.value = weekDays.value[dir > 0 ? 0 : 6].dateStr;
};

const schedules = computed(() => store.schedules);

const getScheduleCountForDate = (date: string) => {
  return schedules.value.filter(s => s.date === date).length;
};

// 筛选出的日程项
const filteredSchedules = computed(() => {
  return schedules.value
    .filter(s => s.date === selectedDate.value)
    .sort((a, b) => a.time.localeCompare(b.time));
});

const formatSelectedDateLabel = computed(() => {
  const d = new Date(selectedDate.value);
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${weekday}`;
});

// 获取卡片高颜值边框色与背景色
const getCardStyle = (color: string) => {
  if (color === 'purple') {
    return {
      backgroundColor: '#f5f3ff',
      color: '#6d28d9',
      borderLeft: '5px solid #8b5cf6'
    };
  }
  if (color === 'yellow') {
    return {
      backgroundColor: '#fffbeb',
      color: '#b45309',
      borderLeft: '5px solid #f59e0b'
    };
  }
  // green
  return {
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    borderLeft: '5px solid #10b981'
  };
};

const openCreateModal = () => {
  form.value = {
    title: '',
    date: selectedDate.value,
    time: '09:00',
    location: '',
    color: 'purple',
    duration: '1小时',
    attendees: 1
  };
  showModal.value = true;
};

const handleSave = async () => {
  try {
    await addSchedule({
      date: form.value.date,
      time: form.value.time,
      title: form.value.title,
      location: form.value.location,
      duration: form.value.duration || undefined,
      attendees: form.value.attendees || undefined,
      color: form.value.color
    });
    alert('日程保存成功，已同步至个人待办面板！');
    showModal.value = false;
  } catch (e) {
    alert('保存日程失败，请重试');
  }
};

const deleteSchedule = async (id: number) => {
  Alert.alert('删除日程', '确定要删除该条日程吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: async () => {
        try {
          await storeDeleteSchedule(id);
        } catch (e) {
          alert('删除日程失败，请重试');
        }
      }
    }
  ]);
};
</script>

<style scoped>
/* 周历横条看板 */
.calendar-ribbon {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.calendar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  border-radius: var(--radius-md);
  cursor: pointer;
  max-width: 80px;
  transition: var(--transition);
}

.calendar-col:hover {
  background-color: var(--bg-main);
}

.calendar-col.active {
  background-color: var(--primary-light);
  border: 1.5px solid var(--primary);
}

.calendar-col.today {
  border: 1.5px solid var(--primary);
}

.today-num {
  color: var(--primary) !important;
}

.calendar-weekday {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 8px;
}

.calendar-day-num {
  font-size: 18px;
  font-family: var(--font-title);
  font-weight: 700;
  color: var(--text-title);
  margin-bottom: 6px;
}

.calendar-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-align: center;
  min-width: 44px;
  background-color: var(--primary);
  color: white;
}

/* 时间线列表 */
.schedule-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  padding-left: 20px;
}

.schedule-timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 80px;
  width: 1.5px;
  background-color: var(--border-color);
}

.no-schedule {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
  font-size: 14px;
}

.schedule-row {
  display: flex;
  align-items: center;
}

.schedule-time {
  width: 60px;
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-title);
}

.schedule-card-wrapper {
  margin-left: 45px;
  flex: 1;
  border-radius: var(--radius-md);
  padding: 16px 20px;
  position: relative;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  transition: var(--transition);
}

.schedule-card-wrapper:hover {
  transform: translateX(2px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.04);
}

.schedule-card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.schedule-card-sub {
  font-size: 12px;
  opacity: 0.8;
}

.schedule-delete-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: var(--transition);
}

.schedule-card-wrapper:hover .schedule-delete-btn {
  opacity: 0.6;
}

.schedule-delete-btn:hover {
  opacity: 1 !important;
  color: var(--danger);
}
</style>
