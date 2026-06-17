<template>
  <div id="page-expense-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">费用报销管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreateModal">+ 申请报销</button>
      </div>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="stats-grid">
      <div class="stats-card card-purple">
        <div class="card-icon">💰</div>
        <div class="card-info">
          <div class="card-num">¥ {{ totalPendingAmount.toFixed(2) }}</div>
          <div class="card-label">待审核总额</div>
        </div>
      </div>
      <div class="stats-card card-green">
        <div class="card-icon">✅</div>
        <div class="card-info">
          <div class="card-num">¥ {{ totalVerifiedAmount.toFixed(2) }}</div>
          <div class="card-label">已核销打款额</div>
        </div>
      </div>
      <div class="stats-card card-blue">
        <div class="card-icon">📊</div>
        <div class="card-info">
          <div class="card-num">{{ expenses.length }} 笔</div>
          <div class="card-label">总申请笔数</div>
        </div>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="tabs-container">
      <div class="tab-nav">
        <div 
          class="tab-nav-item" 
          :class="{ active: activeTab === 'my' }"
          @click="activeTab = 'my'"
        >
          👤 我的报销申请
        </div>
        <div 
          class="tab-nav-item" 
          :class="{ active: activeTab === 'audit' }"
          @click="activeTab = 'audit'"
        >
          ⚖️ 工作流审批柜
        </div>
        <div 
          class="tab-nav-item" 
          :class="{ active: activeTab === 'finance' }"
          @click="activeTab = 'finance'"
        >
          🏦 财务付款核销
        </div>
        <div 
          class="tab-nav-item" 
          :class="{ active: activeTab === 'report' }"
          @click="activeTab = 'report'"
        >
          📈 报销数据分析
        </div>
      </div>

      <div class="tab-content">
        <!-- 搜索过滤栏 -->
        <div v-if="activeTab !== 'report'" class="filter-bar">
          <div class="filter-item">
            <label>单据状态:</label>
            <select class="form-control" v-model="filterStatus">
              <option value="">全部</option>
              <option value="pending">待审批 (Pending)</option>
              <option value="approved">审批通过 (Approved)</option>
              <option value="rejected">已驳回 (Rejected)</option>
              <option value="verified">已打款核销 (Verified)</option>
            </select>
          </div>
          <div class="filter-item">
            <label>报销类别:</label>
            <select class="form-control" v-model="filterType">
              <option value="">全部</option>
              <option value="日常报销">日常报销</option>
              <option value="差旅报销">差旅报销</option>
              <option value="对公费用报销">对公费用报销</option>
            </select>
          </div>
          <button class="btn btn-primary" @click="fetchData">🔍 刷新筛选</button>
        </div>

        <!-- 列表表格 -->
        <div v-if="activeTab !== 'report'" class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>报销单号</th>
                <th>申请人</th>
                <th>报销类型</th>
                <th>报销主题</th>
                <th>总金额</th>
                <th>申请日期</th>
                <th>当前状态</th>
                <th>财务批注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="9" style="text-align: center; color: var(--primary-color); padding: 30px;">
                  正在加载报销单据...
                </td>
              </tr>
              <tr v-else-if="filteredExpenses.length === 0">
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">
                  暂无报销单数据记录
                </td>
              </tr>
              <tr v-else v-for="item in filteredExpenses" :key="item.id">
                <td class="font-mono">{{ item.expense_no }}</td>
                <td style="font-weight: 500;">{{ item.real_name }}</td>
                <td>{{ item.type }}</td>
                <td>{{ item.title }}</td>
                <td class="amount-cell">¥ {{ Number(item.total_amount).toFixed(2) }}</td>
                <td>{{ formatDate(item.create_time) }}</td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="remark-cell" :title="item.financial_remark">{{ item.financial_remark || '-' }}</td>
                <td>
                  <span class="action-link" @click="viewDetails(item)">详情</span>
                  
                  <!-- 我的申请：可编辑、可删除 -->
                  <template v-if="activeTab === 'my'">
                    <span 
                      v-if="item.status === 'pending' || item.status === 'rejected'" 
                      class="action-link" 
                      @click="openEditModal(item)"
                    >
                      编辑
                    </span>
                    <span 
                      v-if="item.status === 'pending' || item.status === 'rejected'" 
                      class="action-link danger" 
                      @click="handleDelete(item.id)"
                    >
                      删除
                    </span>
                  </template>

                  <!-- 审批：审批/驳回 -->
                  <template v-if="activeTab === 'audit' && item.status === 'pending'">
                    <span class="action-link success" @click="handleApprove(item.id)">同意</span>
                    <span class="action-link danger" @click="promptReject(item.id)">驳回</span>
                  </template>

                  <!-- 核销：打款登记 -->
                  <template v-if="activeTab === 'finance' && item.status === 'approved'">
                    <span class="action-link verify" @click="promptVerify(item.id)">打款核销</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 报销数据分析看板 (F-OA-EXPENSE-REPORT) -->
        <div v-else class="report-dashboard">
          <div class="report-grid">
            <!-- 饼图分类统计 -->
            <div class="report-card">
              <h3 class="report-title">📊 报销类别金额占比</h3>
              <div class="chart-container">
                <div class="pie-chart-mock">
                  <!-- CSS 扇形模拟 -->
                  <div class="pie-slice slice-1" :style="{ transform: `rotate(0deg) skewY(${90 - (360 * categoryPercentages.traffic / 100)}deg)` }"></div>
                  <div class="pie-slice slice-2" :style="{ transform: `rotate(${3.6 * categoryPercentages.traffic}deg) skewY(${90 - (360 * categoryPercentages.dining / 100)}deg)` }"></div>
                  <div class="pie-slice slice-3" :style="{ transform: `rotate(${3.6 * (categoryPercentages.traffic + categoryPercentages.dining)}deg) skewY(${90 - (360 * categoryPercentages.hotel / 100)}deg)` }"></div>
                  <div class="pie-slice slice-4" :style="{ transform: `rotate(${3.6 * (100 - categoryPercentages.other)}deg) skewY(${90 - (360 * categoryPercentages.other / 100)}deg)` }"></div>
                  <div class="pie-center"></div>
                </div>
                <div class="chart-legends">
                  <div class="legend-item"><span class="color-dot traffic"></span> 交通费 ({{ categoryPercentages.traffic.toFixed(1) }}%) - ¥ {{ categoryTotals.traffic.toFixed(2) }}</div>
                  <div class="legend-item"><span class="color-dot dining"></span> 餐饮费 ({{ categoryPercentages.dining.toFixed(1) }}%) - ¥ {{ categoryTotals.dining.toFixed(2) }}</div>
                  <div class="legend-item"><span class="color-dot hotel"></span> 住宿费 ({{ categoryPercentages.hotel.toFixed(1) }}%) - ¥ {{ categoryTotals.hotel.toFixed(2) }}</div>
                  <div class="legend-item"><span class="color-dot other"></span> 其它类 ({{ categoryPercentages.other.toFixed(1) }}%) - ¥ {{ categoryTotals.other.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- 金额排行 -->
            <div class="report-card">
              <h3 class="report-title">🏅 员工报销额度排行 (TOP 5)</h3>
              <div class="rank-list">
                <div v-for="(rank, idx) in employeeRankings" :key="rank.name" class="rank-item">
                  <div class="rank-badge" :class="`badge-${idx+1}`">{{ idx + 1 }}</div>
                  <div class="rank-name">{{ rank.name }}</div>
                  <div class="rank-bar-bg">
                    <div class="rank-bar" :style="{ width: rank.percent + '%' }"></div>
                  </div>
                  <div class="rank-val">¥ {{ rank.total.toFixed(2) }}</div>
                </div>
                <div v-if="employeeRankings.length === 0" class="text-muted text-center py-4">暂无排行数据</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 申请/编辑 报销单 Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '✏️ 编辑费用报销申请' : '📝 新建费用报销申请' }}</h3>
          <span class="modal-close" @click="showEditModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="required-field">报销单主题</label>
              <input type="text" v-model="editForm.title" class="form-input" placeholder="例如：2026年Q2出差北京报销" />
            </div>
            <div class="form-group" style="width: 200px;">
              <label class="required-field">报销类型</label>
              <select v-model="editForm.type" class="form-input">
                <option value="日常报销">日常报销</option>
                <option value="差旅报销">差旅报销</option>
                <option value="对公费用报销">对公费用报销</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>报销事由原因</label>
            <textarea v-model="editForm.reason" rows="2" class="form-input" placeholder="请详细叙述报销用途及背景信息..."></textarea>
          </div>

          <!-- 明细细项 -->
          <div class="detail-section">
            <div class="detail-header">
              <span class="detail-title">📎 报销明细清单</span>
              <button class="btn btn-secondary btn-sm" @click="addDetailRow">+ 添加明细</button>
            </div>

            <div class="detail-table-wrapper">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th style="width: 140px">发生日期</th>
                    <th style="width: 130px">类目</th>
                    <th style="width: 120px">金额</th>
                    <th>说明描述</th>
                    <th>发票影像 (URL)</th>
                    <th style="width: 50px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in editForm.details" :key="idx">
                    <td>
                      <input type="date" v-model="row.item_date" class="form-input form-sm" />
                    </td>
                    <td>
                      <select v-model="row.category" class="form-input form-sm">
                        <option value="交通费">交通费 (Fares)</option>
                        <option value="餐饮费">餐饮费 (Meal)</option>
                        <option value="住宿费">住宿费 (Hotel)</option>
                        <option value="办公用品">办公用品 (Office)</option>
                        <option value="其他">其他费用 (Other)</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" step="0.01" min="0" v-model="row.amount" class="form-input form-sm text-right" placeholder="0.00" />
                    </td>
                    <td>
                      <input type="text" v-model="row.description" class="form-input form-sm" placeholder="说明该笔花费" />
                    </td>
                    <td>
                      <input type="text" v-model="row.invoice_url" class="form-input form-sm" placeholder="http://..." />
                    </td>
                    <td>
                      <span class="row-delete" @click="removeDetailRow(idx)">✕</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 总计 -->
            <div class="detail-footer">
              <span>总金额合计:</span>
              <span class="total-amount-highlight">¥ {{ calculatedTotalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="showEditModal = false">取消</button>
            <button class="btn-submit" :disabled="saving" @click="saveExpense">
              {{ saving ? '正在保存...' : '提交申请' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 报销单详情 Modal (包含工作流流转图) -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-card" style="max-width: 750px;">
        <div class="modal-header">
          <h3 class="modal-title">📑 报销单详情 ({{ detailItem.expense_no }})</h3>
          <span class="modal-close" @click="showDetailModal = false">✕</span>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <!-- 基础信息 -->
          <div class="detail-grid-info">
            <div class="info-cell"><strong>单号:</strong> <span class="font-mono">{{ detailItem.expense_no }}</span></div>
            <div class="info-cell"><strong>申请人:</strong> {{ detailItem.real_name }}</div>
            <div class="info-cell"><strong>类型:</strong> {{ detailItem.type }}</div>
            <div class="info-cell"><strong>当前状态:</strong> <span class="badge" :class="getStatusBadgeClass(detailItem.status)">{{ getStatusLabel(detailItem.status) }}</span></div>
            <div class="info-cell" style="grid-column: span 2;"><strong>主题:</strong> {{ detailItem.title }}</div>
            <div class="info-cell"><strong>总报销金额:</strong> <span class="amount-cell font-bold">¥ {{ Number(detailItem.total_amount).toFixed(2) }}</span></div>
            <div class="info-cell"><strong>申请日期:</strong> {{ formatDate(detailItem.create_time) }}</div>
            <div class="info-cell" style="grid-column: span 2;"><strong>报销事由:</strong> {{ detailItem.reason || '无' }}</div>
            <div v-if="detailItem.financial_remark" class="info-cell" style="grid-column: span 2; background-color: #fef3c7; padding: 8px 12px; border-radius: 6px; border: 1px solid #fde68a;">
              <strong>财务/审批批注:</strong> {{ detailItem.financial_remark }}
              <span v-if="detailItem.verify_time" style="display: block; font-size: 11px; color: #78350f; margin-top: 4px;">付款核销于: {{ formatDate(detailItem.verify_time) }}</span>
            </div>
          </div>

          <!-- 明细表格 -->
          <div style="margin-top: 20px;">
            <h4 style="margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #1e293b;">📋 报销费用项清单</h4>
            <div class="detail-table-wrapper" style="max-height: 200px;">
              <table class="detail-table" style="font-size: 12px;">
                <thead>
                  <tr>
                    <th>消费日期</th>
                    <th>目类</th>
                    <th style="text-align: right">报销金额</th>
                    <th>发票影像说明</th>
                    <th>发票地址</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in detailItem.details" :key="d.id">
                    <td>{{ formatSimpleDate(d.item_date) }}</td>
                    <td><span class="badge badge-category" :class="getCategoryClass(d.category)">{{ d.category }}</span></td>
                    <td class="amount-cell text-right" style="font-weight: 500;">¥ {{ Number(d.amount).toFixed(2) }}</td>
                    <td>{{ d.description || '-' }}</td>
                    <td>
                      <a v-if="d.invoice_url" :href="d.invoice_url" target="_blank" class="action-link">🖼️ 查看影像</a>
                      <span v-else class="text-muted">无</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 审批流转示意图 (Mermaid 简易 CSS 仿制版) -->
          <div class="workflow-visual">
            <h4 style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #1e293b;">⛵ 工作审批进度流</h4>
            <div class="flow-steps">
              <div class="flow-step completed">
                <div class="step-icon">👤</div>
                <div class="step-text">
                  <div class="step-name">发起报销</div>
                  <div class="step-user">{{ detailItem.real_name }}</div>
                </div>
              </div>
              <div class="flow-line completed"></div>
              
              <div class="flow-step" :class="{ completed: detailItem.status !== 'pending', active: detailItem.status === 'pending' }">
                <div class="step-icon">⚖️</div>
                <div class="step-text">
                  <div class="step-name">部门领导审核</div>
                  <div class="step-user">技术部总监</div>
                </div>
              </div>
              <div class="flow-line" :class="{ completed: detailItem.status === 'approved' || detailItem.status === 'verified' }"></div>

              <div class="flow-step" :class="{ completed: detailItem.status === 'verified', active: detailItem.status === 'approved' }">
                <div class="step-icon">🏦</div>
                <div class="step-text">
                  <div class="step-name">财务付款核销</div>
                  <div class="step-user">财务出纳</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="showDetailModal = false">关闭详情</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  getExpenses, 
  getExpenseDetail, 
  createExpense, 
  updateExpense, 
  deleteExpense, 
  approveExpense, 
  rejectExpense, 
  verifyExpense 
} from '../api';
import { Alert } from '../store';

const activeTab = ref<'my' | 'audit' | 'finance' | 'report'>('my');
const loading = ref(false);
const expenses = ref<any[]>([]);

// 筛选字段
const filterStatus = ref('');
const filterType = ref('');

// 获取当前登录用户ID
const currentUserId = computed(() => {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    const user = JSON.parse(userJson);
    return user.id;
  }
  return null;
});

// 获取所有数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (activeTab.value === 'my' && currentUserId.value) {
      params.user_id = currentUserId.value;
    }
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    if (filterType.value) {
      params.type = filterType.value;
    }
    const data: any = await getExpenses(params);
    expenses.value = data || [];
  } catch (error: any) {
    console.error('获取报销单列表失败:', error);
  } finally {
    loading.value = false;
  }
};

