<template>
  <div id="page-projects-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">项目管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openModal()">+ 创建项目</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">全部项目</div>
          <div class="stat-info-val">{{ stats.total }}</div>
        </div>
        <div class="stat-icon-wrapper purple">📁</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">进行中</div>
          <div class="stat-info-val" style="color: var(--info);">{{ stats.running }}</div>
        </div>
        <div class="stat-icon-wrapper blue">⚙️</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">已完成</div>
          <div class="stat-info-val" style="color: var(--success);">{{ stats.completed }}</div>
        </div>
        <div class="stat-icon-wrapper green">✓</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">有风险</div>
          <div class="stat-info-val" style="color: var(--danger);">{{ stats.atRisk }}</div>
        </div>
        <div class="stat-icon-wrapper yellow">⚠</div>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>关键词:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="项目名称/负责人">
      </div>
      <div class="filter-item">
        <label>状态:</label>
        <select class="form-control" v-model="searchStatus">
          <option value="">全部</option>
          <option value="进行中">进行中</option>
          <option value="已完成">已完成</option>
          <option value="未开始">未开始</option>
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
            <th>项目名称</th>
            <th>负责人</th>
            <th>优先级</th>
            <th>任务数</th>
            <th>开始日期</th>
            <th>截止日期</th>
            <th>进度</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedProjects.length === 0">
            <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
          </tr>
          <tr v-else v-for="proj in pagedProjects" :key="proj.id" :class="{ 'row-risk': isAtRisk(proj) }">
            <td style="font-weight: 600;">
              {{ proj.name }}
              <span v-if="isAtRisk(proj)" title="该项目存在逾期风险" style="color: var(--danger); margin-left: 4px;">⚠</span>
            </td>
            <td style="font-weight: 500;">{{ proj.owner }}</td>
            <td>
              <span class="priority-container">
                <span class="priority-dot" :style="{ backgroundColor: getPriorityColor(proj.priority) }"></span>
                <span>{{ proj.priority }}</span>
              </span>
            </td>
            <td style="text-align: center;">{{ proj.taskCount }}</td>
            <td>{{ proj.startDate }}</td>
            <td>{{ proj.endDate }}</td>
            <td>
              <div class="progress-bar-container" style="width: 120px;">
                <div class="progress-bar-fill" :style="{ width: proj.progress + '%', backgroundColor: getProgressBarColor(proj.progress) }"></div>
              </div>
              <span style="font-size: 13px; margin-left: 8px; font-weight: 600;">{{ proj.progress }}%</span>
            </td>
            <td>
              <span class="badge" :class="getStatusClass(proj.status)">
                {{ proj.status }}
              </span>
            </td>
            <td>
              <span class="action-link" @click="viewDetail(proj)">详情</span>
              <span class="action-link" @click="openModal(proj)">编辑</span>
              <span class="action-link danger" @click="handleDelete(proj.id)">删除</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredProjects.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑项目弹窗 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content" style="max-width: 560px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingProj ? '编辑项目' : '创建项目' }}</h3>
          <span class="modal-close" @click="closeModal">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group">
              <label>项目名称</label>
              <input type="text" class="form-control" v-model="form.name" style="width: 100%;" required placeholder="请输入项目名称">
            </div>
            <div class="form-group">
              <label>项目描述</label>
              <textarea class="form-control" v-model="form.description" style="width: 100%; min-height: 60px; resize: vertical;" placeholder="请输入项目描述（选填）"></textarea>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>负责人</label>
                <select class="form-control" v-model="form.owner" style="width: 100%;">
                  <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">
                    {{ emp.name }} ({{ emp.dept }})
                  </option>
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
            <div class="form-group">
              <label>参与部门</label>
              <select class="form-control" v-model="form.dept" style="width: 100%;">
                <option value="">未指定</option>
                <option value="技术部">技术部</option>
                <option value="市场部">市场部</option>
                <option value="销售部">销售部</option>
                <option value="行政部">行政部</option>
              </select>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>开始日期</label>
                <input type="date" class="form-control" v-model="form.startDate" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>截止日期</label>
                <input type="date" class="form-control" v-model="form.endDate" style="width: 100%;" required>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>进度 (%)</label>
                <input type="number" class="form-control" v-model.number="form.progress" min="0" max="100" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>状态</label>
                <select class="form-control" v-model="form.status" style="width: 100%;">
                  <option value="未开始">未开始</option>
                  <option value="进行中">进行中</option>
                  <option value="已完成">已完成</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">项目详情</h3>
          <span class="modal-close" @click="closeDetailModal">&times;</span>
        </div>
        <div class="modal-body" v-if="detailProj">
          <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
            <strong style="color: var(--text-title); font-size: 18px;">{{ detailProj.name }}</strong>
            <span class="badge" :class="getStatusClass(detailProj.status)">{{ detailProj.status }}</span>
            <span class="priority-container">
              <span class="priority-dot" :style="{ backgroundColor: getPriorityColor(detailProj.priority) }"></span>
              <span>{{ detailProj.priority }}优先级</span>
            </span>
          </div>
          <div v-if="detailProj.description" style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; line-height: 1.6; color: var(--text-body);">
            {{ detailProj.description }}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
            <div><span style="color: var(--text-muted);">负责人:</span> {{ detailProj.owner }}</div>
            <div><span style="color: var(--text-muted);">参与部门:</span> {{ detailProj.dept || '--' }}</div>
            <div><span style="color: var(--text-muted);">开始日期:</span> {{ detailProj.startDate }}</div>
            <div><span style="color: var(--text-muted);">截止日期:</span> {{ detailProj.endDate }}</div>
            <div><span style="color: var(--text-muted);">关联任务:</span> {{ detailProj.taskCount }} 个</div>
            <div>
              <span style="color: var(--text-muted);">风险状态:</span>
              <span v-if="isAtRisk(detailProj)" style="color: var(--danger); font-weight: 600;">⚠ 存在逾期风险</span>
              <span v-else style="color: var(--success);">正常</span>
            </div>
          </div>
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: var(--text-muted); font-size: 14px;">项目进度</span>
              <span style="font-weight: 600; font-size: 14px;">{{ detailProj.progress }}%</span>
            </div>
            <div class="progress-bar-container" style="width: 100%; height: 10px;">
              <div class="progress-bar-fill" :style="{ width: detailProj.progress + '%', backgroundColor: getProgressBarColor(detailProj.progress) }"></div>
            </div>
          </div>

          <!-- 关联任务拆解 -->
          <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--text-title);">任务拆解</h4>
            <div v-if="projectTasks.length === 0" style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 16px;">暂无关联任务</div>
            <table v-else class="data-table" style="font-size: 13px;">
              <thead>
                <tr>
                  <th>任务名称</th>
                  <th>负责人</th>
                  <th>优先级</th>
                  <th>截止日期</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in projectTasks" :key="task.id">
                  <td>{{ task.name }}</td>
                  <td>{{ task.owner }}</td>
                  <td>
                    <span class="priority-container">
                      <span class="priority-dot" :style="{ backgroundColor: getPriorityColor(task.priority) }"></span>
                      <span>{{ task.priority }}</span>
                    </span>
                  </td>
                  <td style="font-size: 12px;">{{ task.deadline }}</td>
                  <td><span class="badge" :class="getTaskBadgeClass(task.status)">{{ task.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 风险预警 -->
          <div v-if="isAtRisk(detailProj)" style="margin-top: 16px; padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 8px;">
            <div style="font-weight: 600; color: var(--danger); font-size: 13px; margin-bottom: 4px;">⚠ 风险预警</div>
            <div style="font-size: 13px; color: var(--text-body);">
              该项目截止日期已临近或逾期，且进度仅为 {{ detailProj.progress }}%，建议及时跟进。
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetailModal">关闭</button>
          <button type="button" class="btn btn-primary" @click="closeDetailModal(); openModal(detailProj)">编辑</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addProject, updateProject, deleteProject, Alert } from '../store';
import type { Project } from '../store';

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

const filteredProjects = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const status = filterStatus.value;
  const priority = filterPriority.value;

  return store.projects.filter(p => {
    const matchKeyword = !keyword || p.name.toLowerCase().includes(keyword) || p.owner.toLowerCase().includes(keyword);
    const matchStatus = !status || p.status === status;
    const matchPriority = !priority || p.priority === priority;
    return matchKeyword && matchStatus && matchPriority;
  });
});

