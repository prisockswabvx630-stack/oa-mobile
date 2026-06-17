<template>
  <div id="app-layout">
    
    <!-- 1. 全屏登录界面 -->
    <Login v-if="currentPage === 'login'" @login-success="handleLoginSuccess" />

    <!-- 2. 主系统界面 -->
    <template v-else>
      <!-- 左侧导航栏 -->
      <aside id="sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo">OA</div>
          <div>
            <div class="brand-text">智能OA</div>
            <span class="brand-version">管理后台 v1.0</span>
          </div>
        </div>
        
        <nav class="sidebar-menu">
          <!-- 概览 -->
          <div class="menu-group">
            <div class="menu-group-title" @click="toggleMenuGroup('overview')">
              <span>概览</span>
              <span class="menu-arrow" :class="{ collapsed: collapsedGroups.overview }">▾</span>
            </div>
            <div class="menu-group-items" v-show="!collapsedGroups.overview">
              <div
                class="menu-item"
                :class="{ active: currentPage === 'dashboard', 'disabled-menu': !hasPermission('dashboard') }"
                @click="navigateToPage('dashboard')"
              >
                <span class="menu-icon">📊</span>
                <span>仪表盘</span>
                <span v-if="!hasPermission('dashboard')" class="menu-lock-icon">🔒</span>
              </div>
            </div>
          </div>

          <!-- 组织管理 -->
          <div class="menu-group">
            <div class="menu-group-title" @click="toggleMenuGroup('org')">
              <span>组织管理</span>
              <span class="menu-arrow" :class="{ collapsed: collapsedGroups.org }">▾</span>
            </div>
            <div class="menu-group-items" v-show="!collapsedGroups.org">
              <div
                class="menu-item"
                :class="{ active: currentPage === 'user-mgmt', 'disabled-menu': !hasPermission('org:user') }"
                @click="navigateToPage('user-mgmt')"
              >
                <span class="menu-icon">👥</span>
                <span>用户管理</span>
                <span v-if="!hasPermission('org:user')" class="menu-lock-icon">🔒</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentPage === 'hr-mgmt', 'disabled-menu': !hasPermission('org:personnel') }"
                @click="navigateToPage('hr-mgmt')"
              >
                <span class="menu-icon">📇</span>
                <span>人事管理</span>
                <span v-if="!hasPermission('org:personnel')" class="menu-lock-icon">🔒</span>
              </div>
            </div>
          </div>

          <!-- 办公管理 -->
          <div class="menu-group">
            <div class="menu-group-title" @click="toggleMenuGroup('office')">
              <span>办公管理</span>
              <span class="menu-arrow" :class="{ collapsed: collapsedGroups.office }">▾</span>
            </div>
            <div class="menu-group-items" v-show="!collapsedGroups.office">
              <div
                class="menu-item"
                :class="{ active: currentPage === 'attendance-mgmt', 'disabled-menu': !hasPermission('office:attendance') }"
                @click="navigateToPage('attendance-mgmt')"
              >
                <span class="menu-icon">⏱️</span>
                <span>考勤管理</span>
                <span v-if="!hasPermission('office:attendance')" class="menu-lock-icon">🔒</span>
              </div>
              <div
                v-for="item in officeMenuItems"
                :key="item.id"
                class="menu-item"
                :class="{ active: currentPage === item.id, 'disabled-menu': !hasPermission(getOfficePermCode(item.id)) }"
                @click="navigateToPage(item.id)"
              >
                <span class="menu-icon">{{ item.icon }}</span>
                <span>{{ item.name }}</span>
                <span v-if="!hasPermission(getOfficePermCode(item.id))" class="menu-lock-icon">🔒</span>
                <span v-if="item.id === 'placeholder-approval' && hasPermission('office:approval') && pendingApprovalCount > 0" class="sidebar-badge">{{ pendingApprovalCount }}</span>
              </div>
            </div>
          </div>

          <!-- 业务管理 -->
          <div class="menu-group">
            <div class="menu-group-title" @click="toggleMenuGroup('business')">
              <span>业务管理</span>
              <span class="menu-arrow" :class="{ collapsed: collapsedGroups.business }">▾</span>
            </div>
            <div class="menu-group-items" v-show="!collapsedGroups.business">
              <div
                v-for="item in businessMenuItems"
                :key="item.id"
                class="menu-item"
                :class="{ active: currentPage === item.id, 'disabled-menu': !hasPermission(getBusinessPermCode(item.id)) }"
                @click="navigateToPage(item.id)"
              >
                <span class="menu-icon">{{ item.icon }}</span>
                <span>{{ item.name }}</span>
                <span v-if="!hasPermission(getBusinessPermCode(item.id))" class="menu-lock-icon">🔒</span>
              </div>
            </div>
          </div>

          <!-- 沟通协作 -->
          <div class="menu-group">
            <div class="menu-group-title" @click="toggleMenuGroup('collaboration')">
              <span>沟通协作</span>
              <span class="menu-arrow" :class="{ collapsed: collapsedGroups.collaboration }">▾</span>
            </div>
            <div class="menu-group-items" v-show="!collapsedGroups.collaboration">
              <div
                class="menu-item"
                :class="{ active: currentPage === 'placeholder-handover', 'disabled-menu': !hasPermission('collaboration:handover') }"
                @click="navigateToPage('placeholder-handover')"
              >
                <span class="menu-icon">↩</span>
                <span>工作交接</span>
                <span v-if="!hasPermission('collaboration:handover')" class="menu-lock-icon">🔒</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentPage === 'placeholder-notice', 'disabled-menu': !hasPermission('collaboration:announcement') }"
                @click="navigateToPage('placeholder-notice')"
              >
                <span class="menu-icon">📢</span>
                <span>公告管理</span>
                <span v-if="!hasPermission('collaboration:announcement')" class="menu-lock-icon">🔒</span>
              </div>
            </div>
          </div>

          <!-- 系统 -->
          <div class="menu-group">
            <div class="menu-group-title" @click="toggleMenuGroup('system')">
              <span>系统</span>
              <span class="menu-arrow" :class="{ collapsed: collapsedGroups.system }">▾</span>
            </div>
            <div class="menu-group-items" v-show="!collapsedGroups.system">
              <div
                class="menu-item"
                :class="{ active: currentPage === 'placeholder-settings', 'disabled-menu': !hasPermission('system:settings') }"
                @click="navigateToPage('placeholder-settings')"
              >
                <span class="menu-icon">⚙️</span>
                <span>系统设置</span>
                <span v-if="!hasPermission('system:settings')" class="menu-lock-icon">🔒</span>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      <!-- 右侧主工作面板 -->
      <div id="main-panel">
        <!-- 顶部状态栏 -->
        <header id="header">
          <div v-if="showPageSearch" class="header-search-bar">
            <span class="search-icon-inside">🔍</span>
            <input 
              ref="pageSearchInput"
              type="text" 
              v-model="searchQuery" 
              class="search-input-field" 
              placeholder="搜索当前页面内容..." 
              @input="handleSearchInput"
              @keyup.enter="nextMatch"
              @keyup.esc="closeSearch"
            />
            <div class="search-actions">
              <span v-if="searchQuery" class="search-count">
                <span v-if="matchesCount > 0">{{ activeMatchIndex + 1 }}/{{ matchesCount }}</span>
                <span v-else class="no-match">无匹配</span>
              </span>
              <button class="search-nav-btn" :disabled="matchesCount === 0" @click="prevMatch">↑</button>
              <button class="search-nav-btn" :disabled="matchesCount === 0" @click="nextMatch">↓</button>
              <button class="search-close-btn" @click="closeSearch">✕</button>
            </div>
          </div>
          <div v-else class="header-title-area">
            <span>{{ breadcrumb.parent }}</span> / <span class="header-title-active">{{ breadcrumb.active }}</span>
          </div>
          <div class="header-tools">
            <div v-if="!showPageSearch" class="search-trigger" @click="openSearch">🔍</div>
            <div class="notification-trigger" @click="navigateToPage('placeholder-documents')">
              🔔
              <div class="notification-badge"></div>
            </div>
            <div class="user-profile" @click="toggleUserDropdown($event)">
              <div class="avatar">{{ userAvatar }}</div>
              <div class="profile-info">
                <div class="profile-name">{{ userName }}</div>
                <div class="profile-role">{{ userRole }}</div>
              </div>
              <!-- 头像下拉菜单 -->
              <div class="user-dropdown" v-if="showUserDropdown" @click.stop>
                <div class="dropdown-item" @click="goToPersonalCenter">
                  <span class="dropdown-icon">👤</span>
                  个人中心
                </div>
                <div class="dropdown-item" @click="handleLogout">
                  <span class="dropdown-icon">🚪</span>
                  退出登录
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- 动态页面视图 -->
        <main id="content-view">
          <Dashboard 
            v-if="currentPage === 'dashboard'" 
            @switch-page="currentPage = $event" 
          />
          <UserManagement 
            v-else-if="currentPage === 'user-mgmt'" 
            ref="userMgmtRef"
          />
          <HRManagement 
            v-else-if="currentPage === 'hr-mgmt'" 
            @open-user-modal="handleOpenUserModalFromHR"
          />
          <AttendanceManagement 
            v-else-if="currentPage === 'attendance-mgmt'" 
          />
          <ApprovalManagement 
            v-else-if="currentPage === 'placeholder-approval'" 
          />
          <WorkflowManagement 
            v-else-if="currentPage === 'placeholder-workflow'" 
          />
          <MeetingManagement 
            v-else-if="currentPage === 'placeholder-meetings'" 
          />
          <TaskManagement 
            v-else-if="currentPage === 'placeholder-tasks'" 
          />
          <ScheduleManagement 
            v-else-if="currentPage === 'placeholder-schedule'" 
          />
          <DocumentManagement 
            v-else-if="currentPage === 'placeholder-documents'" 
          />
          <ProjectManagement 
            v-else-if="currentPage === 'placeholder-projects'" 
          />
          <PerformanceManagement 
            v-else-if="currentPage === 'placeholder-perf'" 
          />
          <SalaryManagement 
            v-else-if="currentPage === 'placeholder-salary'" 
          />
          <AssetManagement 
            v-else-if="currentPage === 'placeholder-assets'" 
          />
          <HandoverManagement
            v-else-if="currentPage === 'placeholder-handover'"
          />
          <NoticeManagement
            v-else-if="currentPage === 'placeholder-notice'"
          />
          <SystemSettings
            v-else-if="currentPage === 'placeholder-settings'"
          />
          <ExpenseManagement
            v-else-if="currentPage === 'placeholder-expenses'"
          />
          <PlaceholderPage 
            v-else-if="currentPage.startsWith('placeholder-')" 
            :title="getPlaceholderTitle(currentPage)"
            @go-dashboard="currentPage = 'dashboard'"
          />
        </main>
      </div>
    </template>
    
    <!-- 全局 React Native 风格的自定义提示框 -->
    <CustomAlert />

    <!-- 全局加载状态 -->
    <GlobalLoading />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { store, loadAllData } from './store';
