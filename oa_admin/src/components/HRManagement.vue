<template>
  <div id="page-hr-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">人事管理</h2>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="mockExport">📤 导出</button>
        <button class="btn btn-primary" @click="$emit('open-user-modal')">+ 新增员工</button>
      </div>
    </div>

    <!-- Tab 导航 -->
    <div class="hr-tabs-container">
      <div class="tab-nav">
        <div class="tab-nav-item" :class="{ active: activeTab === 'roster' }" @click="switchTab('roster')">📇 花名册</div>
        <div class="tab-nav-item" :class="{ active: activeTab === 'onboarding' }" @click="switchTab('onboarding')">📥 入职办理</div>
        <div class="tab-nav-item" :class="{ active: activeTab === 'contract' }" @click="switchTab('contract')">📋 合同管理</div>
        <div class="tab-nav-item" :class="{ active: activeTab === 'transfer' }" @click="switchTab('transfer')">🔄 异动调岗</div>
        <div class="tab-nav-item" :class="{ active: activeTab === 'training' }" @click="switchTab('training')">🎓 培训发展</div>
        <div class="tab-nav-item" :class="{ active: activeTab === 'offboarding' }" @click="switchTab('offboarding')">📤 离职管理</div>
      </div>

      <div class="tab-content">

        <!-- ==================== Tab 1: 花名册 ==================== -->
        <template v-if="activeTab === 'roster'">
          <div class="filter-bar">
            <div class="filter-item">
              <label>关键词:</label>
              <input type="text" class="form-control form-control-search" v-model="rosterSearch" placeholder="姓名/工号/职位">
            </div>
            <div class="filter-item">
              <label>员工状态:</label>
              <select class="form-control" v-model="rosterStatus">
                <option value="">全部</option>
                <option value="在职">在职</option>
                <option value="试用期">试用期</option>
                <option value="离职">离职</option>
              </select>
            </div>
            <button class="btn btn-primary" @click="rosterPage = 1">🔍 搜索</button>
            <button class="btn btn-secondary" @click="rosterSearch = ''; rosterStatus = ''; rosterPage = 1">🔄 重置</button>
            <button class="btn btn-secondary" @click="handleBatchGenerate" :disabled="batchGenerating">📋 {{ batchGenerating ? '生成中...' : '批量生成合同' }}</button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>工号</th><th>姓名</th><th>性别</th><th>部门</th><th>职位</th><th>入职日期</th><th>合同到期</th><th>状态</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="rosterPaged.length === 0">
                  <td colspan="9" class="empty-cell">暂无数据</td>
                </tr>
                <tr v-for="emp in rosterPaged" :key="emp.id">
                  <td class="font-bold">{{ emp.id }}</td>
                  <td>{{ emp.name }}</td>
                  <td>{{ emp.gender }}</td>
                  <td>{{ emp.dept }}</td>
                  <td>{{ emp.position }}</td>
                  <td>{{ emp.joinDate }}</td>
                  <td>{{ emp.contractEnd }}</td>
                  <td><span class="badge" :class="statusBadge(emp.hrStatus)">{{ emp.hrStatus }}</span></td>
                  <td>
                    <span class="action-link" @click="viewEmployee(emp)">查看</span>
                    <span class="action-link" @click="$emit('open-user-modal', emp.id)">编辑</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-container">
              <div>共 {{ rosterFiltered.length }} 条记录</div>
              <div class="pagination-pages">
                <button class="page-btn" :disabled="rosterPage === 1" @click="rosterPage--">◀</button>
                <button v-for="p in rosterTotalPages" :key="p" class="page-btn" :class="{ active: rosterPage === p }" @click="rosterPage = p">{{ p }}</button>
                <button class="page-btn" :disabled="rosterPage === rosterTotalPages" @click="rosterPage++">▶</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== Tab 2: 入职办理 ==================== -->
        <template v-if="activeTab === 'onboarding'">
          <div class="filter-bar">
            <div class="filter-item">
              <label>关键词:</label>
              <input type="text" class="form-control form-control-search" v-model="onboardSearch" placeholder="姓名/工号">
            </div>
            <button class="btn btn-primary" @click="onboardPage = 1">🔍 搜索</button>
            <button class="btn btn-secondary" @click="onboardSearch = ''; onboardPage = 1">🔄 重置</button>
            <button class="btn btn-primary" @click="openOnboardModal()">+ 新增入职</button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>工号</th><th>姓名</th><th>性别</th><th>部门</th><th>职位</th><th>入职日期</th><th>状态</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="onboardPaged.length === 0">
                  <td colspan="8" class="empty-cell">暂无试用期员工</td>
                </tr>
                <tr v-for="emp in onboardPaged" :key="emp.id">
                  <td class="font-bold">{{ emp.id }}</td>
                  <td>{{ emp.name }}</td>
                  <td>{{ emp.gender }}</td>
                  <td>{{ emp.dept }}</td>
                  <td>{{ emp.position }}</td>
                  <td>{{ emp.joinDate }}</td>
                  <td><span class="badge badge-warning">试用期</span></td>
                  <td>
                    <span class="action-link success" @click="confirmOnboard(emp)">办理转正</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-container">
              <div>共 {{ onboardFiltered.length }} 条记录</div>
              <div class="pagination-pages">
                <button class="page-btn" :disabled="onboardPage === 1" @click="onboardPage--">◀</button>
                <button v-for="p in onboardTotalPages" :key="p" class="page-btn" :class="{ active: onboardPage === p }" @click="onboardPage = p">{{ p }}</button>
                <button class="page-btn" :disabled="onboardPage === onboardTotalPages" @click="onboardPage++">▶</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== Tab 3: 合同管理 ==================== -->
        <template v-if="activeTab === 'contract'">
          <div class="filter-bar">
            <div class="filter-item">
              <label>关键词:</label>
              <input type="text" class="form-control form-control-search" v-model="contractSearch" placeholder="合同编号/姓名/工号">
            </div>
            <div class="filter-item">
              <label>状态:</label>
              <select class="form-control" v-model="contractStatus">
                <option value="">全部</option>
                <option value="生效中">生效中</option>
                <option value="待签署">待签署</option>
                <option value="已到期">已到期</option>
                <option value="已续签">已续签</option>
              </select>
            </div>
            <button class="btn btn-primary" @click="contractPage = 1">🔍 搜索</button>
            <button class="btn btn-secondary" @click="contractSearch = ''; contractStatus = ''; contractPage = 1">🔄 重置</button>
            <button class="btn btn-primary" @click="openContractModal()">+ 新增合同</button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>合同编号</th><th>工号</th><th>姓名</th><th>部门</th><th>合同类型</th><th>起始日</th><th>终止日</th><th>状态</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="contractPaged.length === 0">
                  <td colspan="9" class="empty-cell">暂无合同数据</td>
                </tr>
                <tr v-for="c in contractPaged" :key="c.id" :class="{ 'row-warning': isContractExpiring(c) }">
                  <td class="font-bold">{{ c.id }}</td>
                  <td>{{ c.empId }}</td>
                  <td>{{ c.empName }}</td>
                  <td>{{ c.dept }}</td>
                  <td>{{ c.type }}</td>
                  <td>{{ c.startDate }}</td>
                  <td>{{ c.endDate }}</td>
                  <td>
                    <span class="badge" :class="contractBadge(c.status)">{{ c.status }}</span>
                    <span v-if="isContractExpiring(c)" class="badge badge-warning" style="margin-left:4px;font-size:11px;">即将到期</span>
                  </td>
                  <td>
                    <span class="action-link" @click="viewContract(c)">查看</span>
                    <span class="action-link" @click="openContractModal(c)">编辑</span>
                    <span class="action-link danger" @click="handleDeleteContract(c)">删除</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-container">
              <div>共 {{ contractFiltered.length }} 条记录</div>
              <div class="pagination-pages">
                <button class="page-btn" :disabled="contractPage === 1" @click="contractPage--">◀</button>
                <button v-for="p in contractTotalPages" :key="p" class="page-btn" :class="{ active: contractPage === p }" @click="contractPage = p">{{ p }}</button>
                <button class="page-btn" :disabled="contractPage === contractTotalPages" @click="contractPage++">▶</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== Tab 4: 异动调岗 ==================== -->
        <template v-if="activeTab === 'transfer'">
          <div class="filter-bar">
            <div class="filter-item">
              <label>关键词:</label>
              <input type="text" class="form-control form-control-search" v-model="transferSearch" placeholder="单号/姓名/工号">
            </div>
            <div class="filter-item">
              <label>类型:</label>
              <select class="form-control" v-model="transferType">
                <option value="">全部</option>
                <option value="调岗">调岗</option>
                <option value="晋升">晋升</option>
                <option value="降级">降级</option>
                <option value="部门调动">部门调动</option>
                <option value="借调">借调</option>
              </select>
            </div>
            <div class="filter-item">
              <label>状态:</label>
              <select class="form-control" v-model="transferStatus">
                <option value="">全部</option>
                <option value="待审批">待审批</option>
                <option value="已通过">已通过</option>
                <option value="已拒绝">已拒绝</option>
                <option value="已生效">已生效</option>
              </select>
            </div>
            <button class="btn btn-primary" @click="transferPage = 1">🔍 搜索</button>
            <button class="btn btn-secondary" @click="transferSearch = ''; transferType = ''; transferStatus = ''; transferPage = 1">🔄 重置</button>
            <button class="btn btn-primary" @click="openTransferModal()">+ 发起异动</button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>异动单号</th><th>工号</th><th>姓名</th><th>类型</th><th>原部门/职位</th><th>新部门/职位</th><th>生效日期</th><th>状态</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="transferPaged.length === 0">
                  <td colspan="9" class="empty-cell">暂无异动记录</td>
                </tr>
                <tr v-for="t in transferPaged" :key="t.id">
                  <td class="font-bold">{{ t.id }}</td>
                  <td>{{ t.empId }}</td>
                  <td>{{ t.empName }}</td>
                  <td><span class="badge" :class="transferTypeBadge(t.type)">{{ t.type }}</span></td>
                  <td>{{ t.fromDept }} / {{ t.fromPosition }}</td>
                  <td>{{ t.toDept }} / {{ t.toPosition }}</td>
                  <td>{{ t.effectiveDate }}</td>
                  <td><span class="badge" :class="transferStatusBadge(t.status)">{{ t.status }}</span></td>
                  <td>
                    <span class="action-link" @click="viewTransfer(t)">查看</span>
                    <span v-if="t.status === '待审批'" class="action-link success" @click="approveTransfer(t)">通过</span>
                    <span v-if="t.status === '待审批'" class="action-link danger" @click="rejectTransfer(t)">拒绝</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-container">
              <div>共 {{ transferFiltered.length }} 条记录</div>
              <div class="pagination-pages">
                <button class="page-btn" :disabled="transferPage === 1" @click="transferPage--">◀</button>
                <button v-for="p in transferTotalPages" :key="p" class="page-btn" :class="{ active: transferPage === p }" @click="transferPage = p">{{ p }}</button>
                <button class="page-btn" :disabled="transferPage === transferTotalPages" @click="transferPage++">▶</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== Tab 5: 培训发展 ==================== -->
        <template v-if="activeTab === 'training'">
          <div class="filter-bar">
            <div class="filter-item">
              <label>关键词:</label>
              <input type="text" class="form-control form-control-search" v-model="trainingSearch" placeholder="培训名称/讲师">
            </div>
            <div class="filter-item">
              <label>类型:</label>
              <select class="form-control" v-model="trainingType">
                <option value="">全部</option>
                <option value="入职培训">入职培训</option>
                <option value="技能培训">技能培训</option>
                <option value="管理培训">管理培训</option>
                <option value="安全培训">安全培训</option>
                <option value="合规培训">合规培训</option>
              </select>
            </div>
            <div class="filter-item">
              <label>状态:</label>
              <select class="form-control" v-model="trainingStatus">
                <option value="">全部</option>
                <option value="未开始">未开始</option>
                <option value="进行中">进行中</option>
                <option value="已完成">已完成</option>
                <option value="已取消">已取消</option>
              </select>
            </div>
            <button class="btn btn-primary" @click="trainingPage = 1">🔍 搜索</button>
            <button class="btn btn-secondary" @click="trainingSearch = ''; trainingType = ''; trainingStatus = ''; trainingPage = 1">🔄 重置</button>
            <button class="btn btn-primary" @click="openTrainingModal()">+ 新增培训</button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>培训编号</th><th>培训名称</th><th>类型</th><th>讲师</th><th>开始日期</th><th>结束日期</th><th>课时</th><th>参训人数</th><th>状态</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="trainingPaged.length === 0">
                  <td colspan="10" class="empty-cell">暂无培训计划</td>
                </tr>
                <tr v-for="t in trainingPaged" :key="t.id">
                  <td class="font-bold">{{ t.id }}</td>
                  <td>{{ t.name }}</td>
                  <td>{{ t.type }}</td>
                  <td>{{ t.instructor }}</td>
                  <td>{{ t.startDate }}</td>
                  <td>{{ t.endDate }}</td>
                  <td>{{ t.hours }}h</td>
                  <td>{{ t.participants }}人</td>
                  <td><span class="badge" :class="trainingStatusBadge(t.status)">{{ t.status }}</span></td>
                  <td>
                    <span class="action-link" @click="viewTraining(t)">查看</span>
                    <span class="action-link" @click="openTrainingModal(t)">编辑</span>
                    <span class="action-link danger" @click="handleDeleteTraining(t)">删除</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-container">
              <div>共 {{ trainingFiltered.length }} 条记录</div>
              <div class="pagination-pages">
                <button class="page-btn" :disabled="trainingPage === 1" @click="trainingPage--">◀</button>
                <button v-for="p in trainingTotalPages" :key="p" class="page-btn" :class="{ active: trainingPage === p }" @click="trainingPage = p">{{ p }}</button>
                <button class="page-btn" :disabled="trainingPage === trainingTotalPages" @click="trainingPage++">▶</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== Tab 6: 离职管理 ==================== -->
        <template v-if="activeTab === 'offboarding'">
          <div class="filter-bar">
            <div class="filter-item">
              <label>关键词:</label>
              <input type="text" class="form-control form-control-search" v-model="offboardSearch" placeholder="单号/姓名/工号">
            </div>
            <div class="filter-item">
              <label>状态:</label>
              <select class="form-control" v-model="offboardStatus">
                <option value="">全部</option>
                <option value="待审批">待审批</option>
                <option value="审批中">审批中</option>
                <option value="已通过">已通过</option>
                <option value="已完成">已完成</option>
                <option value="已拒绝">已拒绝</option>
              </select>
            </div>
            <button class="btn btn-primary" @click="offboardPage = 1">🔍 搜索</button>
            <button class="btn btn-secondary" @click="offboardSearch = ''; offboardStatus = ''; offboardPage = 1">🔄 重置</button>
            <button class="btn btn-primary" @click="openOffboardModal()">+ 发起离职</button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>离职单号</th><th>工号</th><th>姓名</th><th>部门</th><th>离职类型</th><th>最后工作日</th><th>交接状态</th><th>审批状态</th><th>归档</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="offboardPaged.length === 0">
                  <td colspan="10" class="empty-cell">暂无离职记录</td>
                </tr>
                <tr v-for="o in offboardPaged" :key="o.id">
                  <td class="font-bold">{{ o.id }}</td>
                  <td>{{ o.empId }}</td>
                  <td>{{ o.empName }}</td>
                  <td>{{ o.dept }}</td>
                  <td>{{ o.type }}</td>
                  <td>{{ o.lastWorkDate }}</td>
                  <td><span class="badge" :class="handoverBadge(o.handoverStatus)">{{ o.handoverStatus }}</span></td>
                  <td><span class="badge" :class="offboardStatusBadge(o.status)">{{ o.status }}</span></td>
                  <td><span class="badge" :class="o.archiveStatus === '已归档' ? 'badge-success' : 'badge-secondary'">{{ o.archiveStatus }}</span></td>
                  <td>
                    <span class="action-link" @click="viewOffboard(o)">查看</span>
                    <span v-if="o.status === '待审批'" class="action-link success" @click="approveOffboard(o)">通过</span>
                    <span v-if="o.status === '已通过' && o.archiveStatus === '未归档'" class="action-link" @click="archiveOffboard(o)">归档</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-container">
              <div>共 {{ offboardFiltered.length }} 条记录</div>
              <div class="pagination-pages">
                <button class="page-btn" :disabled="offboardPage === 1" @click="offboardPage--">◀</button>
                <button v-for="p in offboardTotalPages" :key="p" class="page-btn" :class="{ active: offboardPage === p }" @click="offboardPage = p">{{ p }}</button>
                <button class="page-btn" :disabled="offboardPage === offboardTotalPages" @click="offboardPage++">▶</button>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- ==================== 合同编辑弹窗 ==================== -->
    <div v-if="showContractModal" class="modal-overlay" @click.self="showContractModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ contractEditId ? '✏️ 编辑合同' : '📝 新增合同' }}</h3>
          <span class="modal-close" @click="showContractModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">员工工号</label>
              <input class="form-input" v-model="contractForm.empId" placeholder="请输入工号">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">员工姓名</label>
              <input class="form-input" v-model="contractForm.empName" placeholder="请输入姓名">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>部门</label>
              <input class="form-input" v-model="contractForm.dept" placeholder="请输入部门">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">合同类型</label>
              <select class="form-input" v-model="contractForm.type">
                <option value="固定期限">固定期限</option>
                <option value="无固定期限">无固定期限</option>
                <option value="实习协议">实习协议</option>
                <option value="劳务合同">劳务合同</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">合同起始日</label>
              <input type="date" class="form-input" v-model="contractForm.startDate">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">合同终止日</label>
              <input type="date" class="form-input" v-model="contractForm.endDate">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>合同期限</label>
              <input class="form-input" v-model="contractForm.duration" placeholder="如: 3年">
            </div>
            <div class="form-group flex-1">
              <label>约定薪资</label>
              <input class="form-input" v-model="contractForm.salary" placeholder="如: 15000元/月">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>签署日期</label>
              <input type="date" class="form-input" v-model="contractForm.signDate">
            </div>
            <div class="form-group flex-1">
              <label>状态</label>
              <select class="form-input" v-model="contractForm.status">
                <option value="待签署">待签署</option>
                <option value="生效中">生效中</option>
                <option value="已到期">已到期</option>
                <option value="已续签">已续签</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea class="form-input" v-model="contractForm.remark" rows="2" placeholder="备注信息"></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showContractModal = false">取消</button>
            <button class="btn-submit" @click="saveContract">保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 合同详情弹窗 ==================== -->
    <div v-if="showContractDetail" class="modal-overlay" @click.self="showContractDetail = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">📋 合同详情</h3>
          <span class="modal-close" @click="showContractDetail = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="detail-grid-info">
            <div class="info-cell"><strong>合同编号:</strong> {{ contractDetail.id }}</div>
            <div class="info-cell"><strong>员工工号:</strong> {{ contractDetail.empId }}</div>
            <div class="info-cell"><strong>员工姓名:</strong> {{ contractDetail.empName }}</div>
            <div class="info-cell"><strong>部门:</strong> {{ contractDetail.dept }}</div>
            <div class="info-cell"><strong>合同类型:</strong> {{ contractDetail.type }}</div>
            <div class="info-cell"><strong>合同期限:</strong> {{ contractDetail.duration }}</div>
            <div class="info-cell"><strong>起始日期:</strong> {{ contractDetail.startDate }}</div>
            <div class="info-cell"><strong>终止日期:</strong> {{ contractDetail.endDate }}</div>
            <div class="info-cell"><strong>签署日期:</strong> {{ contractDetail.signDate }}</div>
            <div class="info-cell"><strong>约定薪资:</strong> {{ contractDetail.salary }}</div>
            <div class="info-cell"><strong>状态:</strong> {{ contractDetail.status }}</div>
          </div>
          <div v-if="contractDetail.remark" style="margin-top:12px;font-size:13px;color:#475569;">
            <strong>备注:</strong> {{ contractDetail.remark }}
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showContractDetail = false">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 异动弹窗 ==================== -->
    <div v-if="showTransferModal" class="modal-overlay" @click.self="showTransferModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">🔄 发起异动调岗</h3>
          <span class="modal-close" @click="showTransferModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">员工工号</label>
              <input class="form-input" v-model="transferForm.empId" placeholder="请输入工号">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">员工姓名</label>
              <input class="form-input" v-model="transferForm.empName" placeholder="请输入姓名">
            </div>
          </div>
          <div class="form-group">
            <label class="required-field">异动类型</label>
            <select class="form-input" v-model="transferForm.type">
              <option value="调岗">调岗</option>
              <option value="晋升">晋升</option>
              <option value="降级">降级</option>
              <option value="部门调动">部门调动</option>
              <option value="借调">借调</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">原部门</label>
              <input class="form-input" v-model="transferForm.fromDept" placeholder="原部门">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">新部门</label>
              <input class="form-input" v-model="transferForm.toDept" placeholder="新部门">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">原职位</label>
              <input class="form-input" v-model="transferForm.fromPosition" placeholder="原职位">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">新职位</label>
              <input class="form-input" v-model="transferForm.toPosition" placeholder="新职位">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">生效日期</label>
              <input type="date" class="form-input" v-model="transferForm.effectiveDate">
            </div>
            <div class="form-group flex-1">
              <label>审批人</label>
              <input class="form-input" v-model="transferForm.approver" placeholder="审批人">
            </div>
          </div>
          <div class="form-group">
            <label>异动原因</label>
            <textarea class="form-input" v-model="transferForm.reason" rows="2" placeholder="请填写异动原因"></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showTransferModal = false">取消</button>
            <button class="btn-submit" @click="saveTransfer">提交</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 异动详情弹窗 ==================== -->
    <div v-if="showTransferDetail" class="modal-overlay" @click.self="showTransferDetail = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">🔄 异动详情</h3>
          <span class="modal-close" @click="showTransferDetail = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="detail-grid-info">
            <div class="info-cell"><strong>异动单号:</strong> {{ transferDetail.id }}</div>
            <div class="info-cell"><strong>员工:</strong> {{ transferDetail.empName }} ({{ transferDetail.empId }})</div>
            <div class="info-cell"><strong>异动类型:</strong> {{ transferDetail.type }}</div>
            <div class="info-cell"><strong>生效日期:</strong> {{ transferDetail.effectiveDate }}</div>
            <div class="info-cell"><strong>原部门/职位:</strong> {{ transferDetail.fromDept }} / {{ transferDetail.fromPosition }}</div>
            <div class="info-cell"><strong>新部门/职位:</strong> {{ transferDetail.toDept }} / {{ transferDetail.toPosition }}</div>
            <div class="info-cell"><strong>审批人:</strong> {{ transferDetail.approver }}</div>
            <div class="info-cell"><strong>状态:</strong> {{ transferDetail.status }}</div>
          </div>
          <div v-if="transferDetail.reason" style="margin-top:12px;font-size:13px;color:#475569;">
            <strong>异动原因:</strong> {{ transferDetail.reason }}
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showTransferDetail = false">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 培训弹窗 ==================== -->
    <div v-if="showTrainingModal" class="modal-overlay" @click.self="showTrainingModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ trainingEditId ? '✏️ 编辑培训计划' : '📝 新增培训计划' }}</h3>
          <span class="modal-close" @click="showTrainingModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required-field">培训名称</label>
            <input class="form-input" v-model="trainingForm.name" placeholder="请输入培训名称">
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">培训类型</label>
              <select class="form-input" v-model="trainingForm.type">
                <option value="入职培训">入职培训</option>
                <option value="技能培训">技能培训</option>
                <option value="管理培训">管理培训</option>
                <option value="安全培训">安全培训</option>
                <option value="合规培训">合规培训</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>讲师</label>
              <input class="form-input" v-model="trainingForm.instructor" placeholder="请输入讲师">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">开始日期</label>
              <input type="date" class="form-input" v-model="trainingForm.startDate">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">结束日期</label>
              <input type="date" class="form-input" v-model="trainingForm.endDate">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>培训地点</label>
              <input class="form-input" v-model="trainingForm.location" placeholder="请输入地点">
            </div>
            <div class="form-group flex-1">
              <label>培训课时</label>
              <input type="number" class="form-input" v-model.number="trainingForm.hours" placeholder="课时数">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>参训人数</label>
              <input type="number" class="form-input" v-model.number="trainingForm.participants" placeholder="人数">
            </div>
            <div class="form-group flex-1">
              <label>状态</label>
              <select class="form-input" v-model="trainingForm.status">
                <option value="未开始">未开始</option>
                <option value="进行中">进行中</option>
                <option value="已完成">已完成</option>
                <option value="已取消">已取消</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea class="form-input" v-model="trainingForm.remark" rows="2" placeholder="备注信息"></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showTrainingModal = false">取消</button>
            <button class="btn-submit" @click="saveTraining">保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 培训详情弹窗 ==================== -->
    <div v-if="showTrainingDetail" class="modal-overlay" @click.self="showTrainingDetail = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">🎓 培训详情</h3>
          <span class="modal-close" @click="showTrainingDetail = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="detail-grid-info">
            <div class="info-cell"><strong>培训编号:</strong> {{ trainingDetail.id }}</div>
            <div class="info-cell"><strong>培训名称:</strong> {{ trainingDetail.name }}</div>
            <div class="info-cell"><strong>类型:</strong> {{ trainingDetail.type }}</div>
            <div class="info-cell"><strong>讲师:</strong> {{ trainingDetail.instructor }}</div>
            <div class="info-cell"><strong>开始日期:</strong> {{ trainingDetail.startDate }}</div>
            <div class="info-cell"><strong>结束日期:</strong> {{ trainingDetail.endDate }}</div>
            <div class="info-cell"><strong>地点:</strong> {{ trainingDetail.location }}</div>
            <div class="info-cell"><strong>课时:</strong> {{ trainingDetail.hours }}h</div>
            <div class="info-cell"><strong>参训人数:</strong> {{ trainingDetail.participants }}人</div>
            <div class="info-cell"><strong>状态:</strong> {{ trainingDetail.status }}</div>
          </div>
          <div v-if="trainingDetail.remark" style="margin-top:12px;font-size:13px;color:#475569;">
            <strong>备注:</strong> {{ trainingDetail.remark }}
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showTrainingDetail = false">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 离职弹窗 ==================== -->
    <div v-if="showOffboardModal" class="modal-overlay" @click.self="showOffboardModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">📤 发起离职申请</h3>
          <span class="modal-close" @click="showOffboardModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">员工工号</label>
              <input class="form-input" v-model="offboardForm.empId" placeholder="请输入工号">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">员工姓名</label>
              <input class="form-input" v-model="offboardForm.empName" placeholder="请输入姓名">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>部门</label>
              <input class="form-input" v-model="offboardForm.dept" placeholder="请输入部门">
            </div>
            <div class="form-group flex-1">
              <label>职位</label>
              <input class="form-input" v-model="offboardForm.position" placeholder="请输入职位">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">离职类型</label>
              <select class="form-input" v-model="offboardForm.type">
                <option value="主动辞职">主动辞职</option>
                <option value="协商离职">协商离职</option>
                <option value="辞退">辞退</option>
                <option value="退休">退休</option>
                <option value="合同到期">合同到期</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="required-field">最后工作日</label>
              <input type="date" class="form-input" v-model="offboardForm.lastWorkDate">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>审批人</label>
              <input class="form-input" v-model="offboardForm.approver" placeholder="审批人">
            </div>
          </div>
          <div class="form-group">
            <label>离职原因</label>
            <textarea class="form-input" v-model="offboardForm.reason" rows="2" placeholder="请填写离职原因"></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showOffboardModal = false">取消</button>
            <button class="btn-submit" @click="saveOffboard">提交</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 离职详情弹窗 ==================== -->
    <div v-if="showOffboardDetail" class="modal-overlay" @click.self="showOffboardDetail = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">📤 离职详情</h3>
          <span class="modal-close" @click="showOffboardDetail = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="detail-grid-info">
            <div class="info-cell"><strong>离职单号:</strong> {{ offboardDetail.id }}</div>
            <div class="info-cell"><strong>员工:</strong> {{ offboardDetail.empName }} ({{ offboardDetail.empId }})</div>
            <div class="info-cell"><strong>部门:</strong> {{ offboardDetail.dept }}</div>
            <div class="info-cell"><strong>职位:</strong> {{ offboardDetail.position }}</div>
            <div class="info-cell"><strong>离职类型:</strong> {{ offboardDetail.type }}</div>
            <div class="info-cell"><strong>申请日期:</strong> {{ offboardDetail.applyDate }}</div>
            <div class="info-cell"><strong>最后工作日:</strong> {{ offboardDetail.lastWorkDate }}</div>
            <div class="info-cell"><strong>审批人:</strong> {{ offboardDetail.approver }}</div>
            <div class="info-cell"><strong>交接状态:</strong> {{ offboardDetail.handoverStatus }}</div>
            <div class="info-cell"><strong>审批状态:</strong> {{ offboardDetail.status }}</div>
            <div class="info-cell"><strong>归档状态:</strong> {{ offboardDetail.archiveStatus }}</div>
          </div>
          <div v-if="offboardDetail.reason" style="margin-top:12px;font-size:13px;color:#475569;">
            <strong>离职原因:</strong> {{ offboardDetail.reason }}
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showOffboardDetail = false">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 新增入职弹窗 ==================== -->
    <div v-if="showOnboardModal" class="modal-overlay" @click.self="showOnboardModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">📥 新增入职办理</h3>
          <span class="modal-close" @click="showOnboardModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">姓名</label>
              <input class="form-input" v-model="onboardForm.name" placeholder="请输入姓名">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">性别</label>
              <select class="form-input" v-model="onboardForm.gender">
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">手机号</label>
              <input class="form-input" v-model="onboardForm.phone" placeholder="请输入手机号">
            </div>
            <div class="form-group flex-1">
              <label class="required-field">入职日期</label>
              <input type="date" class="form-input" v-model="onboardForm.joinDate">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">部门</label>
              <select class="form-input" v-model="onboardForm.dept">
                <option value="">请选择部门</option>
                <option v-for="d in deptList" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="required-field">职位</label>
              <input class="form-input" v-model="onboardForm.position" placeholder="请输入职位">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="required-field">用工类型</label>
              <select class="form-input" v-model="onboardForm.empType">
                <option value="fulltime">全职</option>
                <option value="intern">实习</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>合同到期日</label>
              <input type="date" class="form-input" v-model="onboardForm.contractEnd">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>工号(自动生成)</label>
              <input class="form-input" v-model="onboardForm.empId" placeholder="留空则自动生成">
            </div>
            <div class="form-group flex-1"></div>
          </div>

          <!-- 入职材料清单 -->
          <div class="onboard-checklist">
            <div class="checklist-title">入职材料清单</div>
            <div class="checklist-items">
              <label class="checklist-item" v-for="item in onboardChecklist" :key="item.label">
                <input type="checkbox" v-model="item.checked">
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="showOnboardModal = false">取消</button>
            <button class="btn-submit" @click="saveOnboard">确认入职</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 员工详情弹窗 -->
    <div v-if="showEmpDetailModal" class="modal-overlay" @click.self="showEmpDetailModal = false">
      <div class="modal-card" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title">📇 员工详细档案</h3>
          <span class="modal-close" @click="showEmpDetailModal = false">✕</span>
        </div>
        <div class="modal-body" v-if="empDetail">
          <!-- 基本信息 -->
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
            <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:bold;">
              {{ empDetail.name?.charAt(0) }}
            </div>
            <div>
              <div style="font-size:18px;font-weight:600;">{{ empDetail.name }}</div>
              <div style="color:#6b7280;font-size:13px;">{{ empDetail.dept }} · {{ empDetail.position }}</div>
            </div>
            <span class="badge" :class="statusBadge(empDetail.hrStatus)" style="margin-left:auto;">{{ empDetail.hrStatus }}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;padding:16px;background:#f9fafb;border-radius:8px;">
            <div><span style="color:#6b7280;">工号：</span>{{ empDetail.id }}</div>
            <div><span style="color:#6b7280;">性别：</span>{{ empDetail.gender }}</div>
            <div><span style="color:#6b7280;">部门：</span>{{ empDetail.dept }}</div>
            <div><span style="color:#6b7280;">职位：</span>{{ empDetail.position }}</div>
            <div><span style="color:#6b7280;">手机号：</span>{{ empDetail.phone || '—' }}</div>
            <div><span style="color:#6b7280;">入职日期：</span>{{ empDetail.joinDate }}</div>
            <div><span style="color:#6b7280;">合同到期：</span>{{ empDetail.contractEnd || '—' }}</div>
            <div><span style="color:#6b7280;">系统角色：</span>{{ empDetail.role || '—' }}</div>
          </div>

          <!-- 合同信息 -->
          <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <h4 style="font-size:15px;font-weight:600;margin:0;">📋 合同信息</h4>
              <button v-if="!empDetailContract" class="btn btn-primary" style="padding:4px 12px;font-size:12px;" @click="generateEmpContract(empDetail)">生成合同</button>
            </div>

            <div v-if="empDetailContract" style="padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:13px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div><span style="color:#6b7280;">合同编号：</span>{{ empDetailContract.id }}</div>
                <div><span style="color:#6b7280;">合同类型：</span>{{ empDetailContract.type }}</div>
                <div><span style="color:#6b7280;">起始日期：</span>{{ empDetailContract.startDate }}</div>
                <div><span style="color:#6b7280;">终止日期：</span>{{ empDetailContract.endDate }}</div>
                <div><span style="color:#6b7280;">合同期限：</span>{{ empDetailContract.duration || '—' }}</div>
                <div><span style="color:#6b7280;">状态：</span>
                  <span class="badge" :class="contractBadge(empDetailContract.status)">{{ empDetailContract.status }}</span>
                </div>
              </div>
              <div style="margin-top:10px;display:flex;gap:8px;">
                <button class="btn btn-primary" style="padding:4px 12px;font-size:12px;" @click="viewContract(empDetailContract)">查看合同文档</button>
              </div>
            </div>

            <div v-else style="padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;text-align:center;color:#92400e;font-size:13px;">
              该员工暂无合同记录
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showEmpDetailModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 合同预览弹窗 -->
    <ContractPreviewModal
      v-model:visible="showContractPreview"
      :title="previewContractTitle"
      :contractHTML="previewContractHTML"
      :employeeName="previewEmployeeName"
      :contractType="previewContractType"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addEmployee, updateEmployee, addContract, updateContract, deleteContract, addTransfer, updateTransfer, addTraining, updateTraining, deleteTraining, addOffboarding, updateOffboarding, Alert } from '../store';