watch(activeTab, () => {
  filterStatus.value = '';
  filterType.value = '';
  fetchData();
});

onMounted(() => {
  fetchData();
});

// 统计分析数值计算
const totalPendingAmount = computed(() => {
  return expenses.value
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
});

const totalVerifiedAmount = computed(() => {
  return expenses.value
    .filter(e => e.status === 'verified')
    .reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
});

// 获取过滤后的报销单列表
const filteredExpenses = computed(() => {
  let list = expenses.value;
  // 额外拦截以防接口没有做 user_id 过滤
  if (activeTab.value === 'my' && currentUserId.value) {
    list = list.filter(e => String(e.user_id) === String(currentUserId.value));
  }
  if (activeTab.value === 'audit') {
    // 待审批看板
    list = list.filter(e => e.status === 'pending');
  }
  if (activeTab.value === 'finance') {
    // 待核销及已核销看板
    list = list.filter(e => e.status === 'approved' || e.status === 'verified');
  }
  return list;
});

// ========== 状态 & badge 文字转换 ==========
const getStatusLabel = (status: string) => {
  if (status === 'pending') return '待审批';
  if (status === 'approved') return '审批通过';
  if (status === 'rejected') return '已驳回';
  if (status === 'verified') return '已打款';
  return status;
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'pending') return 'warning';
  if (status === 'approved') return 'primary';
  if (status === 'rejected') return 'danger';
  if (status === 'verified') return 'success';
  return 'secondary';
};