import Login from './components/Login.vue';
import Dashboard from './components/Dashboard.vue';
import UserManagement from './components/UserManagement.vue';
import HRManagement from './components/HRManagement.vue';
import AttendanceManagement from './components/AttendanceManagement.vue';
import ApprovalManagement from './components/ApprovalManagement.vue';
import WorkflowManagement from './components/WorkflowManagement.vue';
import MeetingManagement from './components/MeetingManagement.vue';
import TaskManagement from './components/TaskManagement.vue';
import ScheduleManagement from './components/ScheduleManagement.vue';
import DocumentManagement from './components/DocumentManagement.vue';
import ProjectManagement from './components/ProjectManagement.vue';
import PerformanceManagement from './components/PerformanceManagement.vue';
import SalaryManagement from './components/SalaryManagement.vue';
import AssetManagement from './components/AssetManagement.vue';
import HandoverManagement from './components/HandoverManagement.vue';
import NoticeManagement from './components/NoticeManagement.vue';
import SystemSettings from './components/SystemSettings.vue';
import ExpenseManagement from './components/ExpenseManagement.vue';
import PlaceholderPage from './components/PlaceholderPage.vue';
import CustomAlert from './components/CustomAlert.vue';
import GlobalLoading from './components/GlobalLoading.vue';
import { Alert } from './store';

