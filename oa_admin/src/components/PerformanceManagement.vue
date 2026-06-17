<template>
  <div id="page-performance-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">绩效管理</h2>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="mockExport">📥 导出报表</button>
        <button class="btn btn-primary" @click="openEvalModal(null)">+ 发起考核</button>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>关键词:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="姓名/工号">
      </div>
      <div class="filter-item">
        <label>部门:</label>
        <select class="form-control" v-model="searchDept" :disabled="!isSuperAdmin">
          <option v-if="isSuperAdmin" value="">全部部门</option>
          <option value="技术部">技术部</option>
          <option value="市场部">市场部</option>
          <option value="销售部">销售部</option>
          <option value="行政部">行政部</option>
          <option v-if="!isSuperAdmin && currentUserDept && !['技术部', '市场部', '销售部', '行政部'].includes(currentUserDept)" :value="currentUserDept">{{ currentUserDept }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>考核等级:</label>
        <select class="form-control" v-model="searchGrade">
          <option value="">全部</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
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
            <th>工号</th>
            <th>姓名</th>
            <th>部门</th>
            <th>工作业绩</th>
            <th>工作态度</th>
            <th>团队协作</th>
            <th>综合得分</th>
            <th>等级</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedPerf.length === 0">
            <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
          </tr>
          <tr v-else v-for="p in pagedPerf" :key="p.empId">
            <td style="font-weight: 600; font-family: var(--font-title);">{{ p.empId }}</td>
            <td style="font-weight: 500;">{{ p.name }}</td>
            <td>{{ p.dept }}</td>
            <td>{{ p.workScore }}</td>
            <td>{{ p.attitudeScore }}</td>
            <td>{{ p.teamworkScore }}</td>
            <td style="font-weight: 700; color: var(--primary);">{{ p.totalScore }}</td>
            <td>
              <span class="badge" :class="getGradeClass(p.grade)">
                {{ p.grade }}
              </span>
            </td>
            <td>
              <span class="action-link" @click="viewDetail(p)">详情</span>
              <span 
                v-if="!currentUserEmp || p.empId !== currentUserEmp.id" 
                class="action-link" 
                @click="openEvalModal(p)"
              >
                评分
              </span>
              <span 
                v-else 
                style="color: var(--text-muted); cursor: not-allowed; margin-left: 10px;" 
                title="您不可以给自己评分"
              >
                评分
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredPerf.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 发起考核评分/编辑弹窗 -->
    <div class="modal-overlay" v-if="showEvalModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">绩效考核评分</h3>
          <span class="modal-close" @click="closeEvalModal">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group" v-if="!selectedEmpId">
              <label>选择员工</label>
              <select class="form-control" v-model="form.empId" style="width: 100%;" required>
                <option v-for="emp in unratedEmployees" :key="emp.id" :value="emp.id">
                  {{ emp.name }} ({{ emp.dept }} - {{ emp.position }})
                </option>
              </select>
              <p v-if="unratedEmployees.length === 0" style="color: var(--danger); font-size: 12px; margin-top: 4px;">
                所有在职员工都已有绩效记录。
              </p>
            </div>
            <div class="form-group" v-else>
              <label>员工姓名</label>
              <input type="text" class="form-control" :value="form.name + ' (' + form.empId + ')'" style="width: 100%;" disabled>
            </div>
            
            <div class="form-group">
              <label>工作业绩评分 (0 - 100)</label>
              <input type="number" class="form-control" v-model.number="form.workScore" min="0" max="100" style="width: 100%;" required>
            </div>
            
            <div class="form-group">
              <label>工作态度评分 (0 - 100)</label>
              <input type="number" class="form-control" v-model.number="form.attitudeScore" min="0" max="100" style="width: 100%;" required>
            </div>
            
            <div class="form-group">
              <label>团队协作评分 (0 - 100)</label>
              <input type="number" class="form-control" v-model.number="form.teamworkScore" min="0" max="100" style="width: 100%;" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEvalModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="!form.empId">确定评分</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">绩效考核明细</h3>
          <span class="modal-close" @click="closeDetailModal">&times;</span>
        </div>
        <div class="modal-body" v-if="detailPerf">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 18px; font-weight: 700; color: var(--text-title);">{{ detailPerf.name }}</div>
            <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">{{ detailPerf.dept }} | 工号: {{ detailPerf.empId }}</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span>工作业绩:</span>
              <strong style="color: var(--text-title);">{{ detailPerf.workScore }} 分</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span>工作态度:</span>
              <strong style="color: var(--text-title);">{{ detailPerf.attitudeScore }} 分</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span>团队协作:</span>
              <strong style="color: var(--text-title);">{{ detailPerf.teamworkScore }} 分</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 8px;">
              <span style="font-size: 16px; font-weight: 600;">综合得分:</span>
              <strong style="color: var(--primary); font-size: 18px;">{{ detailPerf.totalScore }} 分</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 16px; font-weight: 600;">最终等级:</span>
              <span class="badge" :class="getGradeClass(detailPerf.grade)" style="font-size: 14px; padding: 4px 12px;">
                {{ detailPerf.grade }} 级
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="closeDetailModal">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { store, updatePerformance } from '../store';
import type { Performance } from '../store';

const userJson = localStorage.getItem('currentUser');
const currentUser = userJson ? JSON.parse(userJson) : null;

// 寻找当前登录用户关联的员工信息
const currentUserEmp = computed(() => {
  if (!currentUser) return null;
  return store.employees.find(
    e => String(e.userId) === String(currentUser.id) || 
         e.name === currentUser.real_name || 
         String(e.id) === String(currentUser.id)
  ) || null;
});

// 判断当前登录用户的部门
const currentUserDept = computed(() => {
  if (currentUser?.sys_department?.dept_name) {
    return currentUser.sys_department.dept_name;
  }
  return currentUserEmp.value?.dept || null;
});

// 判断是否是超级管理员
const isSuperAdmin = computed(() => {
  return store.userPermissions.roleCode === 'ROLE_ADMIN' || currentUser?.username === 'admin';
});

const searchKeyword = ref('');
const searchDept = ref('');
const searchGrade = ref('');

const filterKeyword = ref('');
const filterDept = ref('');
const filterGrade = ref('');

const currentPage = ref(1);
const pageSize = 10;

const showEvalModal = ref(false);
const selectedEmpId = ref<string | null>(null);
const form = ref({
  empId: '',
  name: '',
  workScore: 80,
  attitudeScore: 80,
  teamworkScore: 80
});

const showDetailModal = ref(false);
const detailPerf = ref<Performance | null>(null);

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterDept.value = searchDept.value;
  filterGrade.value = searchGrade.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchDept.value = isSuperAdmin.value ? '' : (currentUserDept.value || '');
  searchGrade.value = '';
  handleSearch();
};