const getCategoryClass = (cat: string) => {
  if (cat === '交通费') return 'traffic';
  if (cat === '餐饮费') return 'dining';
  if (cat === '住宿费') return 'hotel';
  return 'other';
};

// ========== 申请与编辑 Modal ==========
const showEditModal = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const editForm = ref<{
  id?: string;
  title: string;
  type: string;
  reason: string;
  details: Array<{
    item_date: string;
    category: string;
    amount: number;
    description: string;
    invoice_url: string;
  }>;
}>({
  title: '',
  type: '日常报销',
  reason: '',
  details: []
});

const calculatedTotalAmount = computed(() => {
  return editForm.value.details.reduce((sum, d) => sum + Number(d.amount || 0), 0);
});

const openCreateModal = () => {
  isEdit.value = false;
  editForm.value = {
    title: '',
    type: '日常报销',
    reason: '',
    details: [
      {
        item_date: new Date().toISOString().substring(0, 10),
        category: '交通费',
        amount: 0,
        description: '',
        invoice_url: ''
      }
    ]
  };
  showEditModal.value = true;
};

const openEditModal = (item: any) => {
  isEdit.value = true;
  editForm.value = {
    id: item.id,
    title: item.title,
    type: item.type,
    reason: item.reason,
    details: item.details.map((d: any) => ({
      item_date: new Date(d.item_date).toISOString().substring(0, 10),
      category: d.category,
      amount: Number(d.amount),
      description: d.description,
      invoice_url: d.invoice_url
    }))
  };
  showEditModal.value = true;
};