import type { Employee, Contract, Transfer, Training, Offboarding } from '../store';
import ContractPreviewModal from './ContractPreviewModal.vue';
import { generateLaborContractHTML, generateInternshipAgreementHTML } from '../utils/contractTemplates';
import type { ContractTemplateData } from '../utils/contractTemplates';
import { batchGenerateContracts } from '../api';

defineEmits(['open-user-modal']);

// ==================== Tab 切换 ====================
const activeTab = ref<'roster' | 'onboarding' | 'contract' | 'transfer' | 'training' | 'offboarding'>('roster');

const switchTab = (tab: typeof activeTab.value) => {
  activeTab.value = tab;
};

// ==================== Tab 1: 花名册 ====================
const rosterSearch = ref('');
const rosterStatus = ref('');
const rosterPage = ref(1);
const rosterPageSize = 10;

const rosterFiltered = computed(() => {
  const kw = rosterSearch.value.trim().toLowerCase();
  const st = rosterStatus.value;
  return store.employees.filter(emp => {
    const matchKw = !kw || emp.name.toLowerCase().includes(kw) || emp.id.includes(kw) || emp.position.toLowerCase().includes(kw);
    const matchSt = !st || emp.hrStatus === st;
    return matchKw && matchSt;
  });
});

const rosterTotalPages = computed(() => Math.ceil(rosterFiltered.value.length / rosterPageSize) || 1);
const rosterPaged = computed(() => {
  const s = (rosterPage.value - 1) * rosterPageSize;
  return rosterFiltered.value.slice(s, s + rosterPageSize);
});