// 当前路由页面
const currentPage = ref('login');
const userMgmtRef = ref<any>(null);

// 侧边栏菜单折叠状态
const loadCollapsedState = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const collapsedGroups = ref<Record<string, boolean>>(loadCollapsedState());

const toggleMenuGroup = (group: string) => {
  collapsedGroups.value[group] = !collapsedGroups.value[group];
  localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsedGroups.value));
};

// 计算待审批数量
const pendingApprovalCount = computed(() => {
  return store.approvals.filter(a => a.status === '待审批').length;
});

// 侧边栏列表定义
const officeMenuItems = [
  { id: 'placeholder-approval', name: '审批管理', icon: '✉️' },
  { id: 'placeholder-workflow', name: '流程管理', icon: '⛵' },
  { id: 'placeholder-meetings', name: '会议管理', icon: '📂' },
  { id: 'placeholder-tasks', name: '任务管理', icon: '☑️' },
  { id: 'placeholder-schedule', name: '日程管理', icon: '📅' },
  { id: 'placeholder-documents', name: '文档管理', icon: '📄' }
];

const businessMenuItems = [
  { id: 'placeholder-projects', name: '项目管理', icon: '💼' },
  { id: 'placeholder-perf', name: '绩效管理', icon: '📈' },
  { id: 'placeholder-salary', name: '薪资管理', icon: '💰' },
  { id: 'placeholder-assets', name: '资产管理', icon: '💻' },
  { id: 'placeholder-expenses', name: '报销管理', icon: '🧾' }
];

