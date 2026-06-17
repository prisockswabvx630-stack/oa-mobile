<template>
  <div id="page-user-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">User Management</h2>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="mockAction('导入')">📥 导入</button>
        <button class="btn btn-secondary" @click="mockAction('导出')">📤 导出</button>
        <button class="btn btn-primary" @click="openModal()">+ 新增用户</button>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>关键词:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="姓名/手机号/工号">
      </div>
      <div class="filter-item">
        <label>部门:</label>
        <select class="form-control" v-model="searchDept">
          <option value="">全部部门</option>
          <option value="技术部">技术部</option>
          <option value="市场部">市场部</option>
          <option value="销售部">销售部</option>
        </select>
      </div>
      <div class="filter-item">
        <label>状态:</label>
        <select class="form-control" v-model="searchStatus">
          <option value="">全部</option>
          <option value="正常">正常</option>
          <option value="禁用">禁用</option>
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
            <th style="width: 40px;"><input type="checkbox" v-model="selectAll" @change="handleSelectAll"></th>
            <th>工号</th>
            <th>姓名</th>
            <th>部门</th>
            <th>职位</th>
            <th>手机号</th>
            <th>角色</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedEmployees.length === 0">
            <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
          </tr>
          <tr v-else v-for="emp in pagedEmployees" :key="emp.id">
            <td><input type="checkbox" :value="emp.id" v-model="selectedUserIds"></td>
            <td style="font-weight: 600; font-family: var(--font-title);">{{ emp.id }}</td>
            <td style="font-weight: 500;">{{ emp.name }}</td>
            <td>{{ emp.dept }}</td>
            <td>{{ emp.position }}</td>
            <td>{{ emp.phone }}</td>
            <td>{{ emp.role }}</td>
            <td>
              <span class="badge" :class="emp.status === '正常' ? 'success' : 'danger'">
                {{ emp.status }}
              </span>
            </td>
            <td style="color: var(--text-muted); font-size: 13px;">{{ emp.createTime }}</td>
            <td>
              <span class="action-link" @click="openModal(emp)">编辑</span>
              <span class="action-link" @click="handleResetPass(emp.id)">重置密码</span>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredEmployees.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 新增/修改用户 弹窗 Modal -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingEmp ? '修改用户信息' : '新增用户' }}</h3>
          <span class="modal-close" @click="closeModal">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group">
              <label>姓名</label>
              <input type="text" class="form-control" v-model="form.name" style="width: 100%;" required>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>性别</label>
                <select class="form-control" v-model="form.gender" style="width: 100%;">
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>部门</label>
                <select class="form-control" v-model="form.dept" style="width: 100%;">
                  <option value="技术部">技术部</option>
                  <option value="市场部">市场部</option>
                  <option value="销售部">销售部</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>职位</label>
                <input type="text" class="form-control" v-model="form.position" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>手机号</label>
                <input type="text" class="form-control" v-model="form.phone" style="width: 100%;" required>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>系统角色</label>
                <select class="form-control" v-model="form.role" style="width: 100%;">
                  <option value="普通用户">普通用户</option>
                  <option value="管理员">管理员</option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>人事状态</label>
                <select class="form-control" v-model="form.hrStatus" style="width: 100%;">
                  <option value="在职">在职</option>
                  <option value="试用期">试用期</option>
                  <option value="离职">离职</option>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addEmployee, updateEmployee, resetPassword, Alert } from '../store';
import type { Employee } from '../store';

// 搜索绑定
const searchKeyword = ref('');
const searchDept = ref('');
const searchStatus = ref('');

// 缓存提交过滤参数，使得必须点击“搜索”才触发
const filterKeyword = ref('');
const filterDept = ref('');
const filterStatus = ref('');

// 分页与勾选
const currentPage = ref(1);
const pageSize = 10;
const selectAll = ref(false);
const selectedUserIds = ref<string[]>([]);

// 弹窗表单状态
const showModal = ref(false);
const editingEmp = ref<Employee | null>(null);
const form = ref({
  name: '',
  gender: '男',
  dept: '技术部',
  position: '',
  phone: '',
  role: '普通用户',
  hrStatus: '在职'
});

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterDept.value = searchDept.value;
  filterStatus.value = searchStatus.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchDept.value = '';
  searchStatus.value = '';
  handleSearch();
};

// 过滤后的员工列表
const filteredEmployees = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const dept = filterDept.value;
  const status = filterStatus.value;

  return store.employees.filter(emp => {
    const matchKeyword = !keyword || 
      emp.name.toLowerCase().includes(keyword) || 
      emp.id.includes(keyword) || 
      emp.phone.includes(keyword);
    const matchDept = !dept || emp.dept === dept;
    const matchStatus = !status || emp.status === status;
    return matchKeyword && matchDept && matchStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / pageSize) || 1);

const pagedEmployees = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredEmployees.value.slice(start, start + pageSize);
});

// 全选勾选逻辑
const handleSelectAll = () => {
  if (selectAll.value) {
    selectedUserIds.value = pagedEmployees.value.map(e => e.id);
  } else {
    selectedUserIds.value = [];
  }
};

const openModal = (emp: Employee | null = null) => {
  editingEmp.value = emp;
  if (emp) {
    form.value = {
      name: emp.name,
      gender: emp.gender,
      dept: emp.dept,
      position: emp.position,
      phone: emp.phone,
      role: emp.role,
      hrStatus: emp.hrStatus
    };
  } else {
    form.value = {
      name: '',
      gender: '男',
      dept: '技术部',
      position: '',
      phone: '',
      role: '普通用户',
      hrStatus: '在职'
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingEmp.value = null;
};

const handleSave = () => {
  const empData = {
    ...form.value,
    status: form.value.hrStatus === '离职' ? '禁用' : '正常'
  };

  if (editingEmp.value) {
    updateEmployee(editingEmp.value.id, empData);
    alert('用户信息更新成功！');
  } else {
    addEmployee(empData);
    alert('新增用户成功！已自动关联生成人事与出勤记录。');
  }
  closeModal();
};

const handleResetPass = (id: string) => {
  Alert.alert('重置密码', `确定要重置工号为 ${id} 的用户密码吗？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '确定',
      style: 'destructive',
      onPress: () => {
        resetPassword(id);
        alert('密码已重置成功，请通知用户使用新密码登录。');
      }
    }
  ]);
};

const mockAction = (actionName: string) => {
  alert(`${actionName}功能运行正常，已导出为模拟Excel包！`);
};

defineExpose({ openModal });
</script>