const statusBadge = (status: string) => {
  if (status === '在职') return 'badge-success';
  if (status === '试用期') return 'badge-warning';
  return 'badge-danger';
};

// 员工详情弹窗
const showEmpDetailModal = ref(false);
const empDetail = ref<Employee>({} as Employee);
const empDetailContract = ref<any>(null);

const viewEmployee = (emp: Employee) => {
  empDetail.value = emp;
  // 查找该员工的合同
  empDetailContract.value = store.contracts.find(c => c.empId === emp.id) || null;
  showEmpDetailModal.value = true;
};

const generateEmpContract = async (emp: Employee) => {
  const contractType = emp.hrStatus === '试用期' ? '固定期限' : '固定期限';
  try {
    await addContract({
      empId: emp.id,
      empName: emp.name,
      dept: emp.dept,
      type: contractType,
      startDate: emp.joinDate,
      endDate: emp.contractEnd,
      duration: emp.joinDate && emp.contractEnd ? (() => {
        const months = Math.round((new Date(emp.contractEnd).getTime() - new Date(emp.joinDate).getTime()) / (30 * 24 * 60 * 60 * 1000));
        return months >= 12 ? `${Math.round(months / 12)}年` : `${months}个月`;
      })() : '',
      salary: '',
      status: '待签署',
      signDate: new Date().toISOString().split('T')[0],
      remark: '为已有员工补录合同'
    });
    // 刷新合同数据
    empDetailContract.value = store.contracts.find(c => c.empId === emp.id) || null;
  } catch {
    alert('生成合同失败，请重试');
  }
};