import { watch } from 'vue';

const hasPermission = (permCode: string): boolean => {
  if (store.userPermissions.roleCode === 'ROLE_ADMIN' || currentUserInfo.value?.username === 'admin') {
    return true;
  }
  return store.userPermissions.permissions.includes(permCode);
};

const getOfficePermCode = (itemId: string): string => {
  const codeMap: Record<string, string> = {
    'placeholder-approval': 'office:approval',
    'placeholder-workflow': 'office:process',
    'placeholder-meetings': 'office:meeting',
    'placeholder-tasks': 'office:task',
    'placeholder-schedule': 'office:schedule',
    'placeholder-documents': 'collaboration:document'
  };
  return codeMap[itemId] || '';
};

const getBusinessPermCode = (itemId: string): string => {
  const codeMap: Record<string, string> = {
    'placeholder-projects': 'business:project',
    'placeholder-perf': 'business:performance',
    'placeholder-salary': 'business:salary',
    'placeholder-assets': 'business:asset',
    'placeholder-expenses': 'business:expense'
  };
  return codeMap[itemId] || '';
};

const getPageTitle = (pageId: string) => {
  const pageNames: Record<string, string> = {
    'dashboard': '仪表盘',
    'user-mgmt': '用户管理',
    'hr-mgmt': '人事管理',
    'attendance-mgmt': '考勤管理',
    'placeholder-settings': '系统设置'
  };
  return pageNames[pageId] || getPlaceholderTitle(pageId);
};