onMounted(() => {
  if (!isSuperAdmin.value && currentUserDept.value) {
    searchDept.value = currentUserDept.value;
    filterDept.value = currentUserDept.value;
  }
});

const filteredPerf = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const dept = filterDept.value;
  const grade = filterGrade.value;

  return store.performance.filter(p => {
    // 跨部门限制：如果非超级管理员且部门不匹配，则过滤掉
    if (!isSuperAdmin.value && currentUserDept.value && p.dept !== currentUserDept.value) {
      return false;
    }
    
    const matchKeyword = !keyword || p.name.toLowerCase().includes(keyword) || p.empId.includes(keyword);
    const matchDept = !dept || p.dept === dept;
    const matchGrade = !grade || p.grade === grade;
    return matchKeyword && matchDept && matchGrade;
  });
});

const totalPages = computed(() => Math.ceil(filteredPerf.value.length / pageSize) || 1);

const pagedPerf = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredPerf.value.slice(start, start + pageSize);
});

// 未参与评分的在职员工
const unratedEmployees = computed(() => {
  return store.employees.filter(emp => {
    if (emp.hrStatus === '离职') return false;
    // 跨部门限制
    if (!isSuperAdmin.value && currentUserDept.value && emp.dept !== currentUserDept.value) {
      return false;
    }
    // 不可以评分自己
    if (currentUserEmp.value && emp.id === currentUserEmp.value.id) {
      return false;
    }
    return !store.performance.some(p => p.empId === emp.id);
  });
});

const getGradeClass = (grade: string) => {
  if (grade === 'A') return 'success';
  if (grade === 'B') return 'info';
  if (grade === 'C') return 'warning';
  return 'danger';
};

const openEvalModal = (p: Performance | null = null) => {
  if (p) {
    selectedEmpId.value = p.empId;
    form.value = {
      empId: p.empId,
      name: p.name,
      workScore: p.workScore,
      attitudeScore: p.attitudeScore,
      teamworkScore: p.teamworkScore
    };
  } else {
    selectedEmpId.value = null;
    form.value = {
      empId: unratedEmployees.value[0]?.id || '',
      name: '',
      workScore: 80,
      attitudeScore: 80,
      teamworkScore: 80
    };
  }
  showEvalModal.value = true;
};

const closeEvalModal = () => {
  showEvalModal.value = false;
  selectedEmpId.value = null;
};

const handleSave = () => {
  const targetId = form.value.empId;
  const exists = store.performance.some(p => p.empId === targetId);

  if (exists) {
    updatePerformance(targetId, {
      workScore: form.value.workScore,
      attitudeScore: form.value.attitudeScore,
      teamworkScore: form.value.teamworkScore
    });
    alert('员工评分已更新！');
  } else {
    // 首次评分
    const emp = store.employees.find(e => e.id === targetId);
    if (emp) {
      store.performance.push({
        empId: emp.id,
        name: emp.name,
        dept: emp.dept,
        workScore: form.value.workScore,
        attitudeScore: form.value.attitudeScore,
        teamworkScore: form.value.teamworkScore,
        totalScore: Math.round((form.value.workScore + form.value.attitudeScore + form.value.teamworkScore) / 3),
        grade: 'B' // will recalculate on updatePerformance
      });
      updatePerformance(emp.id, {}); // recalculates scores and grades correctly
      alert('考核评分成功！');
    }
  }
  closeEvalModal();
};

const viewDetail = (p: Performance) => {
  detailPerf.value = p;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  detailPerf.value = null;
};

const mockExport = () => {
  alert('绩效分析报告导出成功！已保存为 Excel 文件。');
};
</script>

<style scoped>
</style>