// 批量生成合同
const batchGenerating = ref(false);
const handleBatchGenerate = async () => {
  if (!confirm('将为所有没有合同的员工自动生成合同，是否继续？')) return;
  batchGenerating.value = true;
  try {
    const res = await batchGenerateContracts();
    alert((res as any)?.msg || '批量生成完成');
    // 重新加载数据
    const { loadAllData } = await import('../store');
    await loadAllData();
  } catch {
    alert('批量生成失败，请重试');
  } finally {
    batchGenerating.value = false;
  }
};

// ==================== Tab 2: 入职办理 ====================
const onboardSearch = ref('');
const onboardPage = ref(1);
const onboardPageSize = 10;

const onboardFiltered = computed(() => {
  const kw = onboardSearch.value.trim().toLowerCase();
  return store.employees.filter(emp => {
    if (emp.hrStatus !== '试用期') return false;
    return !kw || emp.name.toLowerCase().includes(kw) || emp.id.includes(kw);
  });
});

const onboardTotalPages = computed(() => Math.ceil(onboardFiltered.value.length / onboardPageSize) || 1);
const onboardPaged = computed(() => {
  const s = (onboardPage.value - 1) * onboardPageSize;
  return onboardFiltered.value.slice(s, s + onboardPageSize);
});

const confirmOnboard = async (emp: Employee) => {
  Alert.alert('转正办理', `确认将员工 ${emp.name} (${emp.id}) 转为正式员工？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '转正',
      onPress: async () => {
        try {
          await updateEmployee(emp.id, { hrStatus: '在职' });
          alert(`${emp.name} 已成功转正！`);
        } catch {
          alert('转正操作失败，请重试');
        }
      }
    }
  ]);
};

// 新增入职弹窗
const showOnboardModal = ref(false);
const onboardForm = ref({
  name: '', gender: '男', phone: '', joinDate: '',
  dept: '', position: '', contractEnd: '', empId: '', empType: 'fulltime'
});

// 合同预览状态
const showContractPreview = ref(false);
const previewContractHTML = ref('');
const previewContractTitle = ref('');
const previewEmployeeName = ref('');
const previewContractType = ref('');

const deptList = computed(() => {
  const set = new Set(store.employees.map(e => e.dept).filter(Boolean));
  return Array.from(set).sort();
});

const onboardChecklist = ref([
  { label: '身份证复印件', checked: false },
  { label: '学历证书复印件', checked: false },
  { label: '离职证明', checked: false },
  { label: '一寸照片', checked: false },
  { label: '银行卡信息', checked: false },
  { label: '体检报告', checked: false },
  { label: '劳动合同签署', checked: false }
]);

const openOnboardModal = () => {
  onboardForm.value = { name: '', gender: '男', phone: '', joinDate: new Date().toISOString().split('T')[0], dept: '', position: '', contractEnd: '', empId: '', empType: 'fulltime' };
  onboardChecklist.value.forEach(item => item.checked = false);
  showOnboardModal.value = true;
};

const saveOnboard = async () => {
  const f = onboardForm.value;
  if (!f.name || !f.phone || !f.dept || !f.position || !f.joinDate) {
    alert('请填写所有必填字段');
    return;
  }
  const allChecked = onboardChecklist.value.every(item => item.checked);
  const proceedOnboard = async () => {
    try {
      await addEmployee({
        name: f.name,
        gender: f.gender,
        phone: f.phone,
        dept: f.dept,
        position: f.position,
        role: f.position,
        status: '正常',
        hrStatus: '试用期',
        joinDate: f.joinDate,
        contractEnd: f.contractEnd
      });

      // 自动创建合同记录
      const contractType = f.empType === 'intern' ? '实习协议' : '固定期限';
      const contractTypeLabel = f.empType === 'intern' ? '实习协议' : '劳动合同';
      try {
        await addContract({
          empId: f.empId || '',
          empName: f.name,
          dept: f.dept,
          type: contractType,
          startDate: f.joinDate,
          endDate: f.contractEnd || '',
          duration: f.joinDate && f.contractEnd ? (() => {
            const months = Math.round((new Date(f.contractEnd).getTime() - new Date(f.joinDate).getTime()) / (30 * 24 * 60 * 60 * 1000));
            return months >= 12 ? `${Math.round(months / 12)}年` : `${months}个月`;
          })() : '',
          salary: '',
          status: '待签署',
          signDate: new Date().toISOString().split('T')[0],
          remark: '入职时自动生成'
        });
      } catch (e) {
        console.warn('自动创建合同记录失败:', e);
      }

      // 生成合同预览
      // 查找员工薪资信息
      const empSalary = store.salary.find(s => s.name === f.name || s.empId === f.empId);
      const salaryText = empSalary ? `${empSalary.baseSalary + empSalary.allowance}元/月` : '面议';
      // 计算试用期结束日期（3个月后）
      const joinDateObj = f.joinDate ? new Date(f.joinDate) : new Date();
      const probationEnd = new Date(joinDateObj);
      probationEnd.setMonth(probationEnd.getMonth() + 3);

      const templateData: ContractTemplateData = {
        empName: f.name,
        empId: f.empId || '待分配',
        gender: f.gender,
        dept: f.dept,
        position: f.position,
        joinDate: f.joinDate,
        contractEndDate: f.contractEnd || '',
        salary: salaryText,
        companyName: store.systemSettings?.systemName || '本公司',
        // 公司信息
        companyLegalRep: store.systemSettings?.companyLegalRep || '法定代表人',
        companyCreditCode: store.systemSettings?.companyCreditCode || '',
        companyAddress: store.systemSettings?.companyAddress || '',
        companyPhone: store.systemSettings?.companyPhone || '',
        workLocation: store.systemSettings?.workLocation || '',
        payDay: store.systemSettings?.payDay || '15',
        // 合同信息
        probationEndDate: probationEnd.toISOString().split('T')[0],
        probationMonths: 3
      };

      previewContractHTML.value = f.empType === 'intern'
        ? generateInternshipAgreementHTML(templateData)
        : generateLaborContractHTML(templateData);
      previewContractTitle.value = contractTypeLabel;
      previewEmployeeName.value = f.name;
      previewContractType.value = contractTypeLabel;

      showOnboardModal.value = false;
      showContractPreview.value = true;
    } catch {
      alert('入职办理失败，请重试');
    }
  };

  if (!allChecked) {
    Alert.alert('材料缺失', '入职材料清单尚未全部勾选，确认继续办理入职？', [
      { text: '取消', style: 'cancel' },
      {
        text: '继续办理',
        onPress: proceedOnboard
      }
    ]);
  } else {
    await proceedOnboard();
  }
};

// ==================== Tab 3: 合同管理 ====================
const contractSearch = ref('');
const contractStatus = ref('');
const contractPage = ref(1);
const contractPageSize = 10;

const contractFiltered = computed(() => {
  const kw = contractSearch.value.trim().toLowerCase();
  const st = contractStatus.value;
  return store.contracts.filter(c => {
    const matchKw = !kw || c.id.toLowerCase().includes(kw) || c.empName.toLowerCase().includes(kw) || c.empId.includes(kw);
    const matchSt = !st || c.status === st;
    return matchKw && matchSt;
  });
});

const contractTotalPages = computed(() => Math.ceil(contractFiltered.value.length / contractPageSize) || 1);
const contractPaged = computed(() => {
  const s = (contractPage.value - 1) * contractPageSize;
  return contractFiltered.value.slice(s, s + contractPageSize);
});

const contractBadge = (status: string) => {
  if (status === '生效中') return 'badge-success';
  if (status === '待签署') return 'badge-warning';
  if (status === '已到期') return 'badge-danger';
  return 'badge-info';
};

const isContractExpiring = (c: Contract) => {
  if (c.status !== '生效中' || !c.endDate) return false;
  const end = new Date(c.endDate);
  const now = new Date();
  const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 30;
};

// 合同弹窗
const showContractModal = ref(false);
const contractEditId = ref('');
const contractForm = ref({
  empId: '', empName: '', dept: '', type: '固定期限',
  startDate: '', endDate: '', duration: '', salary: '',
  status: '待签署', signDate: '', remark: ''
});

const openContractModal = (c?: Contract) => {
  if (c) {
    contractEditId.value = c.id;
    contractForm.value = { empId: c.empId, empName: c.empName, dept: c.dept, type: c.type, startDate: c.startDate, endDate: c.endDate, duration: c.duration, salary: c.salary, status: c.status, signDate: c.signDate, remark: c.remark };
  } else {
    contractEditId.value = '';
    contractForm.value = { empId: '', empName: '', dept: '', type: '固定期限', startDate: '', endDate: '', duration: '', salary: '', status: '待签署', signDate: '', remark: '' };
  }
  showContractModal.value = true;
};

const saveContract = async () => {
  if (!contractForm.value.empId || !contractForm.value.empName || !contractForm.value.startDate || !contractForm.value.endDate) {
    alert('请填写必填字段');
    return;
  }
  try {
    if (contractEditId.value) {
      await updateContract(contractEditId.value, contractForm.value);
    } else {
      await addContract(contractForm.value);
    }
    showContractModal.value = false;
  } catch {
    alert('保存合同失败，请重试');
  }
};

// 合同详情
const showContractDetail = ref(false);
const contractDetail = ref<Contract>({} as Contract);
const viewContract = (c: Contract) => {
  const emp = store.employees.find(e => e.id === c.empId);
  const empSalary = store.salary.find(s => s.empId === c.empId || s.name === c.empName);
  const salaryText = c.salary || (empSalary ? `${empSalary.baseSalary + empSalary.allowance}元/月` : '面议');
  // 计算试用期结束日期（入职后3个月）
  const joinDateObj = c.startDate ? new Date(c.startDate) : new Date();
  const probationEnd = new Date(joinDateObj);
  probationEnd.setMonth(probationEnd.getMonth() + 3);

  const templateData: ContractTemplateData = {
    empName: c.empName,
    empId: c.empId,
    gender: emp?.gender || '',
    dept: c.dept,
    position: emp?.position || '',
    joinDate: c.startDate,
    contractEndDate: c.endDate,
    salary: salaryText,
    companyName: store.systemSettings?.systemName || '本公司',
    // 员工个人信息
    idCard: emp?.idCard || '',
    address: emp?.address || '',
    currentAddress: emp?.currentAddress || '',
    phone: emp?.phone || '',
    school: emp?.school || '',
    major: emp?.major || '',
    // 公司信息
    companyLegalRep: store.systemSettings?.companyLegalRep || '法定代表人',
    companyCreditCode: store.systemSettings?.companyCreditCode || '',
    companyAddress: store.systemSettings?.companyAddress || '',
    companyPhone: store.systemSettings?.companyPhone || '',
    workLocation: store.systemSettings?.workLocation || '',
    payDay: store.systemSettings?.payDay || '15',
    // 合同信息
    probationEndDate: probationEnd.toISOString().split('T')[0],
    probationMonths: 3
  };
  const isIntern = c.type === '实习协议';
  previewContractHTML.value = isIntern
    ? generateInternshipAgreementHTML(templateData)
    : generateLaborContractHTML(templateData);
  previewContractTitle.value = c.type;
  previewEmployeeName.value = c.empName;
  previewContractType.value = isIntern ? '实习协议' : '劳动合同';
  showEmpDetailModal.value = false; // 先关闭员工详情弹窗
  showContractPreview.value = true;
};

const handleDeleteContract = async (c: Contract) => {
  Alert.alert('删除合同', `确认删除合同 ${c.id} (${c.empName})？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteContract(c.id);
        } catch {
          alert('删除失败，请重试');
        }
      }
    }
  ]);
};