const navigateToPage = (pageId: string) => {
  const pagePermMap: Record<string, string> = {
    'dashboard': 'dashboard',
    'user-mgmt': 'org:user',
    'hr-mgmt': 'org:personnel',
    'attendance-mgmt': 'office:attendance',
    'placeholder-approval': 'office:approval',
    'placeholder-workflow': 'office:process',
    'placeholder-meetings': 'office:meeting',
    'placeholder-tasks': 'office:task',
    'placeholder-schedule': 'office:schedule',
    'placeholder-documents': 'collaboration:document',
    'placeholder-projects': 'business:project',
    'placeholder-perf': 'business:performance',
    'placeholder-salary': 'business:salary',
    'placeholder-assets': 'business:asset',
    'placeholder-expenses': 'business:expense',
    'placeholder-handover': 'collaboration:handover',
    'placeholder-notice': 'collaboration:announcement',
    'placeholder-settings': 'system:settings'
  };

  const permNeeded = pagePermMap[pageId];
  if (permNeeded && !hasPermission(permNeeded)) {
    alert(`您当前的账号权限不足，无法访问【${getPageTitle(pageId)}】模块！`);
    return;
  }
  currentPage.value = pageId;
};

// 页面搜索状态与逻辑
const showPageSearch = ref(false);
const searchQuery = ref('');
const matchesCount = ref(0);
const activeMatchIndex = ref(-1);
const pageSearchInput = ref<HTMLInputElement | null>(null);
let matchElements: HTMLElement[] = [];

const clearHighlights = () => {
  const highlights = document.querySelectorAll('mark.page-search-highlight');
  highlights.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      const textNode = document.createTextNode(mark.textContent || '');
      parent.replaceChild(textNode, mark);
      parent.normalize();
    }
  });
  matchElements = [];
  matchesCount.value = 0;
  activeMatchIndex.value = -1;
};

