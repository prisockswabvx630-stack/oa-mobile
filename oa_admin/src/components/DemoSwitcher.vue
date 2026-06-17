<template>
  <div id="demo-switcher-bar">
    <button class="switcher-scroll-btn" @click="scrollLeft">◀</button>
    <div class="switcher-tabs-container" ref="tabsContainer">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="switcher-tab"
        :class="{ active: currentTab === tab.id, disabled: tab.disabled }"
        @click="selectTab(tab)"
      >
        {{ tab.name }}
      </div>
    </div>
    <button class="switcher-scroll-btn" @click="scrollRight">▶</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps({
  currentTab: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['change-tab']);

const tabsContainer = ref<HTMLDivElement | null>(null);

const tabs = [
  { id: 'login', name: '登录页' },
  { id: 'dashboard', name: '仪表盘' },
  { id: 'user-mgmt', name: '用户管理' },
  { id: 'hr-mgmt', name: '人事管理' },
  { id: 'attendance-mgmt', name: '考勤管理' },
  { id: 'placeholder-approval', name: '审批管理' },
  { id: 'placeholder-workflow', name: '流程管理' },
  { id: 'placeholder-meetings', name: '会议管理' },
  { id: 'placeholder-tasks', name: '任务管理' },
  { id: 'placeholder-schedule', name: '日程管理' },
  { id: 'placeholder-documents', name: '文档管理' },
  { id: 'placeholder-projects', name: '项目管理' },
  { id: 'placeholder-perf', name: '绩效管理' },
  { id: 'placeholder-salary', name: '薪资管理' },
  { id: 'placeholder-assets', name: '资产管理' },
  { id: 'placeholder-handover', name: '工作交接' },
  { id: 'disabled-announcement', name: '公告管理', disabled: true }
];

const scrollLeft = () => {
  if (tabsContainer.value) {
    tabsContainer.value.scrollBy({ left: -200, behavior: 'smooth' });
  }
};

const scrollRight = () => {
  if (tabsContainer.value) {
    tabsContainer.value.scrollBy({ left: 200, behavior: 'smooth' });
  }
};

const selectTab = (tab: typeof tabs[0]) => {
  if (tab.disabled) return;
  emit('change-tab', tab.id);
};
</script>