// ==================== Tab 4: 异动调岗 ====================
const transferSearch = ref('');
const transferType = ref('');
const transferStatus = ref('');
const transferPage = ref(1);
const transferPageSize = 10;

const transferFiltered = computed(() => {
  const kw = transferSearch.value.trim().toLowerCase();
  const tp = transferType.value;
  const st = transferStatus.value;
  return store.transfers.filter(t => {
    const matchKw = !kw || t.id.toLowerCase().includes(kw) || t.empName.toLowerCase().includes(kw) || t.empId.includes(kw);
    const matchTp = !tp || t.type === tp;
    const matchSt = !st || t.status === st;
    return matchKw && matchTp && matchSt;
  });
});

const transferTotalPages = computed(() => Math.ceil(transferFiltered.value.length / transferPageSize) || 1);
const transferPaged = computed(() => {
  const s = (transferPage.value - 1) * transferPageSize;
  return transferFiltered.value.slice(s, s + transferPageSize);
});

const transferTypeBadge = (type: string) => {
  if (type === '晋升') return 'badge-success';
  if (type === '降级') return 'badge-danger';
  if (type === '借调') return 'badge-info';
  return 'badge-warning';
};

const transferStatusBadge = (status: string) => {
  if (status === '已通过' || status === '已生效') return 'badge-success';
  if (status === '已拒绝') return 'badge-danger';
  return 'badge-warning';
};

