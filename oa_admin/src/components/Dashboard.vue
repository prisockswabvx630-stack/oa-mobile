<template>
  <div id="page-dashboard" class="page-section">
    <!-- 统计指标网格 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info-title">员工总数</div>
          <div class="stat-icon-wrapper purple">👥</div>
        </div>
        <div class="stat-info-val">{{ stats.totalEmployees }}</div>
        <div class="stat-trend trend-up">▲ 3 本月新增</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info-title">今日出勤</div>
          <div class="stat-icon-wrapper green">⏱️</div>
        </div>
        <div class="stat-info-val">{{ stats.presentCount }}</div>
        <div class="stat-trend trend-up">▲ {{ stats.attendanceRate }}% 出勤率</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info-title">待审批</div>
          <div class="stat-icon-wrapper yellow">✉️</div>
        </div>
        <div class="stat-info-val">{{ stats.pendingApprovals }}</div>
        <div class="stat-trend trend-down">▼ 2 较昨日</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info-title">进行中项目</div>
          <div class="stat-icon-wrapper blue">💼</div>
        </div>
        <div class="stat-info-val">{{ stats.activeProjects }}</div>
        <div class="stat-trend trend-up">▲ 1 本周新增</div>
      </div>
    </div>

    <!-- 图表与待办两栏 -->
    <div class="dashboard-grid">
      <!-- 考勤趋势图卡片 -->
      <div class="card">
        <div class="dashboard-title-bar">
          <h3>近7天考勤趋势</h3>
          <a href="javascript:void(0);" class="dashboard-link" @click="$emit('switch-page', 'attendance-mgmt')">查看详情 ></a>
        </div>
        <div class="h-chart-container">
          <div v-for="(day, index) in chartData" :key="index" class="h-chart-row">
            <div class="h-chart-label">{{ day.label }}</div>
            <div class="h-chart-bar-track">
              <div class="h-chart-bar-fill" :style="{ width: animatedWidths[index] }">
                <span class="h-chart-bar-text">{{ day.present }}/{{ day.total }}</span>
              </div>
            </div>
            <div class="h-chart-percent">{{ day.height }}</div>
          </div>
        </div>
      </div>

      <!-- 待办事项卡片 -->
      <div class="card">
        <div class="dashboard-title-bar">
          <h3>待办事项</h3>
          <a href="javascript:void(0);" class="dashboard-link">全部 ></a>
        </div>
        <div class="todo-list" v-if="store.todos.length > 0">
          <div v-for="todo in store.todos" :key="todo.id" class="todo-item">
            <div class="todo-dot" :class="'dot-' + (todo.priority === '高' ? 'high' : todo.priority === '中' ? 'medium' : 'low')"></div>
            <div class="todo-content">
              <div class="todo-title">{{ todo.title }}</div>
              <div class="todo-time">{{ formatRelativeTime(todo.time) }}</div>
            </div>
          </div>
        </div>
        <div v-else class="todo-empty">暂无待办事项</div>
      </div>

      <!-- 项目进度概览 -->
      <div class="card">
        <div class="dashboard-title-bar">
          <h3>项目进度概览</h3>
          <a href="javascript:void(0);" class="dashboard-link">全部 ></a>
        </div>
        <table class="simple-table">
          <thead>
            <tr>
              <th>项目名称</th>
              <th>负责人</th>
              <th>进度</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.projects" :key="p.id">
              <td style="font-weight: 500;">{{ p.name }}</td>
              <td>{{ p.owner }}</td>
              <td>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" :style="{ width: p.progress + '%' }"></div>
                </div>
                <span style="font-size: 12px; font-weight: 600;">{{ p.progress }}%</span>
              </td>
              <td><span class="badge success">{{ p.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 最近动态 -->
      <div class="card">
        <div class="dashboard-title-bar">
          <h3>最近动态</h3>
        </div>
        <div class="activity-feed">
          <div v-for="act in store.activities" :key="act.id" class="activity-item">
            <div class="activity-avatar">{{ act.text.charAt(0) }}</div>
            <div class="activity-content">
              <div class="activity-text">{{ act.text }}</div>
              <div class="activity-time">{{ act.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { store, getStats } from '../store';

defineEmits(['switch-page']);

// 从 store 获取实时统计数据
const stats = computed(() => getStats());

// 相对时间格式化
const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  return dateStr;
};

// 考勤图表数据
const chartData = [
  { label: '周一', present: 40, total: 42, height: '95.2%' },
  { label: '周二', present: 38, total: 42, height: '90.5%' },
  { label: '周三', present: 42, total: 42, height: '100%' },
  { label: '周四', present: 39, total: 42, height: '92.8%' },
  { label: '周五', present: 40, total: 42, height: '95.2%' }
];

// 横向进度条动画控制
const animatedWidths = ref<string[]>(['0%', '0%', '0%', '0%', '0%']);

onMounted(() => {
  // 延迟渲染以展示横向动画
  setTimeout(() => {
    animatedWidths.value = chartData.map(d => d.height);
  }, 100);
});
</script>

<style scoped>
</style>
