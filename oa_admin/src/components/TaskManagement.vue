<template>
  <div id="page-task-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">任务管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreateModal">+ 创建任务</button>
      </div>
    </div>

    <!-- 上部指标卡片 -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">全部任务</div>
          <div class="stat-info-val">{{ metrics.total }}</div>
        </div>
        <div class="stat-icon-wrapper purple">📋</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">进行中</div>
          <div class="stat-info-val" style="color: var(--info);">{{ metrics.running }}</div>
        </div>
        <div class="stat-icon-wrapper blue">⚙️</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">已完成</div>
          <div class="stat-info-val" style="color: var(--success);">{{ metrics.completed }}</div>
        </div>
        <div class="stat-icon-wrapper green">✓</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">已逾期</div>
          <div class="stat-info-val" style="color: var(--danger);">{{ metrics.overdue }}</div>
        </div>
        <div class="stat-icon-wrapper yellow">🚨</div>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>关键词:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="任务名称/负责人">
      </div>
      <div class="filter-item">
        <label>状态:</label>
        <select class="form-control" v-model="searchStatus">
          <option value="">全部</option>
          <option value="待开始">待开始</option>
          <option value="进行中">进行中</option>
          <option value="已完成">已完成</option>
          <option value="已逾期">已逾期</option>
        </select>
      </div>
      <div class="filter-item">
        <label>优先级:</label>
        <select class="form-control" v-model="searchPriority">
          <option value="">全部</option>
          <option value="高">高</option>
          <option value="中">中</option>
          <option value="低">低</option>
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
            <th>任务名称</th>
            <th>所属项目</th>
            <th>负责人</th>
            <th>优先级</th>
            <th>截止日期</th>
            <th>进度</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedTasks.length === 0">
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无匹配的任务</td>
          </tr>
          <tr v-else v-for="item in pagedTasks" :key="item.id">
            <td style="font-weight: 500;">{{ item.name }}</td>
            <td style="color: var(--text-muted);">{{ item.project }}</td>
            <td>{{ item.owner }}</td>
            <td>
              <span class="priority-container">
                <span class="priority-dot" :style="{ backgroundColor: getPriorityColor(item.priority) }"></span>
                <span>{{ item.priority }}</span>
              </span>
            </td>
            <td style="font-family: var(--font-title); font-size: 13px;">{{ item.deadline }}</td>
            <td>
              <div class="progress-bar-container" style="width: 80px;">
                <div class="progress-bar-fill" :style="{ width: item.progress + '%', backgroundColor: getProgressBarColor(item.progress) }"></div>
              </div>
              <span style="font-size: 12px; font-weight: 600; margin-left: 4px;">{{ item.progress }}%</span>
            </td>
            <td>
              <span class="badge" :class="getBadgeClass(item.status)">
                {{ item.status }}
              </span>
            </td>
            <td>
              <span class="action-link" @click="viewDetail(item)">详情</span>
              <span class="action-link" @click="openEditModal(item)">编辑</span>
              <span class="action-link" @click="openAssignModal(item)">分配</span>
              <span class="action-link" @click="handleComplete(item)" v-if="item.status !== '已完成'">完成</span>
              <span class="action-link danger" @click="handleDelete(item.id)">删除</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredTasks.length }} 条记录</div>
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
      <div class="modal-content" style="max-width: 540px;">
        <div class="modal-header">
          <h3 class="modal-title">任务详情</h3>
          <span class="modal-close" @click="closeDetailModal">&times;</span>
        </div>
        <div class="modal-body" v-if="detailTask">
          <div style="margin-bottom: 16px;">
            <strong style="color: var(--text-title); font-size: 16px;">{{ detailTask.name }}</strong>
          </div>
          <div v-if="detailTask.description" style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; line-height: 1.6; color: var(--text-body);">
            {{ detailTask.description }}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
            <div><span style="color: var(--text-muted);">所属项目:</span> {{ detailTask.project }}</div>
            <div><span style="color: var(--text-muted);">负责人:</span> {{ detailTask.owner }}</div>
            <div><span style="color: var(--text-muted);">创建者:</span> {{ detailTask.creator || '--' }}</div>
            <div>
              <span style="color: var(--text-muted);">优先级:</span>
              <span class="priority-container" style="display: inline-flex; margin-left: 4px;">
                <span class="priority-dot" :style="{ backgroundColor: getPriorityColor(detailTask.priority) }"></span>
                <span>{{ detailTask.priority }}</span>
              </span>
            </div>
            <div><span style="color: var(--text-muted);">截止日期:</span> {{ detailTask.deadline }}</div>
            <div><span style="color: var(--text-muted);">状态:</span> <span class="badge" :class="getBadgeClass(detailTask.status)">{{ detailTask.status }}</span></div>
          </div>
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: var(--text-muted); font-size: 14px;">进度</span>
              <span style="font-weight: 600; font-size: 14px;">{{ detailTask.progress }}%</span>
            </div>
            <div class="progress-bar-container" style="width: 100%; height: 10px;">
              <div class="progress-bar-fill" :style="{ width: detailTask.progress + '%', backgroundColor: getProgressBarColor(detailTask.progress) }"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetailModal">关闭</button>
          <button type="button" class="btn btn-primary" @click="openFullDetail(detailTask)">查看详情完整版</button>
          <button type="button" class="btn btn-primary" v-if="detailTask && detailTask.status !== '已完成'" @click="closeDetailModal(); openEditModal(detailTask)">编辑</button>
        </div>
      </div>
    </div>

    <!-- 完整详情弹窗 -->
    <div class="modal-overlay" v-if="showFullDetailModal">
      <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <TaskDetail
          :task="selectedTask"
          @close="showFullDetailModal = false"
          @refresh="refreshData"
          @edit="handleEditFromDetail"
        />
      </div>
    </div>

    <!-- 新建/编辑任务弹窗 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingTask ? '编辑任务' : '创建新任务' }}</h3>
          <span class="modal-close" @click="showModal = false">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group">
              <label>任务名称</label>
              <input type="text" class="form-control" v-model="form.name" style="width: 100%;" placeholder="请输入任务标题" required>
            </div>
            <div class="form-group">
              <label>任务描述</label>
              <textarea class="form-control" v-model="form.description" style="width: 100%; min-height: 60px; resize: vertical;" placeholder="请输入任务描述（选填）"></textarea>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>所属项目</label>
                <select class="form-control" v-model="form.project" style="width: 100%;">
                  <option value="">无</option>
                  <option v-for="proj in store.projects" :key="proj.id" :value="proj.name">{{ proj.name }}</option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>优先级</label>
                <select class="form-control" v-model="form.priority" style="width: 100%;">
                  <option value="高">高</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>负责人</label>
                <select class="form-control" v-model="form.owner" style="width: 100%;" required>
                  <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">
                    {{ emp.name }} ({{ emp.dept }})
                  </option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>截止日期</label>
                <input type="date" class="form-control" v-model="form.deadline" style="width: 100%;" required>
              </div>
            </div>
            <div class="form-group">
              <label>进度 ({{ form.progress }}%)</label>
              <input type="range" style="width: 100%; height: 38px;" v-model="form.progress" min="0" max="100">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 分配任务弹窗 -->
    <div class="modal-overlay" v-if="showAssignModal">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">重新分配任务</h3>
          <span class="modal-close" @click="showAssignModal = false">&times;</span>
        </div>
        <form @submit.prevent="handleAssign">
          <div class="modal-body">
            <div class="form-group">
              <label>任务名称</label>
              <input type="text" class="form-control" :value="assigningTask?.name" disabled style="width: 100%;">
            </div>
            <div class="form-group">
              <label>新负责人</label>
              <select class="form-control" v-model="assignForm.assignee" style="width: 100%;" required>
                <option value="" disabled>请选择负责人</option>
                <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">
                  {{ emp.name }} ({{ emp.dept }})
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAssignModal = false">取消</button>
            <button type="submit" class="btn btn-primary">确认分配</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addTask, updateTask, deleteTask, completeTask, assignTask, Alert } from '../store';