// 异动弹窗
const showTransferModal = ref(false);
const transferForm = ref({
  empId: '', empName: '', type: '调岗',
  fromDept: '', toDept: '', fromPosition: '', toPosition: '',
  effectiveDate: '', reason: '', approver: ''
});

const openTransferModal = () => {
  transferForm.value = { empId: '', empName: '', type: '调岗', fromDept: '', toDept: '', fromPosition: '', toPosition: '', effectiveDate: '', reason: '', approver: '' };
  showTransferModal.value = true;
};

const saveTransfer = async () => {
  if (!transferForm.value.empId || !transferForm.value.empName || !transferForm.value.effectiveDate) {
    alert('请填写必填字段');
    return;
  }
  try {
    await addTransfer({ ...transferForm.value, status: '待审批' });
    showTransferModal.value = false;
  } catch {
    alert('提交异动申请失败，请重试');
  }
};

// 异动详情
const showTransferDetail = ref(false);
const transferDetail = ref<Transfer>({} as Transfer);
const viewTransfer = (t: Transfer) => {
  transferDetail.value = t;
  showTransferDetail.value = true;
};

const approveTransfer = async (t: Transfer) => {
  Alert.alert('审核异动', `确认通过 ${t.empName} 的${t.type}申请？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '通过',
      onPress: async () => {
        try {
          await updateTransfer(t.id, { status: '已通过' });
        } catch {
          alert('操作失败');
        }
      }
    }
  ]);
};

const rejectTransfer = async (t: Transfer) => {
  Alert.alert('驳回异动', `确认拒绝 ${t.empName} 的${t.type}申请？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '拒绝',
      style: 'destructive',
      onPress: async () => {
        try {
          await updateTransfer(t.id, { status: '已拒绝' });
        } catch {
          alert('操作失败');
        }
      }
    }
  ]);
};