const addDetailRow = () => {
  editForm.value.details.push({
    item_date: new Date().toISOString().substring(0, 10),
    category: '交通费',
    amount: 0,
    description: '',
    invoice_url: ''
  });
};

const removeDetailRow = (idx: number) => {
  editForm.value.details.splice(idx, 1);
};

const saveExpense = async () => {
  if (!editForm.value.title.trim()) {
    alert('请填写报销单主题！');
    return;
  }
  if (editForm.value.details.length === 0) {
    alert('报销清单不能为空，必须添加至少一项费用明细！');
    return;
  }
  
  saving.value = true;
  try {
    const payload = {
      user_id: currentUserId.value,
      title: editForm.value.title,
      type: editForm.value.type,
      reason: editForm.value.reason,
      total_amount: calculatedTotalAmount.value,
      details: editForm.value.details
    };

    if (isEdit.value && editForm.value.id) {
      await updateExpense(editForm.value.id, payload);
      alert('修改报销申请成功，已提交审批！');
    } else {
      await createExpense(payload);
      alert('新建报销申请成功，已提交审批！');
    }

    showEditModal.value = false;
    fetchData();
  } catch (error: any) {
    alert('保存失败: ' + error.message);
  } finally {
    saving.value = false;
  }
};

// ========== 详情 Modal ==========
const showDetailModal = ref(false);
const detailItem = ref<any>({});