const totalPages = computed(() => Math.ceil(filteredProjects.value.length / pageSize) || 1);

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredProjects.value.slice(start, start + pageSize);
});

// --- 统计 ---
const stats = computed(() => {
  const total = store.projects.length;
  const running = store.projects.filter(p => p.status === '进行中').length;
  const completed = store.projects.filter(p => p.status === '已完成').length;
  const atRisk = store.projects.filter(p => isAtRisk(p)).length;
  return { total, running, completed, atRisk };
});

// --- 风险判断 ---
const isAtRisk = (proj: Project) => {
  if (proj.status === '已完成') return false;
  if (proj.progress >= 80) return false;
  const endDate = new Date(proj.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  // 进度不足 + 临近截止(7天内) 或已逾期
  if (daysLeft < 0) return true;
  if (daysLeft <= 7 && proj.progress < 70) return true;
  if (daysLeft <= 3 && proj.progress < 90) return true;
  return false;
};

// --- 样式辅助 ---
const getPriorityColor = (p: string) => {
  if (p === '高') return 'var(--danger)';
  if (p === '中') return 'var(--warning)';
  return 'var(--info)';
};

const getProgressBarColor = (progress: number) => {
  if (progress >= 80) return 'var(--success)';
  if (progress >= 50) return 'var(--primary)';
  return 'var(--warning)';
};

const getStatusClass = (status: string) => {
  if (status === '已完成') return 'success';
  if (status === '进行中') return 'info';
  return 'warning';
};

const getTaskBadgeClass = (status: string) => {
  if (status === '已完成') return 'success';
  if (status === '进行中') return 'info';
  if (status === '已逾期') return 'danger';
  return 'warning';
};

// --- 详情弹窗 ---
const showDetailModal = ref(false);
const detailProj = ref<Project | null>(null);

const projectTasks = computed(() => {
  if (!detailProj.value) return [];
  return store.tasks.filter(t => t.project === detailProj.value!.name);
});

const viewDetail = (proj: Project) => {
  detailProj.value = proj;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  detailProj.value = null;
};

// --- 新增/编辑弹窗 ---
const showModal = ref(false);
const editingProj = ref<Project | null>(null);
const form = ref({
  name: '',
  description: '',
  owner: '',
  dept: '',
  priority: '中' as '高' | '中' | '低',
  startDate: '',
  endDate: '',
  progress: 0,
  status: '进行中'
});

const openModal = (proj: Project | null = null) => {
  editingProj.value = proj;
  if (proj) {
    form.value = {
      name: proj.name,
      description: proj.description || '',
      owner: proj.owner,
      dept: proj.dept,
      priority: proj.priority,
      startDate: proj.startDate,
      endDate: proj.endDate,
      progress: proj.progress,
      status: proj.status
    };
  } else {
    form.value = {
      name: '',
      description: '',
      owner: store.employees[0]?.name || '',
      dept: store.employees[0]?.dept || '',
      priority: '中',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      status: '进行中'
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingProj.value = null;
};

const handleSave = () => {
  if (editingProj.value) {
    updateProject(editingProj.value.id, form.value);
    alert('项目更新成功！');
  } else {
    addProject(form.value);
    alert('新项目创建成功！');
  }
  closeModal();
};

const handleDelete = (id: number) => {
  Alert.alert('删除项目', '确定要删除该项目吗？关联的任务不会被删除。', [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: () => {
        deleteProject(id);
        alert('项目已删除！');
      }
    }
  ]);
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
  margin-left: 8px;
}
.action-link.danger:hover {
  text-decoration: underline;
}

.row-risk {
  background: #fffbe6;
}
</style>
