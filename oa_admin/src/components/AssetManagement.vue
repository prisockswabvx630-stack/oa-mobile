<template>
  <div id="page-assets-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">资产管理</h2>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="mockExport">导出列表</button>
        <button class="btn btn-primary" @click="openModal()">+ 新增资产</button>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>关键词:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="资产编号/名称">
      </div>
      <div class="filter-item">
        <label>分类:</label>
        <select class="form-control" v-model="searchCategory">
          <option value="">全部分类</option>
          <option value="电子设备">电子设备</option>
          <option value="办公家具">办公家具</option>
          <option value="运输工具">运输工具</option>
          <option value="其他">其他</option>
        </select>
      </div>
      <div class="filter-item">
        <label>状态:</label>
        <select class="form-control" v-model="searchStatus">
          <option value="">全部状态</option>
          <option value="在用">在用</option>
          <option value="闲置">闲置</option>
          <option value="报废">报废</option>
          <option value="维修中">维修中</option>
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
            <th>资产编号</th>
            <th>资产名称</th>
            <th>分类</th>
            <th>规格型号</th>
            <th>使用人</th>
            <th>部门</th>
            <th>购入日期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedAssets.length === 0">
            <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
          </tr>
          <tr v-else v-for="a in pagedAssets" :key="a.id">
            <td style="font-weight: 600; font-family: var(--font-title);">{{ a.id }}</td>
            <td style="font-weight: 500;">{{ a.name }}</td>
            <td>{{ a.category }}</td>
            <td>{{ a.model }}</td>
            <td>{{ a.user }}</td>
            <td>{{ a.dept }}</td>
            <td style="color: var(--text-muted); font-size: 13px;">{{ a.purchaseDate }}</td>
            <td>
              <span class="badge" :class="getStatusClass(a.status)">
                {{ a.status }}
              </span>
            </td>
            <td>
              <template v-if="a.status === '闲置'">
                <span class="action-link" @click="openAssignModal(a)">领用</span>
              </template>
              <template v-if="a.status === '在用'">
                <span class="action-link" @click="handleReturn(a.id)">退库</span>
                <span class="action-link" @click="handleRepair(a.id)">送修</span>
              </template>
              <template v-if="a.status === '维修中'">
                <span class="action-link" @click="handleRepairComplete(a.id)">修复</span>
              </template>
              <span class="action-link" @click="openModal(a)">编辑</span>
              <span class="action-link danger" @click="handleDelete(a.id)">删除</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredAssets.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑资产弹窗 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingAsset ? '编辑资产' : '新增资产' }}</h3>
          <span class="modal-close" @click="closeModal">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group">
              <label>资产名称</label>
              <input type="text" class="form-control" v-model="form.name" style="width: 100%;" required placeholder="例如：MacBook Pro 14寸">
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>资产分类</label>
                <select class="form-control" v-model="form.category" style="width: 100%;">
                  <option value="电子设备">电子设备</option>
                  <option value="办公家具">办公家具</option>
                  <option value="运输工具">运输工具</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>规格型号</label>
                <input type="text" class="form-control" v-model="form.model" style="width: 100%;" placeholder="例如：16G 512G 灰色">
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>购入日期</label>
                <input type="date" class="form-control" v-model="form.purchaseDate" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>资产状态</label>
                <select class="form-control" v-model="form.status" style="width: 100%;">
                  <option value="闲置">闲置</option>
                  <option value="在用">在用</option>
                  <option value="维修中">维修中</option>
                  <option value="报废">报废</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;" v-if="form.status === '在用'">
              <div style="flex: 1;">
                <label>使用人</label>
                <select class="form-control" v-model="form.user" style="width: 100%;">
                  <option value="-">- (暂无)</option>
                  <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">
                    {{ emp.name }}
                  </option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>使用部门</label>
                <select class="form-control" v-model="form.dept" style="width: 100%;">
                  <option value="-">- (暂无)</option>
                  <option value="技术部">技术部</option>
                  <option value="市场部">市场部</option>
                  <option value="销售部">销售部</option>
                  <option value="行政部">行政部</option>
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

    <!-- 领用资产弹窗 -->
    <div class="modal-overlay" v-if="showAssignModal">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">资产领用分派</h3>
          <span class="modal-close" @click="closeAssignModal">&times;</span>
        </div>
        <form @submit.prevent="handleAssign">
          <div class="modal-body">
            <div class="form-group">
              <label>资产名称</label>
              <input type="text" class="form-control" :value="assignAssetData?.name" style="width: 100%;" disabled>
            </div>
            <div class="form-group">
              <label>领用人</label>
              <select class="form-control" v-model="assignForm.user" style="width: 100%;" required>
                <option value="" disabled>请选择领用人</option>
                <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">
                  {{ emp.name }} ({{ emp.dept }})
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAssignModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="!assignForm.user">确认领用</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addAsset, updateAsset, deleteAsset, Alert } from '../store';
import type { Asset } from '../store';