const viewDetails = async (item: any) => {
  try {
    const res = await getExpenseDetail(item.id);
    detailItem.value = res;
    showDetailModal.value = true;
  } catch (error: any) {
    alert('查看详情失败: ' + error.message);
  }
};

// ========== 操作处理 ==========
const handleDelete = async (id: any) => {
  Alert.alert('删除报销单', '确认删除该报销单据吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteExpense(id);
          alert('已删除报销单。');
          fetchData();
        } catch (err: any) {
          alert('删除失败: ' + err.message);
        }
      }
    }
  ]);
};

const handleApprove = async (id: any) => {
  try {
    await approveExpense(id);
    alert('审批已通过！');
    fetchData();
  } catch (err: any) {
    alert('操作失败: ' + err.message);
  }
};

const promptReject = async (id: any) => {
  Alert.prompt(
    '驳回申请',
    '请输入驳回原因/审核意见：',
    [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async (remark) => {
          try {
            await rejectExpense(id, remark || '审批拒绝');
            alert('单据已驳回。');
            fetchData();
          } catch (err: any) {
            alert('操作失败: ' + err.message);
          }
        }
      }
    ]
  );
};

const promptVerify = async (id: any) => {
  Alert.prompt(
    '打款核销',
    '请输入财务付款备注（可留空）：',
    [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async (remark) => {
          try {
            await verifyExpense(id, remark || '');
            alert('财务打款核销确认成功！');
            fetchData();
          } catch (err: any) {
            alert('操作失败: ' + err.message);
          }
        }
      }
    ],
    '财务已线下打款核销完毕'
  );
};

