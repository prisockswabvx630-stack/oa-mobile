<template>
  <div id="page-handover-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">工作交接</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openModal()">+ 发起交接</button>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>交接标题:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="交接标题/姓名">
      </div>
      <div class="filter-item">
        <label>状态:</label>
        <select class="form-control" v-model="searchStatus">
          <option value="">全部状态</option>
          <option value="待确认">待确认</option>
          <option value="交接中">交接中</option>
          <option value="已完成">已完成</option>
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
            <th>交接标题</th>
            <th>交接人</th>
            <th>接收人</th>
            <th>发起时间</th>
            <th>完成度</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedHandovers.length === 0">
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
          </tr>
          <tr v-else v-for="h in pagedHandovers" :key="h.id">
            <td style="font-weight: 500;">{{ h.title }}</td>
            <td>{{ h.sender }}</td>
            <td>{{ h.receiver }}</td>
            <td>{{ h.createTime }}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="progress-bar-container" style="width: 100px; margin: 0;">
                  <div class="progress-bar-fill" :style="{ width: h.progress + '%', backgroundColor: getProgressBarColor(h.progress) }"></div>
                </div>
                <span style="font-size: 12px; min-width: 32px; font-weight: 600;">{{ h.progress }}%</span>
              </div>
            </td>
            <td>
              <span class="badge" :class="getStatusClass(h.status)">
                {{ h.status }}
              </span>
            </td>
            <td>
              <template v-if="h.status === '待确认'">
                <span class="action-link" style="font-weight: 600;" @click="handleConfirm(h.id)">确认</span>
              </template>
              <template v-else>
                <span class="action-link" @click="viewDetail(h)">详情</span>
              </template>
              <span v-if="h.status !== '已完成'" class="action-link" @click="openModal(h)">进度更新</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredHandovers.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 发起交接 / 进度更新弹窗 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingHandover ? '更新交接进度' : '发起工作交接' }}</h3>
          <span class="modal-close" @click="closeModal">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div v-if="!editingHandover">
              <div class="form-group">
                <label>交接标题</label>
                <input type="text" class="form-control" v-model="form.title" style="width: 100%;" required placeholder="如：XX项目前端开发交接">
              </div>
              <div class="form-group" style="display: flex; gap: 16px;">
                <div style="flex: 1;">
                  <label>交接人</label>
                  <select class="form-control" v-model="form.sender" style="width: 100%;">
                    <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">
                      {{ emp.name }}
                    </option>
                  </select>
                </div>
                <div style="flex: 1;">
                  <label>接收人</label>
                  <select class="form-control" v-model="form.receiver" style="width: 100%;">
                    <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">
                      {{ emp.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>交接初始状态</label>
                <select class="form-control" v-model="form.status" style="width: 100%;">
                  <option value="待确认">待确认 (需接收人点击确认)</option>
                  <option value="交接中">交接中 (直接开始交接)</option>
                </select>
              </div>
            </div>
            <div v-else>
              <div class="form-group">
                <label>交接标题</label>
                <input type="text" class="form-control" :value="editingHandover.title" style="width: 100%;" disabled>
              </div>
              <div class="form-group" style="display: flex; gap: 16px;">
                <div style="flex: 1;">
                  <label>完成进度 (%)</label>
                  <input type="number" class="form-control" v-model.number="form.progress" min="0" max="100" style="width: 100%;" required>
                </div>
                <div style="flex: 1;">
                  <label>状态</label>
                  <select class="form-control" v-model="form.status" style="width: 100%;">
                    <option value="待确认">待确认</option>
                    <option value="交接中">交接中</option>
                    <option value="已完成">已完成</option>
                  </select>
                </div>
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
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">交接明细详情</h3>
          <span class="modal-close" @click="closeDetailModal">&times;</span>
        </div>
        <div class="modal-body" v-if="detailHandover">
          <div style="margin-bottom: 20px;">
            <strong style="color: var(--text-title); font-size: 16px;">{{ detailHandover.title }}</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span style="color: var(--text-muted);">交接人:</span>
              <strong style="color: var(--text-title);">{{ detailHandover.sender }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span style="color: var(--text-muted);">接收人:</span>
              <strong style="color: var(--text-title);">{{ detailHandover.receiver }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span style="color: var(--text-muted);">发起时间:</span>
              <span>{{ detailHandover.createTime }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span style="color: var(--text-muted);">完成进度:</span>
              <strong>{{ detailHandover.progress }}%</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-muted);">当前状态:</span>
              <span class="badge" :class="getStatusClass(detailHandover.status)">
                {{ detailHandover.status }}
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
import { ref, computed } from 'vue';
import { store, addHandover, updateHandover, confirmHandover, Alert } from '../store';
import type { Handover } from '../store';

const searchKeyword = ref('');
const searchStatus = ref('');

const filterKeyword = ref('');
const filterStatus = ref('');

const currentPage = ref(1);
const pageSize = 10;

const showModal = ref(false);
const editingHandover = ref<Handover | null>(null);
const form = ref({
  title: '',
  sender: '刘思彤',
  receiver: '张三',
  progress: 0,
  status: '待确认'
});

const showDetailModal = ref(false);
const detailHandover = ref<Handover | null>(null);

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterStatus.value = searchStatus.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchStatus.value = '';
  handleSearch();
};

const filteredHandovers = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const status = filterStatus.value;

  return store.handovers.filter(h => {
    const matchKeyword = !keyword || h.title.toLowerCase().includes(keyword) || h.sender.toLowerCase().includes(keyword) || h.receiver.toLowerCase().includes(keyword);
    const matchStatus = !status || h.status === status;
    return matchKeyword && matchStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredHandovers.value.length / pageSize) || 1);

const pagedHandovers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredHandovers.value.slice(start, start + pageSize);
});

const getStatusClass = (status: string) => {
  if (status === '已完成') return 'success';
  if (status === '交接中') return 'warning';
  return 'info';
};

const getProgressBarColor = (progress: number) => {
  if (progress >= 100) return 'var(--success)';
  if (progress > 0) return 'var(--warning)';
  return 'var(--text-muted)';
};

const openModal = (handover: Handover | null = null) => {
  editingHandover.value = handover;
  if (handover) {
    form.value = {
      title: handover.title,
      sender: handover.sender,
      receiver: handover.receiver,
      progress: handover.progress,
      status: handover.status
    };
  } else {
    form.value = {
      title: '',
      sender: '刘思彤',
      receiver: store.employees.find(e => e.name !== '刘思彤')?.name || '张三',
      progress: 0,
      status: '待确认'
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingHandover.value = null;
};

const handleSave = () => {
  if (editingHandover.value) {
    if (form.value.status === '已完成') {
      form.value.progress = 100;
    }
    updateHandover(editingHandover.value.id, form.value);
    alert('交接进度已更新！');
  } else {
    addHandover({
      title: form.value.title,
      sender: form.value.sender,
      receiver: form.value.receiver,
      progress: form.value.status === '交接中' ? 10 : 0,
      status: form.value.status
    });
    alert('工作交接已成功发起！');
  }
  closeModal();
};

const handleConfirm = (id: number) => {
  Alert.alert('工作交接确认', '是否确认开始接收此项工作交接？确认后交接进度将设定为100%并标记为已完成。', [
    { text: '取消', style: 'cancel' },
    {
      text: '确认接收',
      onPress: () => {
        confirmHandover(id);
        alert('交接已确认完成！');
      }
    }
  ]);
};

const viewDetail = (h: Handover) => {
  detailHandover.value = h;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  detailHandover.value = null;
};
</script>

<style scoped>
</style>