// ==================== Tab 5: 培训发展 ====================
const trainingSearch = ref('');
const trainingType = ref('');
const trainingStatus = ref('');
const trainingPage = ref(1);
const trainingPageSize = 10;

const trainingFiltered = computed(() => {
  const kw = trainingSearch.value.trim().toLowerCase();
  const tp = trainingType.value;
  const st = trainingStatus.value;
  return store.trainings.filter(t => {
    const matchKw = !kw || t.name.toLowerCase().includes(kw) || t.instructor.toLowerCase().includes(kw);
    const matchTp = !tp || t.type === tp;
    const matchSt = !st || t.status === st;
    return matchKw && matchTp && matchSt;
  });
});

const trainingTotalPages = computed(() => Math.ceil(trainingFiltered.value.length / trainingPageSize) || 1);
const trainingPaged = computed(() => {
  const s = (trainingPage.value - 1) * trainingPageSize;
  return trainingFiltered.value.slice(s, s + trainingPageSize);
});

const trainingStatusBadge = (status: string) => {
  if (status === '已完成') return 'badge-success';
  if (status === '进行中') return 'badge-info';
  if (status === '已取消') return 'badge-danger';
  return 'badge-warning';
};

// 培训弹窗
const showTrainingModal = ref(false);
const trainingEditId = ref('');
const trainingForm = ref({
  name: '', type: '技能培训', instructor: '',
  startDate: '', endDate: '', location: '',
  hours: 0, participants: 0, status: '未开始', remark: ''
});