// ========== 数据分析 & 报表 (F-OA-EXPENSE-REPORT) ==========
const categoryTotals = computed(() => {
  const totals = { traffic: 0, dining: 0, hotel: 0, other: 0 };
  expenses.value.forEach(e => {
    if (e.details && Array.isArray(e.details)) {
      e.details.forEach((d: any) => {
        const amt = Number(d.amount || 0);
        if (d.category === '交通费') totals.traffic += amt;
        else if (d.category === '餐饮费') totals.dining += amt;
        else if (d.category === '住宿费') totals.hotel += amt;
        else totals.other += amt;
      });
    }
  });
  return totals;
});

const categoryPercentages = computed(() => {
  const t = categoryTotals.value;
  const sum = t.traffic + t.dining + t.hotel + t.other;
  if (sum === 0) return { traffic: 25, dining: 25, hotel: 25, other: 25 };
  return {
    traffic: (t.traffic / sum) * 100,
    dining: (t.dining / sum) * 100,
    hotel: (t.hotel / sum) * 100,
    other: (t.other / sum) * 100
  };
});

const employeeRankings = computed(() => {
  const userAmtMap = new Map<string, number>();
  expenses.value.forEach(e => {
    const amt = Number(e.total_amount || 0);
    const name = e.real_name || '未知用户';
    userAmtMap.set(name, (userAmtMap.get(name) || 0) + amt);
  });

  const list = Array.from(userAmtMap.entries()).map(([name, total]) => ({
    name,
    total
  }));

  list.sort((a, b) => b.total - a.total);
  const topList = list.slice(0, 5);

  const maxTotal = topList[0]?.total || 1;
  return topList.map(item => ({
    ...item,
    percent: Math.min(100, (item.total / maxTotal) * 100)
  }));
});

// ========== 格式化 ==========
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour12: false });
};

const formatSimpleDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN');
};
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stats-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-purple { border-left: 5px solid #a855f7; }
.card-green { border-left: 5px solid #10b981; }
.card-blue { border-left: 5px solid #3b82f6; }

.card-icon {
  font-size: 28px;
  width: 50px;
  height: 50px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-num {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.card-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.tabs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.tab-nav {
  display: flex;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.tab-nav-item {
  padding: 16px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-nav-item:hover {
  color: var(--primary-color, #6366f1);
  background-color: #f1f5f9;
}

.tab-nav-item.active {
  color: var(--primary-color, #6366f1);
  border-bottom-color: var(--primary-color, #6366f1);
  background-color: white;
}

.tab-content {
  padding: 24px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #edf2f7;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.filter-item select {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  font-size: 13px;
}

.font-mono {
  font-family: monospace;
  font-weight: 600;
}

.amount-cell {
  color: #10b981;
  font-weight: 700;
}

.font-bold {
  font-weight: bold;
}

.remark-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-link.success { color: #10b981; }
.action-link.verify { color: #3b82f6; }

/* 报表可视化 */
.report-dashboard {
  padding: 10px 0;
}

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.report-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.report-title {
  margin: 0 0 20px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.chart-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 20px;
  padding: 10px 0;
}

.pie-chart-mock {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: #e2e8f0;
  overflow: hidden;
}

.pie-slice {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  transform-origin: 50% 50%;
}

.slice-1 { background-color: #6366f1; } /* 交通 */
.slice-2 { background-color: #10b981; } /* 餐饮 */
.slice-3 { background-color: #f59e0b; } /* 住宿 */
.slice-4 { background-color: #94a3b8; } /* 其他 */

.pie-center {
  position: absolute;
  top: 30px; left: 30px;
  width: 80px; height: 80px;
  background-color: white;
  border-radius: 50%;
}

.chart-legends {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.color-dot.traffic { background-color: #6366f1; }
.color-dot.dining { background-color: #10b981; }
.color-dot.hotel { background-color: #f59e0b; }
.color-dot.other { background-color: #94a3b8; }

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background-color: #f1f5f9;
  color: #64748b;
}

.rank-badge.badge-1 { background-color: #fef08a; color: #854d0e; }
.rank-badge.badge-2 { background-color: #e2e8f0; color: #475569; }
.rank-badge.badge-3 { background-color: #ffedd5; color: #c2410c; }

.rank-name {
  width: 60px;
  font-weight: 500;
  font-size: 13px;
}

.rank-bar-bg {
  flex: 1;
  height: 8px;
  background-color: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  border-radius: 4px;
}

.rank-val {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  width: 80px;
  text-align: right;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-card {
  width: 90%;
  max-width: 650px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  font-size: 18px;
  color: #64748b;
  cursor: pointer;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  text-align: left;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.required-field::after {
  content: " *";
  color: #ef4444;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--primary-color, #6366f1);
}

textarea.form-input {
  resize: vertical;
}

/* 报销清单明细明细段落 */
.detail-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  margin-top: 20px;
  text-align: left;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.detail-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.detail-table th, .detail-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
  text-align: left;
}

.form-sm {
  padding: 4px 8px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
}

.row-delete {
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.total-amount-highlight {
  font-size: 18px;
  color: #ef4444;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  background-color: white;
  cursor: pointer;
}

.btn-submit {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  background-color: var(--primary-color, #6366f1);
  color: white;
  cursor: pointer;
}

/* 详情模态框的排版 */
.detail-grid-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: left;
  font-size: 13px;
}

.info-cell {
  color: #334155;
}

.badge-category {
  font-size: 11px;
}
.badge-category.traffic { background-color: #e0e7ff; color: #4338ca; }
.badge-category.dining { background-color: #d1fae5; color: #065f46; }
.badge-category.hotel { background-color: #fef3c7; color: #d97706; }
.badge-category.other { background-color: #f1f5f9; color: #475569; }

/* 工作流进度展示 (仿Mermaid) */
.workflow-visual {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  margin-top: 24px;
  text-align: left;
}

.flow-steps {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 16px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.5;
  transition: opacity 0.3s;
  width: 100px;
}

.flow-step.completed {
  opacity: 1;
}

.flow-step.active {
  opacity: 1;
}

.step-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 2;
}

.flow-step.completed .step-icon {
  border-color: #10b981;
  background-color: #d1fae5;
  color: #047857;
}

.flow-step.active .step-icon {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #1d4ed8;
  animation: pulse 1.5s infinite;
}

.step-text {
  text-align: center;
}

.step-name {
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
}

.step-user {
  font-size: 9px;
  color: #64748b;
  margin-top: 2px;
}

.flow-line {
  flex: 1;
  height: 2px;
  background-color: #cbd5e1;
  margin-bottom: 24px;
  z-index: 1;
}

.flow-line.completed {
  background-color: #10b981;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}
</style>