const performSearch = () => {
  clearHighlights();
  
  if (!searchQuery.value.trim()) {
    return;
  }
  
  const contentView = document.getElementById('content-view');
  if (!contentView) return;
  
  const query = searchQuery.value.trim();
  const lowerQuery = query.toLowerCase();
  
  const walk = document.createTreeWalker(contentView, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (parent) {
        const tagName = parent.tagName.toLowerCase();
        if (
          tagName === 'script' || 
          tagName === 'style' || 
          tagName === 'mark' || 
          parent.closest('.page-search-highlight') ||
          parent.closest('.header-search-bar')
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        // 过滤掉不可见元素
        if (parent.offsetWidth === 0 && parent.offsetHeight === 0) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  
  const textNodes: Text[] = [];
  let node;
  while (node = walk.nextNode()) {
    textNodes.push(node as Text);
  }
  
  const tempMatches: HTMLElement[] = [];
  
  for (const textNode of textNodes) {
    const text = textNode.nodeValue || '';
    if (!text.toLowerCase().includes(lowerQuery)) continue;
    
    const parent = textNode.parentNode;
    if (!parent) continue;
    
    const docFrag = document.createDocumentFragment();
    let lastIndex = 0;
    let index = text.toLowerCase().indexOf(lowerQuery);
    
    while (index !== -1) {
      if (index > lastIndex) {
        docFrag.appendChild(document.createTextNode(text.substring(lastIndex, index)));
      }
      
      const mark = document.createElement('mark');
      mark.className = 'page-search-highlight';
      mark.textContent = text.substring(index, index + query.length);
      docFrag.appendChild(mark);
      tempMatches.push(mark);
      
      lastIndex = index + query.length;
      index = text.toLowerCase().indexOf(lowerQuery, lastIndex);
    }
    
    if (lastIndex < text.length) {
      docFrag.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    
    parent.replaceChild(docFrag, textNode);
  }
  
  matchElements = tempMatches;
  matchesCount.value = tempMatches.length;
  
  if (matchesCount.value > 0) {
    activeMatchIndex.value = 0;
    highlightActiveMatch();
  }
};

const highlightActiveMatch = () => {
  matchElements.forEach(el => el.classList.remove('active-highlight'));
  
  if (activeMatchIndex.value >= 0 && activeMatchIndex.value < matchElements.length) {
    const activeEl = matchElements[activeMatchIndex.value];
    activeEl.classList.add('active-highlight');
    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const nextMatch = () => {
  if (matchesCount.value === 0) return;
  activeMatchIndex.value = (activeMatchIndex.value + 1) % matchesCount.value;
  highlightActiveMatch();
};

const prevMatch = () => {
  if (matchesCount.value === 0) return;
  activeMatchIndex.value = (activeMatchIndex.value - 1 + matchesCount.value) % matchesCount.value;
  highlightActiveMatch();
};

const openSearch = () => {
  showPageSearch.value = true;
  nextTick(() => {
    if (pageSearchInput.value) {
      pageSearchInput.value.focus();
    }
  });
};

const closeSearch = () => {
  showPageSearch.value = false;
  searchQuery.value = '';
  clearHighlights();
};

const handleSearchInput = () => {
  performSearch();
};

const checkPagePermission = (page: string) => {
  if (page === 'login') return;
  
  const pagePermMap: Record<string, string> = {
    'dashboard': 'dashboard',
    'user-mgmt': 'org:user',
    'hr-mgmt': 'org:personnel',
    'attendance-mgmt': 'office:attendance',
    'placeholder-approval': 'office:approval',
    'placeholder-workflow': 'office:process',
    'placeholder-meetings': 'office:meeting',
    'placeholder-tasks': 'office:task',
    'placeholder-schedule': 'office:schedule',
    'placeholder-documents': 'collaboration:document',
    'placeholder-projects': 'business:project',
    'placeholder-perf': 'business:performance',
    'placeholder-salary': 'business:salary',
    'placeholder-assets': 'business:asset',
    'placeholder-expenses': 'business:expense',
    'placeholder-handover': 'collaboration:handover',
    'placeholder-notice': 'collaboration:announcement',
    'placeholder-settings': 'system:settings'
  };

  const permNeeded = pagePermMap[page];
  if (permNeeded && !hasPermission(permNeeded)) {
    if (hasPermission('dashboard')) {
      currentPage.value = 'dashboard';
    } else {
      const allowedPage = Object.keys(pagePermMap).find(p => hasPermission(pagePermMap[p]));
      if (allowedPage) {
        currentPage.value = allowedPage;
      }
    }
  }
};

watch(currentPage, (newPage) => {
  closeSearch();
  checkPagePermission(newPage);
});

// 面包屑计算
const breadcrumb = computed(() => {
  if (currentPage.value === 'dashboard') {
    return { parent: '首页', active: '仪表盘' };
  }
  if (currentPage.value === 'user-mgmt') {
    return { parent: '组织管理', active: '用户管理' };
  }
  if (currentPage.value === 'hr-mgmt') {
    return { parent: '组织管理', active: '人事管理' };
  }
  if (currentPage.value === 'attendance-mgmt') {
    return { parent: '办公管理', active: '考勤管理' };
  }
  if (['placeholder-approval', 'placeholder-workflow', 'placeholder-meetings', 'placeholder-tasks', 'placeholder-schedule', 'placeholder-documents'].includes(currentPage.value)) {
    return { parent: '办公管理', active: getPlaceholderTitle(currentPage.value) };
  }
  if (['placeholder-projects', 'placeholder-perf', 'placeholder-salary', 'placeholder-assets', 'placeholder-expenses'].includes(currentPage.value)) {
    return { parent: '业务管理', active: getPlaceholderTitle(currentPage.value) };
  }
  if (['placeholder-handover', 'placeholder-notice'].includes(currentPage.value)) {
    return { parent: '沟通协作', active: getPlaceholderTitle(currentPage.value) };
  }
  if (currentPage.value === 'placeholder-settings') {
    return { parent: '系统', active: '系统设置' };
  }
  if (currentPage.value.startsWith('placeholder-')) {
    return { parent: '其他模块', active: getPlaceholderTitle(currentPage.value) };
  }
  return { parent: '首页', active: '仪表盘' };
});

const getPlaceholderTitle = (pageId: string) => {
  const allItems = [
    ...officeMenuItems,
    ...businessMenuItems,
    { id: 'placeholder-handover', name: '工作交接' },
    { id: 'placeholder-notice', name: '公告管理' },
    { id: 'placeholder-settings', name: '系统设置' }
  ];
  const item = allItems.find(i => i.id === pageId);
  return item ? item.name : '开发中模块';
};

const showUserDropdown = ref(false);
const currentUserInfo = ref<any>(null);

const loadCurrentUserInfo = () => {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    currentUserInfo.value = JSON.parse(userJson);
  } else {
    currentUserInfo.value = null;
  }
};

const currentEmployee = computed(() => {
  if (!currentUserInfo.value) return null;
  return store.employees.find(
    e => String(e.id) === String(currentUserInfo.value.id) || e.name === currentUserInfo.value.real_name
  ) || null;
});

const userName = computed(() => {
  return currentEmployee.value?.name || currentUserInfo.value?.real_name || currentUserInfo.value?.username || '未知用户';
});

const userRole = computed(() => {
  return store.userPermissions.roleName || currentEmployee.value?.role || (currentUserInfo.value?.username === 'admin' ? '管理员' : '普通用户');
});

const userAvatar = computed(() => {
  return userName.value.charAt(0) || 'U';
});

const toggleUserDropdown = (event: Event) => {
  event.stopPropagation();
  showUserDropdown.value = !showUserDropdown.value;
};

const closeUserDropdown = () => {
  showUserDropdown.value = false;
};

const goToPersonalCenter = () => {
  const emp = currentEmployee.value;
  let info = `【个人中心】\n`;
  info += `姓名: ${userName.value}\n`;
  info += `角色: ${userRole.value}\n`;
  if (emp) {
    info += `工号: ${emp.id}\n`;
    info += `部门: ${emp.dept}\n`;
    info += `手机: ${emp.phone || '未绑定'}\n`;
    info += `状态: ${emp.status}\n`;
  } else {
    info += `账号: ${currentUserInfo.value?.username || 'admin'}\n`;
  }
  alert(info);
  showUserDropdown.value = false;
};

const handleLoginSuccess = async () => {
  loadCurrentUserInfo();
  currentPage.value = 'dashboard';
  await loadAllData();
  checkPagePermission(currentPage.value);
};

const handleLogout = () => {
  Alert.alert('退出登录', '确认退出后台管理系统吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '确认退出',
      onPress: () => {
        localStorage.removeItem('currentUser');
        currentUserInfo.value = null;
        currentPage.value = 'login';
        showUserDropdown.value = false;
      }
    }
  ]);
};

onMounted(async () => {
  window.addEventListener('click', closeUserDropdown);
  loadCurrentUserInfo();
  if (currentUserInfo.value) {
    currentPage.value = 'dashboard';
    await loadAllData();
    checkPagePermission(currentPage.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('click', closeUserDropdown);
});

// 人事管理点击新增/编辑联动跳转
const handleOpenUserModalFromHR = (empId?: string) => {
  currentPage.value = 'user-mgmt';
  // 等待 DOM 渲染完毕后拉起 modal
  nextTick(() => {
    if (userMgmtRef.value) {
      if (empId) {
        // 从人事卡片获取员工对象
        const employees = userMgmtRef.value.filteredEmployees || [];
        const emp = employees.find((e: any) => e.id === empId);
        userMgmtRef.value.openModal(emp);
      } else {
        userMgmtRef.value.openModal(null);
      }
    }
  });
};
</script>

<style scoped>
.disabled-menu {
  opacity: 0.65;
  cursor: pointer;
}

.menu-lock-icon {
  margin-left: auto;
  font-size: 11px;
  filter: grayscale(1);
  opacity: 0.7;
}

.menu-item.disabled-menu:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