const openTrainingModal = (t?: Training) => {
  if (t) {
    trainingEditId.value = t.id;
    trainingForm.value = { name: t.name, type: t.type, instructor: t.instructor, startDate: t.startDate, endDate: t.endDate, location: t.location, hours: t.hours, participants: t.participants, status: t.status, remark: t.remark };
  } else {
    trainingEditId.value = '';
    trainingForm.value = { name: '', type: '技能培训', instructor: '', startDate: '', endDate: '', location: '', hours: 0, participants: 0, status: '未开始', remark: '' };
  }
  showTrainingModal.value = true;
};

const saveTraining = async () => {
  if (!trainingForm.value.name || !trainingForm.value.startDate || !trainingForm.value.endDate) {
    alert('请填写必填字段');
    return;
  }
  try {
    if (trainingEditId.value) {
      await updateTraining(trainingEditId.value, trainingForm.value);
    } else {
      await addTraining(trainingForm.value);
    }
    showTrainingModal.value = false;
  } catch {
    alert('保存培训计划失败，请重试');
  }
};

// 培训详情
const showTrainingDetail = ref(false);
const trainingDetail = ref<Training>({} as Training);
const viewTraining = (t: Training) => {
  trainingDetail.value = t;
  showTrainingDetail.value = true;
};

const handleDeleteTraining = async (t: Training) => {
  Alert.alert('删除培训计划', `确认删除培训计划 ${t.name}？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteTraining(t.id);
        } catch {
          alert('删除失败，请重试');
        }
      }
    }
  ]);
};

// ==================== Tab 6: 离职管理 ====================
const offboardSearch = ref('');
const offboardStatus = ref('');
const offboardPage = ref(1);
const offboardPageSize = 10;

const offboardFiltered = computed(() => {
  const kw = offboardSearch.value.trim().toLowerCase();
  const st = offboardStatus.value;
  return store.offboardings.filter(o => {
    const matchKw = !kw || o.id.toLowerCase().includes(kw) || o.empName.toLowerCase().includes(kw) || o.empId.includes(kw);
    const matchSt = !st || o.status === st;
    return matchKw && matchSt;
  });
});

const offboardTotalPages = computed(() => Math.ceil(offboardFiltered.value.length / offboardPageSize) || 1);
const offboardPaged = computed(() => {
  const s = (offboardPage.value - 1) * offboardPageSize;
  return offboardFiltered.value.slice(s, s + offboardPageSize);
});

const handoverBadge = (status: string) => {
  if (status === '已交接') return 'badge-success';
  if (status === '交接中') return 'badge-info';
  return 'badge-warning';
};

const offboardStatusBadge = (status: string) => {
  if (status === '已完成' || status === '已通过') return 'badge-success';
  if (status === '已拒绝') return 'badge-danger';
  if (status === '审批中') return 'badge-info';
  return 'badge-warning';
};

// 离职弹窗
const showOffboardModal = ref(false);
const offboardForm = ref({
  empId: '', empName: '', dept: '', position: '',
  type: '主动辞职', lastWorkDate: '', reason: '', approver: ''
});

const openOffboardModal = () => {
  offboardForm.value = { empId: '', empName: '', dept: '', position: '', type: '主动辞职', lastWorkDate: '', reason: '', approver: '' };
  showOffboardModal.value = true;
};

const saveOffboard = async () => {
  if (!offboardForm.value.empId || !offboardForm.value.empName || !offboardForm.value.lastWorkDate) {
    alert('请填写必填字段');
    return;
  }
  try {
    await addOffboarding({ ...offboardForm.value, applyDate: new Date().toISOString().split('T')[0], handoverStatus: '未交接', status: '待审批', archiveStatus: '未归档' });
    showOffboardModal.value = false;
  } catch {
    alert('提交离职申请失败，请重试');
  }
};

// 离职详情
const showOffboardDetail = ref(false);
const offboardDetail = ref<Offboarding>({} as Offboarding);
const viewOffboard = (o: Offboarding) => {
  offboardDetail.value = o;
  showOffboardDetail.value = true;
};

const approveOffboard = async (o: Offboarding) => {
  Alert.alert('审核离职', `确认通过 ${o.empName} 的离职申请？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '通过',
      onPress: async () => {
        try {
          await updateOffboarding(o.id, { status: '已通过' });
        } catch {
          alert('操作失败');
        }
      }
    }
  ]);
};

const archiveOffboard = async (o: Offboarding) => {
  Alert.alert('归档离职', `确认将 ${o.empName} 的离职档案归档？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '归档',
      onPress: async () => {
        try {
          await updateOffboarding(o.id, { archiveStatus: '已归档', status: '已完成' });
          // 同时更新员工状态为离职
          await updateEmployee(o.empId, { hrStatus: '离职' });
        } catch {
          alert('归档操作失败');
        }
      }
    }
  ]);
};

// ==================== 导出 ====================
const mockExport = () => {
  alert('人事数据已成功导出为模拟Excel压缩包！');
};
</script>

<style scoped>
.hr-tabs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.tab-nav {
  display: flex;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.tab-nav-item {
  padding: 16px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
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
  flex-wrap: wrap;
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

.empty-cell {
  text-align: center;
  color: #94a3b8;
  padding: 30px;
}

.font-bold {
  font-weight: 600;
  font-family: var(--font-title, inherit);
}

.row-warning {
  background-color: #fffbeb;
}

.badge-success { background-color: #d1fae5; color: #065f46; }
.badge-warning { background-color: #fef3c7; color: #d97706; }
.badge-danger { background-color: #fee2e2; color: #dc2626; }
.badge-info { background-color: #dbeafe; color: #1d4ed8; }
.badge-secondary { background-color: #f1f5f9; color: #475569; }

.action-link.success { color: #10b981; }
.action-link.danger { color: #ef4444; }

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
  margin-bottom: 0;
}

.flex-1 {
  flex: 1;
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
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--primary-color, #6366f1);
}

textarea.form-input {
  resize: vertical;
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

.onboard-checklist {
  margin-top: 8px;
  padding: 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.checklist-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.checklist-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.checklist-item input[type="checkbox"] {
  accent-color: var(--primary-color, #6366f1);
}
</style>