import type { TaskItem } from '../store';
import TaskDetail from './TaskDetail.vue';

// --- 搜索过滤 ---
const searchKeyword = ref('');
const searchStatus = ref('');
const searchPriority = ref('');
const filterKeyword = ref('');
const filterStatus = ref('');
const filterPriority = ref('');

const currentPage = ref(1);
const pageSize = 10;

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterStatus.value = searchStatus.value;
  filterPriority.value = searchPriority.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchStatus.value = '';
  searchPriority.value = '';
  handleSearch();
};

const filteredTasks = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const status = filterStatus.value;
  const priority = filterPriority.value;

  return store.tasks.filter(t => {
    const matchKeyword = !keyword || t.name.toLowerCase().includes(keyword) || t.owner.toLowerCase().includes(keyword);
    const matchStatus = !status || t.status === status;
    const matchPriority = !priority || t.priority === priority;
    return matchKeyword && matchStatus && matchPriority;
  });
});

const totalPages = computed(() => Math.ceil(filteredTasks.value.length / pageSize) || 1);

const pagedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredTasks.value.slice(start, start + pageSize);
});

// --- 指标 ---
const metrics = computed(() => {
  const total = store.tasks.length;
  const running = store.tasks.filter(t => t.status === '进行中').length;
  const completed = store.tasks.filter(t => t.status === '已完成').length;
  const overdue = store.tasks.filter(t => {
    if (t.status === '已完成') return false;
    const dl = new Date(t.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dl < today;
  }).length;

  return { total, running, completed, overdue };
});

// --- 样式辅助 ---
const getPriorityColor = (p: string) => {
  if (p === '高') return 'var(--danger)';
  if (p === '中') return 'var(--warning)';
  return 'var(--info)';
};

const getProgressBarColor = (prog: number) => {
  if (prog === 100) return 'var(--success)';
  if (prog >= 30) return 'var(--primary)';
  if (prog >= 10) return 'var(--warning)';
  return 'var(--danger)';
};

const getBadgeClass = (status: string) => {
  if (status === '已完成') return 'success';
  if (status === '进行中') return 'info';
  if (status === '已逾期') return 'danger';
  return 'warning';
};

// --- 详情弹窗 ---
const showDetailModal = ref(false);
const detailTask = ref<TaskItem | null>(null);

const viewDetail = (task: TaskItem) => {
  detailTask.value = task;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  detailTask.value = null;
};

// --- 完整详情弹窗 ---
const showFullDetailModal = ref(false);
const selectedTask = ref<any>(null);

const openFullDetail = (task: TaskItem) => {
  selectedTask.value = task;
  showFullDetailModal.value = true;
  showDetailModal.value = false;
};

const refreshData = async () => {
  showFullDetailModal.value = false;
};

const handleEditFromDetail = (task: TaskItem) => {
  showFullDetailModal.value = false;
  openEditModal(task);
};

// --- 新建/编辑弹窗 ---
const showModal = ref(false);
const editingTask = ref<TaskItem | null>(null);

const currentUser = computed(() => {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
});

const form = ref({
  name: '',
  description: '',
  project: '',
  owner: '',
  priority: '中' as '高' | '中' | '低',
  deadline: '',
  progress: 0
});

const openCreateModal = () => {
  editingTask.value = null;
  form.value = {
    name: '',
    description: '',
    project: store.projects[0]?.name || '',
    owner: currentUser.value?.real_name || store.employees[0]?.name || '',
    priority: '中',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0
  };
  showModal.value = true;
};

const openEditModal = (task: TaskItem) => {
  editingTask.value = task;
  form.value = {
    name: task.name,
    description: task.description || '',
    project: task.project,
    owner: task.owner,
    priority: task.priority,
    deadline: task.deadline,
    progress: task.progress
  };
  showModal.value = true;
};

const handleSave = async () => {
  const p = Number(form.value.progress);

  if (editingTask.value) {
    try {
      await updateTask(editingTask.value.id, {
        name: form.value.name,
        description: form.value.description,
        project: form.value.project,
        owner: form.value.owner,
        priority: form.value.priority,
        deadline: form.value.deadline,
        progress: p
      });
      alert('任务更新成功！');
    } catch {
      alert('任务更新失败，请重试');
    }
  } else {
    try {
      await addTask({
        name: form.value.name,
        description: form.value.description,
        project: form.value.project,
        owner: form.value.owner,
        priority: form.value.priority,
        deadline: form.value.deadline,
        progress: p
      });
      alert('新建任务分配成功！');
    } catch {
      alert('创建任务失败，请重试');
    }
  }

  showModal.value = false;
};

// --- 删除 ---
const handleDelete = (id: number) => {
  Alert.alert('删除任务', '确定要删除该任务吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: () => {
        deleteTask(id);
        alert('任务已删除！');
      }
    }
  ]);
};

// --- 完成任务 ---
const handleComplete = async (task: TaskItem) => {
  Alert.alert('完成任务', `确定将任务「${task.name}」标记为已完成吗？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '确定',
      onPress: async () => {
        try {
          await completeTask(task.id);
          alert('任务已完成！');
        } catch {
          alert('操作失败，请重试');
        }
      }
    }
  ]);
};

// --- 分配任务 ---
const showAssignModal = ref(false);
const assigningTask = ref<TaskItem | null>(null);
const assignForm = ref({ assignee: '' });

const openAssignModal = (task: TaskItem) => {
  assigningTask.value = task;
  assignForm.value.assignee = '';
  showAssignModal.value = true;
};

const handleAssign = async () => {
  if (!assigningTask.value || !assignForm.value.assignee) return;
  try {
    await assignTask(assigningTask.value.id, assignForm.value.assignee);
    alert('任务分配成功！');
    showAssignModal.value = false;
  } catch {
    alert('分配失败，请重试');
  }
};
</script>

<style scoped>
.priority-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.priority-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.action-link.danger {
  color: var(--danger);
}
.action-link.danger:hover {
  text-decoration: underline;
}
</style>