const searchKeyword = ref('');
const searchCategory = ref('');
const searchStatus = ref('');

const filterKeyword = ref('');
const filterCategory = ref('');
const filterStatus = ref('');

const currentPage = ref(1);
const pageSize = 10;

const showModal = ref(false);
const editingAsset = ref<Asset | null>(null);
const form = ref({
  name: '',
  category: '电子设备',
  model: '',
  user: '-',
  dept: '-',
  purchaseDate: '',
  status: '闲置'
});

const showAssignModal = ref(false);
const assignAssetData = ref<Asset | null>(null);
const assignForm = ref({
  user: ''
});

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterCategory.value = searchCategory.value;
  filterStatus.value = searchStatus.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchCategory.value = '';
  searchStatus.value = '';
  handleSearch();
};

const filteredAssets = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const cat = filterCategory.value;
  const stat = filterStatus.value;

  return store.assets.filter(a => {
    const matchKeyword = !keyword || a.name.toLowerCase().includes(keyword) || a.id.toLowerCase().includes(keyword);
    const matchCat = !cat || a.category === cat;
    const matchStat = !stat || a.status === stat;
    return matchKeyword && matchCat && matchStat;
  });
});

const totalPages = computed(() => Math.ceil(filteredAssets.value.length / pageSize) || 1);

const pagedAssets = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAssets.value.slice(start, start + pageSize);
});

const getStatusClass = (status: string) => {
  if (status === '在用') return 'success';
  if (status === '闲置') return 'info';
  if (status === '维修中') return 'warning';
  return 'danger';
};

const openModal = (asset: Asset | null = null) => {
  editingAsset.value = asset;
  if (asset) {
    form.value = {
      name: asset.name,
      category: asset.category,
      model: asset.model,
      user: asset.user,
      dept: asset.dept,
      purchaseDate: asset.purchaseDate,
      status: asset.status
    };
  } else {
    form.value = {
      name: '',
      category: '电子设备',
      model: '',
      user: '-',
      dept: '-',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: '闲置'
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingAsset.value = null;
};

const handleSave = () => {
  if (form.value.status !== '在用') {
    form.value.user = '-';
    form.value.dept = '-';
  }
  if (editingAsset.value) {
    updateAsset(editingAsset.value.id, form.value);
    alert('资产信息已更新！');
  } else {
    addAsset(form.value);
    alert('资产登记成功！');
  }
  closeModal();
};

const openAssignModal = (asset: Asset) => {
  assignAssetData.value = asset;
  assignForm.value.user = '';
  showAssignModal.value = true;
};

const closeAssignModal = () => {
  showAssignModal.value = false;
  assignAssetData.value = null;
};

const handleAssign = () => {
  if (assignAssetData.value) {
    const emp = store.employees.find(e => e.name === assignForm.value.user);
    updateAsset(assignAssetData.value.id, {
      status: '在用',
      user: assignForm.value.user,
      dept: emp ? emp.dept : '-'
    });
    alert(`资产已成功分配给: ${assignForm.value.user}`);
    closeAssignModal();
  }
};

const handleReturn = (id: string) => {
  Alert.alert('资产退库', '确认该资产办理退库退还吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '退库',
      onPress: () => {
        updateAsset(id, {
          status: '闲置',
          user: '-',
          dept: '-'
        });
        alert('资产已退库，状态变更为闲置。');
      }
    }
  ]);
};

const handleRepair = (id: string) => {
  Alert.alert('送修资产', '确认将该资产送修吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '送修',
      onPress: () => {
        updateAsset(id, {
          status: '维修中',
          user: '-',
          dept: '-'
        });
        alert('资产状态已变更为维修中。');
      }
    }
  ]);
};

const handleRepairComplete = (id: string) => {
  updateAsset(id, {
    status: '闲置'
  });
  alert('资产已修复，恢复为闲置待分配状态。');
};

const handleDelete = (id: string) => {
  Alert.alert('删除资产', '确定要删除此资产登记记录吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: () => {
        deleteAsset(id);
        alert('资产记录已删除！');
      }
    }
  ]);
};

const mockExport = () => {
  alert('资产清册导出成功！');
};
</script>

<style scoped>
.action-link.danger {
  color: var(--danger);
  margin-left: 8px;
}
.action-link.danger:hover {
  text-decoration: underline;
}
</style>
