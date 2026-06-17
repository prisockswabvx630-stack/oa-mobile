<template>
  <div id="page-salary-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">薪资管理</h2>
      <div class="page-actions" style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" @click="currentStep = 1" v-if="currentStep > 1">◀ 上一步</button>
        <button class="btn btn-primary" @click="nextStep" v-if="currentStep < 5">下一步 ▶</button>
      </div>
    </div>

    <!-- 1. 进度向导步骤条 (Stepper) -->
    <div class="salary-stepper">
      <div 
        v-for="step in steps" 
        :key="step.value" 
        class="step-item" 
        :class="{ 
          active: currentStep === step.value, 
          completed: currentStep > step.value 
        }"
        @click="goToStep(step.value)"
      >
        <div class="step-num-circle">
          <span v-if="currentStep > step.value">✓</span>
          <span v-else>{{ step.value }}</span>
        </div>
        <div class="step-label">{{ step.name }}</div>
        <div class="step-connector" v-if="step.value < 5"></div>
      </div>
    </div>

    <!-- 2. 数据准备步骤 (Step 1) -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="step-title-bar">
        <h3>1. 薪资数据准备与核算</h3>
        <div class="step-actions">
          <button class="btn btn-success" @click="triggerAutoCalculation">⚡ 一键计算个税与五险一金</button>
          <button class="btn btn-info" @click="triggerImportMock">📂 导入本月考勤与绩效系数</button>
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
          <select class="form-control" v-model="searchDept">
            <option value="">全部部门</option>
            <option value="技术部">技术部</option>
            <option value="财务部">财务部</option>
            <option value="人事部">人事部</option>
            <option value="行政部">行政部</option>
          </select>
        </div>
        <div class="filter-item">
          <label>发放状态:</label>
          <select class="form-control" v-model="searchStatus">
            <option value="">全部</option>
            <option value="已发放">已发放</option>
            <option value="未发放">未发放</option>
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
              <th>基本工资</th>
              <th>岗位津贴</th>
              <th>绩效奖金</th>
              <th>五险一金扣除</th>
              <th>个人所得税</th>
              <th>实发工资</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedSalary.length === 0">
              <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
            </tr>
            <tr v-else v-for="s in pagedSalary" :key="s.empId">
              <td style="font-weight: 600; font-family: var(--font-title);">{{ s.empId }}</td>
              <td style="font-weight: 500;">{{ s.name }}</td>
              <td>{{ s.dept }}</td>
              <td>{{ formatMoney(s.baseSalary) }}</td>
              <td>{{ formatMoney(s.allowance) }}</td>
              <td>{{ formatMoney(s.bonus) }}</td>
              <td style="color: var(--danger); font-weight: 500;">{{ formatMoney(s.socialSec + s.housingFund) }}</td>
              <td style="color: var(--danger); font-weight: 500;">{{ formatMoney(s.tax) }}</td>
              <td style="font-weight: 700; color: var(--success);">{{ formatMoney(s.netPay) }}</td>
              <td>
                <span class="badge" :class="s.status === '已发放' ? 'success' : 'warning'">
                  {{ s.status }}
                </span>
              </td>
              <td>
                <span class="action-link" @click="openAdjustModal(s)">调整明细</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <div>共 {{ filteredSalary.length }} 条记录</div>
          <div class="pagination-pages">
            <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
            <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
              {{ page }}
            </button>
            <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 工资条生成与 WPS 预览 (Step 2) -->
    <div v-else-if="currentStep === 2" class="step-content">
      <div class="step-title-bar">
        <h3>2. 电子工资条生成与 WPS 模板预览</h3>
        <div class="step-actions">
          <button class="btn btn-secondary" @click="exportCurrentWps">📥 导出当前员工 WPS 工资条 (.xls)</button>
          <button class="btn btn-primary" @click="batchExportWps">📥 批量打包导出所有工资条</button>
        </div>
      </div>

      <div class="split-layout">
        <!-- 左侧员工选择列表 -->
        <div class="employee-selector-card">
          <div class="selector-header">选择核对人员</div>
          <div class="selector-search">
            <input type="text" class="form-control" v-model="selectorKeyword" placeholder="快速筛选姓名/工号">
          </div>
          <div class="selector-list">
            <div 
              v-for="s in filteredSelectorSalary" 
              :key="s.empId" 
              class="selector-item"
              :class="{ active: selectedPreviewId === s.empId }"
              @click="selectedPreviewId = s.empId"
            >
              <div class="emp-avatar">{{ s.name.charAt(0) }}</div>
              <div class="emp-info">
                <div class="emp-name">{{ s.name }}</div>
                <div class="emp-meta">{{ s.empId }} | {{ s.dept }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧 WPS 样式工资条预览 -->
        <div class="wps-preview-container" v-if="previewPayslip">
          <div class="wps-excel-canvas">
            
            <!-- Excel Title -->
            <div class="excel-row excel-title-row">
              <div class="excel-cell title-cell">XX公司 工资条</div>
            </div>
            
            <!-- Excel Subtitle -->
            <div class="excel-row excel-subtitle-row">
              <div class="excel-cell subtitle-cell">薪资月份：2026年5月</div>
            </div>

            <!-- Category: 基本信息 -->
            <div class="excel-row section-header-row">
              <div class="excel-cell section-title">员工基本信息</div>
            </div>
            
            <div class="excel-grid">
              <div class="grid-row">
                <div class="grid-cell label">姓名：</div>
                <div class="grid-cell val">{{ previewPayslip.name }}</div>
                <div class="grid-cell label">工号：</div>
                <div class="grid-cell val">{{ previewPayslip.empId }}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell label">部门：</div>
                <div class="grid-cell val">{{ previewPayslip.dept }}</div>
                <div class="grid-cell label">岗位：</div>
                <div class="grid-cell val">{{ previewEmployee?.role || '工程师' }}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell label">职级：</div>
                <div class="grid-cell val">{{ previewPayslipJobLevel }}</div>
                <div class="grid-cell label">入职日期：</div>
                <div class="grid-cell val">{{ previewEmployee?.joinDate || '2022-03-01' }}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell label">银行账号：</div>
                <div class="grid-cell val">{{ previewPayslipBankNo }}</div>
                <div class="grid-cell label">发薪方式：</div>
                <div class="grid-cell val">银行代发</div>
              </div>
            </div>

            <!-- Category: 应发工资 -->
            <div class="excel-row section-header-row">
              <div class="excel-cell section-title">应发工资 (税前)</div>
            </div>

            <div class="excel-grid">
              <div class="grid-row">
                <div class="grid-cell label highlight-item">基本工资</div>
                <div class="grid-cell val text-right">{{ formatMoney(previewPayslip.baseSalary) }}</div>
                <div class="grid-cell label highlight-item">岗位工资</div>
                <div class="grid-cell val text-right">{{ formatMoney(previewPostSalary) }}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell label highlight-item">绩效工资</div>
                <div class="grid-cell val text-right">{{ formatMoney(previewPerformanceSalary) }}</div>
                <div class="grid-cell label highlight-item">加班费</div>
                <div class="grid-cell val text-right">{{ formatMoney(previewOtSalary) }}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell label highlight-item">各类补贴 (餐/交/通)</div>
                <div class="grid-cell val text-right">{{ formatMoney(previewAllowance) }}</div>
                <div class="grid-cell label highlight-item">奖金 / 提成</div>
                <div class="grid-cell val text-right">0.00</div>
              </div>
              <div class="grid-row total-row-bg">
                <div class="grid-cell label bold-text">应发合计</div>
                <div class="grid-cell val text-right bold-text colspan-3">{{ formatMoney(previewGrossPay) }}</div>
              </div>
            </div>

            <!-- Category: 代扣项 -->
            <div class="excel-row section-header-row">
              <div class="excel-cell section-title">代扣项</div>
            </div>

            <div class="excel-grid">
              <div class="grid-row">
                <div class="grid-cell label deduct-item">养老保险 (个人 8%)</div>
                <div class="grid-cell val text-right color-danger">{{ formatMoney(previewPension) }}</div>
                <div class="grid-cell label deduct-item">医疗保险 (个人 2%)</div>
                <div class="grid-cell val text-right color-danger">{{ formatMoney(previewMedical) }}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell label deduct-item">失业保险 (个人 0.5%)</div>
                <div class="grid-cell val text-right color-danger">{{ formatMoney(previewUnemployment) }}</div>
                <div class="grid-cell label deduct-item">住房公积金 (个人 12%)</div>
                <div class="grid-cell val text-right color-danger">{{ formatMoney(previewPayslip.housingFund) }}</div>
              </div>
              <div class="grid-row">
                <div class="grid-cell label deduct-item">个人所得税</div>
                <div class="grid-cell val text-right color-danger">{{ formatMoney(previewPayslip.tax) }}</div>
                <div class="grid-cell label deduct-item">其他扣款</div>
                <div class="grid-cell val text-right color-danger">0.00</div>
              </div>
              <div class="grid-row total-row-bg">
                <div class="grid-cell label bold-text">代扣合计</div>
                <div class="grid-cell val text-right bold-text color-danger colspan-3">{{ formatMoney(previewTotalDeductions) }}</div>
              </div>
            </div>

            <!-- Category: 实发工资 -->
            <div class="excel-row section-header-row">
              <div class="excel-cell section-title">实发工资 (税后)</div>
            </div>
            
            <div class="excel-grid net-pay-container">
              <div class="net-formula-cell">
                实发工资 = 应发合计 - 代扣合计
              </div>
              <div class="net-val-cell">
                ¥{{ formatMoney(previewPayslip.netPay) }}
              </div>
            </div>

            <!-- Category: 备注 (Combined into single row grid) -->
            <div class="excel-grid">
              <div class="grid-row">
                <div class="grid-cell label" style="max-width: 80px;">备注：</div>
                <div class="grid-cell val" style="text-align: left; font-size: 12px; color: var(--text-muted); line-height: 1.6;">
                  本月绩效系数：1.0 | 考勤：全勤 | 加班：20小时 | 发放日期：2026年5月15日 | 如对工资有疑问，请在3个工作日内联系HR薪酬组
                </div>
              </div>
            </div>

            <!-- Signatures (No Category Header, on a single row) -->
            <div class="excel-grid">
              <div class="grid-row" style="height: 60px;">
                <div class="grid-cell val" style="text-align: left; vertical-align: top; display: flex; flex-direction: column; justify-content: space-between;">
                  <span style="font-weight: bold; color: #4a5568;">制表人：</span>
                  <span style="height: 24px;"></span>
                </div>
                <div class="grid-cell val" style="text-align: left; vertical-align: top; display: flex; flex-direction: column; justify-content: space-between;">
                  <span style="font-weight: bold; color: #4a5568;">审批人：</span>
                  <span style="height: 24px;"></span>
                </div>
                <div class="grid-cell val colspan-2" style="text-align: left; vertical-align: top; display: flex; flex-direction: column; justify-content: space-between;">
                  <span style="font-weight: bold; color: #4a5568;">员工签收：</span>
                  <span style="height: 24px;"></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- 4. 汇总统计步骤 (Step 3) -->
    <div v-else-if="currentStep === 3" class="step-content">
      <div class="step-title-bar">
        <h3>3. 薪资多级汇总与可视化统计</h3>
      </div>

      <!-- 统计指标网格 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">应发合计 (税前)</div>
            <div class="stat-info-val" style="color: var(--text-title);">{{ formatMoney(summaryData.totalGross) }}</div>
            <div class="stat-trend trend-up">包含基本、绩效及津贴</div>
          </div>
          <div class="stat-icon-wrapper purple">💰</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">代扣扣款总额</div>
            <div class="stat-info-val" style="color: var(--danger);">{{ formatMoney(summaryData.totalDeductions) }}</div>
            <div class="stat-trend trend-down">含五险一金与个人所得税</div>
          </div>
          <div class="stat-icon-wrapper yellow">📉</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">实发总额 (税后)</div>
            <div class="stat-info-val" style="color: var(--success);">{{ formatMoney(summaryData.totalNet) }}</div>
            <div class="stat-trend trend-up">企业本月实付薪资现金流</div>
          </div>
          <div class="stat-icon-wrapper green">💸</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">核算员工总数</div>
            <div class="stat-info-val">{{ summaryData.totalCount }} 人</div>
            <div class="stat-trend trend-up">本月正常发放人数</div>
          </div>
          <div class="stat-icon-wrapper blue">👥</div>
        </div>
      </div>

      <!-- 两个报表图表组件 -->
      <div class="dashboard-grid">
        <!-- 部门薪资分布 -->
        <div class="card">
          <div class="dashboard-title-bar">
            <h3>各部门薪资汇总分布</h3>
          </div>
          <table class="simple-table">
            <thead>
              <tr>
                <th>部门名称</th>
                <th>人数</th>
                <th>应发总额</th>
                <th>代扣总额</th>
                <th>实发总额</th>
                <th>占薪酬预算比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in departmentSummaries" :key="d.dept">
                <td style="font-weight: 600;">{{ d.dept }}</td>
                <td>{{ d.count }}人</td>
                <td>{{ formatMoney(d.gross) }}</td>
                <td style="color: var(--danger);">{{ formatMoney(d.deduct) }}</td>
                <td style="font-weight: 700; color: var(--success);">{{ formatMoney(d.net) }}</td>
                <td>
                  <div class="progress-bar-container" style="width: 80px;">
                    <div class="progress-bar-fill" :style="{ width: d.percentage + '%' }"></div>
                  </div>
                  <span style="font-size: 12px; font-weight: 600; margin-left: 4px;">{{ d.percentage }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 薪资结构 breakdown -->
        <div class="card">
          <div class="dashboard-title-bar">
            <h3>企业薪资构成比例分解</h3>
          </div>
          
          <div class="structure-chart-container">
            <div class="structure-item" v-for="item in salaryBreakdowns" :key="item.name">
              <div class="structure-info">
                <span class="structure-name">{{ item.name }}</span>
                <span class="structure-val">{{ formatMoney(item.val) }} 元 ({{ item.percentage }}%)</span>
              </div>
              <div class="bar-bg">
                <div class="bar-fill" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 5. 审批流程步骤 (Step 4) -->
    <div v-else-if="currentStep === 4" class="step-content">
      <div class="step-title-bar">
        <h3>4. 本月工资单多级在线审批</h3>
        <div class="step-status-tag" :class="approvalStatusClass">
          当前状态: {{ approvalStatusText }}
        </div>
      </div>

      <div class="approval-workflow-panel">
        <!-- 审批时序节点线 -->
        <div class="flow-nodes">
          <div class="flow-node" :class="{ done: approvalFlow.stage >= 1, active: approvalFlow.stage === 0 }">
            <div class="node-circle">1</div>
            <div class="node-content">
              <div class="node-title">提交工资表</div>
              <div class="node-operator">制表人: 刘思彤</div>
              <div class="node-status">{{ approvalFlow.stage >= 1 ? '已提交' : '待提交' }}</div>
              <div class="node-time" v-if="approvalFlow.time1">{{ approvalFlow.time1 }}</div>
            </div>
          </div>

          <div class="flow-line" :class="{ filled: approvalFlow.stage >= 1 }"></div>

          <div class="flow-node" :class="{ done: approvalFlow.stage >= 2, active: approvalFlow.stage === 1 }">
            <div class="node-circle">2</div>
            <div class="node-content">
              <div class="node-title">财务主管审批</div>
              <div class="node-operator">复核人: 钱伟</div>
              <div class="node-status">{{ approvalFlow.stage >= 2 ? '审批同意' : (approvalFlow.stage === 1 ? '审批中' : '等待中') }}</div>
              <div class="node-time" v-if="approvalFlow.time2">{{ approvalFlow.time2 }}</div>
            </div>
          </div>

          <div class="flow-line" :class="{ filled: approvalFlow.stage >= 2 }"></div>

          <div class="flow-node" :class="{ done: approvalFlow.stage >= 3, active: approvalFlow.stage === 2 }">
            <div class="node-circle">3</div>
            <div class="node-content">
              <div class="node-title">总经理终审</div>
              <div class="node-operator">批准人: 赵敏</div>
              <div class="node-status">{{ approvalFlow.stage >= 3 ? '审批同意' : (approvalFlow.stage === 2 ? '审批中' : '等待中') }}</div>
              <div class="node-time" v-if="approvalFlow.time3">{{ approvalFlow.time3 }}</div>
            </div>
          </div>
        </div>

        <!-- 审批控制面板 -->
        <div class="approval-actions-box">
          <h4>审批操作栏</h4>
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            请按照系统要求，将当月工资表依次呈报主管和总经理审批。审批通过后方能进入下一步“电子发放”环节。
          </p>

          <div style="display: flex; gap: 12px;">
            <button 
              class="btn btn-primary" 
              :disabled="approvalFlow.stage !== 0" 
              @click="submitForApproval"
            >
              📤 提交工资单申请
            </button>
            <button 
              class="btn btn-success" 
              :disabled="approvalFlow.stage !== 1" 
              @click="approveBySupervisor"
            >
              💼 模拟财务主管复核通过
            </button>
            <button 
              class="btn btn-success" 
              :disabled="approvalFlow.stage !== 2" 
              @click="approveByGM"
            >
              👑 模拟总经理终审通过
            </button>
            <button 
              class="btn btn-danger" 
              :disabled="approvalFlow.stage === 0 || approvalFlow.stage === 3" 
              @click="rejectApproval"
            >
              ❌ 退回重拟
            </button>
          </div>
        </div>

        <!-- 审批历史记录 -->
        <div class="card" style="margin-top: 30px;">
          <div class="dashboard-title-bar">
            <h3>审批历史日志</h3>
          </div>
          <table class="simple-table">
            <thead>
              <tr>
                <th>操作时间</th>
                <th>操作人员</th>
                <th>岗位角色</th>
                <th>动作</th>
                <th>审批意见</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="approvalLogs.length === 0">
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">暂无审批流转记录</td>
              </tr>
              <tr v-else v-for="(log, idx) in approvalLogs" :key="idx">
                <td>{{ log.time }}</td>
                <td>{{ log.operator }}</td>
                <td>{{ log.role }}</td>
                <td>
                  <span class="badge" :class="getLogBadgeClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td>{{ log.opinion }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- 6. 电子分发与员工签收步骤 (Step 5) -->
    <div v-else-if="currentStep === 5" class="step-content">
      <div class="step-title-bar">
        <h3>5. 电子工资条一键发放与员工签收监控</h3>
        <div class="step-actions">
          <button class="btn btn-primary" :disabled="approvalFlow.stage !== 3" @click="distributeElectronically">✉️ 一键群发电子工资条 (邮件+短信+小程序)</button>
          <button class="btn btn-success" :disabled="!distributeClicked" @click="simulateEmployeeSignoffs">🤝 模拟员工一键阅读并线上签收</button>
        </div>
      </div>

      <div class="alert alert-warning" v-if="approvalFlow.stage !== 3" style="margin-bottom: 20px;">
        ⚠️ 请注意：当前薪资月份审批流程尚未通过，不可执行发放。请先在第四步中完成总经理终审。
      </div>

      <!-- 员工发放与签收状态表格 -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>工号</th>
              <th>姓名</th>
              <th>部门</th>
              <th>接收邮箱</th>
              <th>通知渠道</th>
              <th>发放状态</th>
              <th>签收状态</th>
              <th>反馈意见</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in distributionList" :key="emp.empId">
              <td style="font-weight: 600; font-family: var(--font-title);">{{ emp.empId }}</td>
              <td style="font-weight: 500;">{{ emp.name }}</td>
              <td>{{ emp.dept }}</td>
              <td>{{ emp.email }}</td>
              <td>
                <span class="channel-tag text-mail">📧 邮件</span>
                <span class="channel-tag text-sms">💬 短信</span>
                <span class="channel-tag text-app">📱 OA客户端</span>
              </td>
              <td>
                <span class="badge" :class="emp.sendStatus === '已发送' ? 'success' : 'muted'">
                  {{ emp.sendStatus }}
                </span>
              </td>
              <td>
                <span class="badge" :class="emp.signStatus === '已签收' ? 'success' : (emp.sendStatus === '已发送' ? 'warning' : 'muted')">
                  {{ emp.signStatus }}
                </span>
                <span v-if="emp.signTime" style="font-size: 11px; display: block; color: var(--text-muted); margin-top: 4px;">
                  {{ emp.signTime }}
                </span>
              </td>
              <td>{{ emp.feedback || '-' }}</td>
              <td>
                <button 
                  class="btn btn-secondary btn-xs" 
                  :disabled="emp.sendStatus !== '已发送' || emp.signStatus === '已签收'"
                  @click="simulateSingleSignoff(emp.empId)"
                >
                  模拟签收
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 调薪弹窗 -->
    <div class="modal-overlay" v-if="showAdjustModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">调整薪资明细</h3>
          <span class="modal-close" @click="closeAdjustModal">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group">
              <label>员工姓名</label>
              <input type="text" class="form-control" :value="form.name + ' (' + form.empId + ')'" style="width: 100%;" disabled>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>基本工资</label>
                <input type="number" class="form-control" v-model.number="form.baseSalary" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>岗位津贴</label>
                <input type="number" class="form-control" v-model.number="form.allowance" style="width: 100%;" required>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>绩效奖金</label>
                <input type="number" class="form-control" v-model.number="form.bonus" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>个人所得税</label>
                <input type="number" class="form-control" v-model.number="form.tax" style="width: 100%;" required>
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>社保扣款</label>
                <input type="number" class="form-control" v-model.number="form.socialSec" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>公积金扣款</label>
                <input type="number" class="form-control" v-model.number="form.housingFund" style="width: 100%;" required>
              </div>
            </div>
            <div class="form-group">
              <label>发放状态</label>
              <select class="form-control" v-model="form.status" style="width: 100%;">
                <option value="已发放">已发放</option>
                <option value="未发放">未发放</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAdjustModal">取消</button>
            <button type="submit" class="btn btn-primary">确认调整</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { store, updateSalary } from '../store';
import type { Salary } from '../store';

// Stepper Steps
const steps = [
  { value: 1, name: '数据准备' },
  { value: 2, name: '工资条生成' },
  { value: 3, name: '汇总统计' },
  { value: 4, name: '审批流程' },
  { value: 5, name: '发放与签收' }
];
const currentStep = ref(1);

const goToStep = (stepVal: number) => {
  currentStep.value = stepVal;
};

const nextStep = () => {
  if (currentStep.value < 5) currentStep.value++;
};

// ==================== Step 1: 数据准备 ====================
const searchKeyword = ref('');
const searchDept = ref('');
const searchStatus = ref('');

const filterKeyword = ref('');
const filterDept = ref('');
const filterStatus = ref('');

const currentPage = ref(1);
const pageSize = 5;

const showAdjustModal = ref(false);
const form = ref({
  empId: '',
  name: '',
  baseSalary: 0,
  allowance: 0,
  bonus: 0,
  socialSec: 0,
  housingFund: 0,
  tax: 0,
  status: '未发放'
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

const filteredSalary = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const dept = filterDept.value;
  const status = filterStatus.value;

  return store.salary.filter(s => {
    const matchKeyword = !keyword || s.name.toLowerCase().includes(keyword) || s.empId.includes(keyword);
    const matchDept = !dept || s.dept === dept;
    const matchStatus = !status || s.status === status;
    return matchKeyword && matchDept && matchStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredSalary.value.length / pageSize) || 1);

const pagedSalary = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredSalary.value.slice(start, start + pageSize);
});

const formatMoney = (val: number) => {
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const openAdjustModal = (s: Salary) => {
  form.value = {
    empId: s.empId,
    name: s.name,
    baseSalary: s.baseSalary,
    allowance: s.allowance,
    bonus: s.bonus,
    socialSec: s.socialSec,
    housingFund: s.housingFund,
    tax: s.tax,
    status: s.status
  };
  showAdjustModal.value = true;
};

const closeAdjustModal = () => {
  showAdjustModal.value = false;
};

const handleSave = () => {
  updateSalary(form.value.empId, {
    baseSalary: form.value.baseSalary,
    allowance: form.value.allowance,
    bonus: form.value.bonus,
    socialSec: form.value.socialSec,
    housingFund: form.value.housingFund,
    tax: form.value.tax,
    status: form.value.status
  });
  alert('调薪成功且已自动重算实发工资！');
  closeAdjustModal();
};

// 一键自动核算公式
const triggerAutoCalculation = () => {
  store.salary.forEach(s => {
    // 养老8% + 医疗2% + 失业0.5%
    const calculatedSocialSec = Math.round(s.baseSalary * 0.105);
    // 公积金12%
    const calculatedHousingFund = Math.round(s.baseSalary * 0.12);
    // 累计应纳税所得额 = (基本 + 津贴 + 奖金) - 五险一金 - 5000免税额
    const gross = s.baseSalary + s.allowance + s.bonus;
    const taxable = gross - calculatedSocialSec - calculatedHousingFund - 5000;
    
    let calculatedTax = 0;
    if (taxable > 0) {
      if (taxable <= 3000) calculatedTax = Math.round(taxable * 0.03);
      else if (taxable <= 12000) calculatedTax = Math.round(taxable * 0.10 - 210);
      else if (taxable <= 25000) calculatedTax = Math.round(taxable * 0.20 - 1410);
      else calculatedTax = Math.round(taxable * 0.25 - 2660);
    }

    updateSalary(s.empId, {
      socialSec: calculatedSocialSec,
      housingFund: calculatedHousingFund,
      tax: calculatedTax,
      status: s.status
    });
  });
  alert('五险一金扣除与个人所得税已自动按最新税率公式重算完成！');
};

const triggerImportMock = () => {
  store.salary.forEach(s => {
    // 随机增加一些加班费/绩效变动
    const randomBonusBoost = Math.floor(Math.random() * 800) + 200;
    updateSalary(s.empId, {
      bonus: s.bonus + randomBonusBoost,
      status: s.status
    });
  });
  alert('成功自动读取并导入本月打卡考勤与绩效评价数据！已重算各项奖金。');
};

// ==================== Step 2: 工资条生成与预览 ====================
const selectorKeyword = ref('');
const selectedPreviewId = ref('');

const filteredSelectorSalary = computed(() => {
  const kw = selectorKeyword.value.trim().toLowerCase();
  return store.salary.filter(s => !kw || s.name.toLowerCase().includes(kw) || s.empId.includes(kw));
});

const previewPayslip = computed(() => {
  return store.salary.find(s => s.empId === selectedPreviewId.value) || store.salary[0] || null;
});

const previewEmployee = computed(() => {
  if (!previewPayslip.value) return null;
  return store.employees.find(e => e.id === previewPayslip.value!.empId) || null;
});

// WPS preview computational breakdowns
const previewPostSalary = computed(() => (previewPayslip.value ? Math.round(previewPayslip.value.allowance * 0.4) : 0));
const previewPerformanceSalary = computed(() => (previewPayslip.value ? Math.round(previewPayslip.value.bonus * 0.6) : 0));
const previewOtSalary = computed(() => (previewPayslip.value ? Math.round(previewPayslip.value.bonus * 0.4) : 0));
const previewAllowance = computed(() => (previewPayslip.value ? Math.round(previewPayslip.value.allowance * 0.6) : 0));

const previewGrossPay = computed(() => {
  if (!previewPayslip.value) return 0;
  return previewPayslip.value.baseSalary + previewPostSalary.value + previewPerformanceSalary.value + previewOtSalary.value + previewAllowance.value;
});

const previewPension = computed(() => (previewPayslip.value ? Math.round(previewPayslip.value.baseSalary * 0.08) : 0));
const previewMedical = computed(() => (previewPayslip.value ? Math.round(previewPayslip.value.baseSalary * 0.02) : 0));
const previewUnemployment = computed(() => (previewPayslip.value ? Math.round(previewPayslip.value.baseSalary * 0.005) : 0));

const previewTotalDeductions = computed(() => {
  if (!previewPayslip.value) return 0;
  return previewPension.value + previewMedical.value + previewUnemployment.value + previewPayslip.value.housingFund + previewPayslip.value.tax;
});

const previewPayslipJobLevel = computed(() => {
  const role = previewEmployee.value?.role || '';
  if (role.includes('高级') || role.includes('专家')) return 'P7';
  if (role.includes('总监') || role.includes('经理')) return 'M3';
  return 'P5';
});

const previewPayslipBankNo = computed(() => {
  if (!previewPayslip.value) return '';
  return `6222 **** **** ${previewPayslip.value.empId.slice(-4)}`;
});

// Generate and export WPS formatted XLS spreadsheet
const exportWpsHtmlFile = (s: any) => {
  const emp = store.employees.find(e => e.id === s.empId) || { role: '工程师', joinDate: '2022-03-01' };
  const name = s.name;
  const empId = s.empId;
  const dept = s.dept;
  const role = emp.role || '工程师';
  const joinDate = emp.joinDate || '2022-03-01';
  const level = role.includes('高级') || role.includes('专家') ? 'P7' : role.includes('总监') || role.includes('经理') ? 'M3' : 'P5';
  const bankAccount = `6222 **** **** ${empId.slice(-4)}`;
  const payMethod = '银行代发';

  const baseVal = s.baseSalary;
  const postVal = Math.round(s.allowance * 0.4);
  const perfVal = Math.round(s.bonus * 0.6);
  const otVal = Math.round(s.bonus * 0.4);
  const allowVal = Math.round(s.allowance * 0.6);
  const commVal = 0;
  const grossVal = baseVal + postVal + perfVal + otVal + allowVal + commVal;

  const pensionVal = Math.round(s.baseSalary * 0.08);
  const medicalVal = Math.round(s.baseSalary * 0.02);
  const unemployVal = Math.round(s.baseSalary * 0.005);
  const fundVal = s.housingFund;
  const taxVal = s.tax;
  const otherVal = 0;
  const deductVal = pensionVal + medicalVal + unemployVal + fundVal + taxVal + otherVal;
  
  const netVal = grossVal - deductVal;

  const wpsTemplateHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
    <!--[if gte o:office:office]>
    <xml>
      <o:DocumentProperties>
        <o:Author>OA System</o:Author>
      </o:DocumentProperties>
    </xml>
    <![endif]-->
    <style>
      table { border-collapse: collapse; font-family: SimSun, Arial; }
      td { border: 0.5pt solid #cbd5e0; padding: 8px 16px; font-size: 11pt; color: #1a1e36; height: 32px; vertical-align: middle; }
      .header-title-cell { font-size: 16pt; font-weight: bold; background-color: #e6f4ea; color: #1d4e7a; text-align: center; border: 1pt solid #10b981; }
      .header-subtitle-cell { font-size: 12pt; font-weight: bold; background-color: #dbeafe; color: #1e40af; text-align: center; }
      .category-header-cell { background-color: #1d4e7a; color: #ffffff; font-weight: bold; text-align: center; border: 0.5pt solid #1d4e7a; }
      .label-cell { font-weight: bold; background-color: #ffffff; }
      .value-cell { background-color: #ffffff; text-align: left; }
      .number-cell { text-align: right; }
      .yellow-total-row { background-color: #fef9c3; font-weight: bold; }
      .net-formula { font-weight: bold; }
      .net-value { font-size: 16pt; font-weight: bold; color: #dc2626; text-align: right; }
      .notes-body { font-size: 10pt; color: #718096; }
      .signature-cell { font-weight: bold; }
    </style>
    </head>
    <body>
    <table>
      <!-- 空白行对齐，同时在这里定义 Column A 和 Column B 的宽度 -->
      <tr height="28" style="height: 28px;">
        <td width="60" style="border: none; background: transparent; width: 60pt;"></td>
        <td width="60" style="border: none; background: transparent; width: 60pt;"></td>
        <td colspan="4" style="border: none; background: transparent;"></td>
      </tr>
      <tr height="28" style="height: 28px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="4" style="border: none; background: transparent;"></td>
      </tr>

      <tr class="header-title-row" height="50" style="height: 50px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="4" class="header-title-cell">XX公司 工资条</td>
      </tr>
      <tr class="header-subtitle-row" height="38" style="height: 38px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="4" class="header-subtitle-cell">薪资月份：2026年5月</td>
      </tr>
      
      <!-- Category 1 -->
      <tr height="38" style="height: 38px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="4" class="category-header-cell">员工基本信息</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell" width="160" style="width: 160pt;">姓名：</td>
        <td class="value-cell" width="260" style="width: 260pt;">${name}</td>
        <td class="label-cell" width="160" style="width: 160pt;">工号：</td>
        <td class="value-cell" width="260" style="width: 260pt;">${empId}</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">部门：</td>
        <td class="value-cell">${dept}</td>
        <td class="label-cell">岗位：</td>
        <td class="value-cell">${role}</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">职级：</td>
        <td class="value-cell">${level}</td>
        <td class="label-cell">入职日期：</td>
        <td class="value-cell">${joinDate}</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">银行账号：</td>
        <td class="value-cell">${bankAccount}</td>
        <td class="label-cell">发薪方式：</td>
        <td class="value-cell">${payMethod}</td>
      </tr>

      <!-- Category 2 -->
      <tr height="38" style="height: 38px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="4" class="category-header-cell">应发工资 (税前)</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">基本工资：</td>
        <td class="number-cell">${formatMoney(baseVal)}</td>
        <td class="label-cell">岗位工资：</td>
        <td class="number-cell">${formatMoney(postVal)}</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">绩效工资：</td>
        <td class="number-cell">${formatMoney(perfVal)}</td>
        <td class="label-cell">加班费：</td>
        <td class="number-cell">${formatMoney(otVal)}</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">各类补贴 (餐/交/通)：</td>
        <td class="number-cell">${formatMoney(allowVal)}</td>
        <td class="label-cell">奖金 / 提成：</td>
        <td class="number-cell">${formatMoney(commVal)}</td>
      </tr>
      <tr height="38" style="height: 38px; font-weight: bold;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="2" style="background-color: #fef9c3;">应发合计：</td>
        <td colspan="2" class="number-cell" style="background-color: #fef9c3;">${formatMoney(grossVal)}</td>
      </tr>

      <!-- Category 3 -->
      <tr height="38" style="height: 38px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="4" class="category-header-cell">代扣项</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">养老保险 (个人 8%)：</td>
        <td class="number-cell" style="color: #ef4444;">${formatMoney(pensionVal)}</td>
        <td class="label-cell">医疗保险 (个人 2%)：</td>
        <td class="number-cell" style="color: #ef4444;">${formatMoney(medicalVal)}</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">失业保险 (个人 0.5%)：</td>
        <td class="number-cell" style="color: #ef4444;">${formatMoney(unemployVal)}</td>
        <td class="label-cell">住房公积金 (个人 12%)：</td>
        <td class="number-cell" style="color: #ef4444;">${formatMoney(fundVal)}</td>
      </tr>
      <tr height="35" style="height: 35px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">个人所得税：</td>
        <td class="number-cell" style="color: #ef4444;">${formatMoney(taxVal)}</td>
        <td class="label-cell">其他扣款：</td>
        <td class="number-cell" style="color: #ef4444;">${formatMoney(otherVal)}</td>
      </tr>
      <tr height="38" style="height: 38px; font-weight: bold;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="2" style="background-color: #fef9c3;">代扣合计：</td>
        <td colspan="2" class="number-cell" style="color: #ef4444; background-color: #fef9c3;">${formatMoney(deductVal)}</td>
      </tr>

      <!-- Category 4 -->
      <tr height="38" style="height: 38px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="4" class="category-header-cell">实发工资 (税后)</td>
      </tr>
      <tr height="45" style="height: 45px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td colspan="2" class="net-formula">实发工资 = 应发合计 - 代扣合计</td>
        <td colspan="2" class="net-value">¥${formatMoney(netVal)}</td>
      </tr>

      <!-- Category 5 (Merged into a single row) -->
      <tr height="45" style="height: 45px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="label-cell">备注：</td>
        <td colspan="3" class="notes-body" style="text-align: left;">本月绩效系数：1.0 | 考勤：全勤 | 加班：20小时 | 发放日期：2026年5月15日 | 如对工资有疑问，请在3个工作日内联系HR薪酬组</td>
      </tr>

      <!-- Signatures in a single row (No category header) -->
      <tr height="50" style="height: 50px;">
        <td style="border: none; background: transparent;"></td>
        <td style="border: none; background: transparent;"></td>
        <td class="value-cell" style="vertical-align: top; padding-top: 4px; font-weight: bold;">制表人：</td>
        <td class="value-cell" style="vertical-align: top; padding-top: 4px; font-weight: bold;">审批人：</td>
        <td class="value-cell" colspan="2" style="vertical-align: top; padding-top: 4px; font-weight: bold;">员工签收：</td>
      </tr>
    </table>
    </body>
    </html>
  `;
  
  const blob = new Blob([wpsTemplateHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}_2026年5月工资条_WPS模板.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportCurrentWps = () => {
  if (previewPayslip.value) {
    exportWpsHtmlFile(previewPayslip.value);
  }
};

const batchExportWps = () => {
  store.salary.forEach(s => {
    exportWpsHtmlFile(s);
  });
  alert(`已为您生成并导出全部 ${store.salary.length} 位员工的 WPS 工资条文件包！`);
};

// Default selection on mount
watch(() => store.salary, (newVal) => {
  if (newVal.length > 0 && !selectedPreviewId.value) {
    selectedPreviewId.value = newVal[0].empId;
  }
}, { immediate: true, deep: true });


// ==================== Step 3: 汇总统计 ====================
const summaryData = computed(() => {
  let gross = 0;
  let deduct = 0;
  let net = 0;
  
  store.salary.forEach(s => {
    const postVal = Math.round(s.allowance * 0.4);
    const perfVal = Math.round(s.bonus * 0.6);
    const otVal = Math.round(s.bonus * 0.4);
    const allowVal = Math.round(s.allowance * 0.6);
    const itemGross = s.baseSalary + postVal + perfVal + otVal + allowVal;
    
    const pensionVal = Math.round(s.baseSalary * 0.08);
    const medicalVal = Math.round(s.baseSalary * 0.02);
    const unemployVal = Math.round(s.baseSalary * 0.005);
    const itemDeduct = pensionVal + medicalVal + unemployVal + s.housingFund + s.tax;

    gross += itemGross;
    deduct += itemDeduct;
    net += (itemGross - itemDeduct);
  });

  return {
    totalGross: gross,
    totalDeductions: deduct,
    totalNet: net,
    totalCount: store.salary.length
  };
});

// 各部门薪资汇总
const departmentSummaries = computed(() => {
  const depts = Array.from(new Set(store.salary.map(s => s.dept)));
  const list = depts.map(deptName => {
    let gross = 0;
    let deduct = 0;
    let net = 0;
    let count = 0;
    
    store.salary.forEach(s => {
      if (s.dept === deptName) {
        count++;
        const postVal = Math.round(s.allowance * 0.4);
        const perfVal = Math.round(s.bonus * 0.6);
        const otVal = Math.round(s.bonus * 0.4);
        const allowVal = Math.round(s.allowance * 0.6);
        const itemGross = s.baseSalary + postVal + perfVal + otVal + allowVal;
        
        const pensionVal = Math.round(s.baseSalary * 0.08);
        const medicalVal = Math.round(s.baseSalary * 0.02);
        const unemployVal = Math.round(s.baseSalary * 0.005);
        const itemDeduct = pensionVal + medicalVal + unemployVal + s.housingFund + s.tax;

        gross += itemGross;
        deduct += itemDeduct;
        net += (itemGross - itemDeduct);
      }
    });

    const percentage = summaryData.value.totalNet > 0 
      ? Math.round((net / summaryData.value.totalNet) * 100) 
      : 0;

    return {
      dept: deptName,
      count,
      gross,
      deduct,
      net,
      percentage
    };
  });
  return list;
});

// 薪资构成分解
const salaryBreakdowns = computed(() => {
  let baseSum = 0;
  let allowanceSum = 0;
  let bonusSum = 0;
  let insuranceSum = 0;
  let taxSum = 0;

  store.salary.forEach(s => {
    baseSum += s.baseSalary;
    allowanceSum += s.allowance;
    bonusSum += s.bonus;
    insuranceSum += (Math.round(s.baseSalary * 0.105) + s.housingFund);
    taxSum += s.tax;
  });

  const total = baseSum + allowanceSum + bonusSum + insuranceSum + taxSum;

  const items = [
    { name: '基本工资', val: baseSum, percentage: total > 0 ? Math.round((baseSum / total) * 100) : 0, color: 'var(--primary)' },
    { name: '岗位津贴与各类补贴', val: allowanceSum, percentage: total > 0 ? Math.round((allowanceSum / total) * 100) : 0, color: 'var(--info)' },
    { name: '加班费与绩效奖金', val: bonusSum, percentage: total > 0 ? Math.round((bonusSum / total) * 100) : 0, color: 'var(--success)' },
    { name: '代扣五险一金', val: insuranceSum, percentage: total > 0 ? Math.round((insuranceSum / total) * 100) : 0, color: 'var(--warning)' },
    { name: '个人所得税扣缴', val: taxSum, percentage: total > 0 ? Math.round((taxSum / total) * 100) : 0, color: 'var(--danger)' }
  ];

  return items;
});


// ==================== Step 4: 审批流程 ====================
interface ApprovalLog {
  time: string;
  operator: string;
  role: string;
  action: string;
  opinion: string;
}

const approvalFlow = ref({
  stage: 0, // 0: 待提交, 1: 主管审批中, 2: 总经理审批中, 3: 审批通过
  time1: '',
  time2: '',
  time3: ''
});

const approvalLogs = ref<ApprovalLog[]>([]);

const approvalStatusText = computed(() => {
  if (approvalFlow.value.stage === 0) return '待提交申请';
  if (approvalFlow.value.stage === 1) return '财务主管复核中';
  if (approvalFlow.value.stage === 2) return '总经理终审中';
  return '审批流已通过';
});

const approvalStatusClass = computed(() => {
  if (approvalFlow.value.stage === 0) return 'muted';
  if (approvalFlow.value.stage === 1) return 'warning';
  if (approvalFlow.value.stage === 2) return 'info';
  return 'success';
});

const getLogBadgeClass = (action: string) => {
  if (action.includes('同意') || action.includes('提交') || action.includes('通过')) return 'success';
  if (action.includes('驳回') || action.includes('退回')) return 'danger';
  return 'warning';
};

const formatCurrentTime = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const submitForApproval = () => {
  const time = formatCurrentTime();
  approvalFlow.value.stage = 1;
  approvalFlow.value.time1 = time;
  approvalLogs.value.unshift({
    time,
    operator: '刘思彤',
    role: '制表人 (HR专员)',
    action: '提交审批申请',
    opinion: '本月工资核算明细数据无误，已算好应发与代扣项，呈报财务部复核。'
  });
  alert('工资单已成功呈报财务主管钱伟审批！');
};

const approveBySupervisor = () => {
  const time = formatCurrentTime();
  approvalFlow.value.stage = 2;
  approvalFlow.value.time2 = time;
  approvalLogs.value.unshift({
    time,
    operator: '钱伟',
    role: '财务主管',
    action: '复核同意',
    opinion: '经抽查复核，各项基本工资及五险一金算法无误，准予通过。'
  });
  alert('财务主管复核通过，已提报总经理赵敏终审！');
};

const approveByGM = () => {
  const time = formatCurrentTime();
  approvalFlow.value.stage = 3;
  approvalFlow.value.time3 = time;
  approvalLogs.value.unshift({
    time,
    operator: '赵敏',
    role: '总经理',
    action: '终审批准',
    opinion: '本月工资报表统计无误，批准进行发放。'
  });
  alert('总经理赵敏批准同意！审批流全生命周期已闭环，现可执行电子发放。');
};

const rejectApproval = () => {
  const time = formatCurrentTime();
  approvalFlow.value.stage = 0;
  approvalFlow.value.time1 = '';
  approvalFlow.value.time2 = '';
  approvalFlow.value.time3 = '';
  approvalLogs.value.unshift({
    time,
    operator: '钱伟',
    role: '财务主管',
    action: '驳回退回',
    opinion: '个别员工社保抵扣数据有出入，请核实后重提。'
  });
  alert('审批单已被退回至制表草稿状态。');
};


// ==================== Step 5: 发放与签收 ====================
interface DistributeItem {
  empId: string;
  name: string;
  dept: string;
  email: string;
  sendStatus: '未发送' | '已发送';
  signStatus: '未签收' | '已签收';
  signTime?: string;
  feedback?: string;
}

const distributionList = ref<DistributeItem[]>([]);
const distributeClicked = ref(false);

const initDistributionList = () => {
  distributionList.value = store.salary.map(s => {
    return {
      empId: s.empId,
      name: s.name,
      dept: s.dept,
      email: `${s.empId.toLowerCase()}@smart-oa.com`,
      sendStatus: '未发送',
      signStatus: '未签收'
    };
  });
};

const distributeElectronically = () => {
  distributionList.value.forEach(item => {
    item.sendStatus = '已发送';
  });
  distributeClicked.value = true;
  alert('电子工资条已通过企业邮件、短信提醒以及小程序通道批量分发！');
};

const simulateEmployeeSignoffs = () => {
  const time = formatCurrentTime();
  distributionList.value.forEach((item, idx) => {
    item.signStatus = '已签收';
    item.signTime = time;
    if (idx === 1) {
      item.feedback = '确认数据无误';
    }
  });
  alert('模拟员工一键阅读并签收工资条成功！');
};

const simulateSingleSignoff = (id: string) => {
  const item = distributionList.value.find(d => d.empId === id);
  if (item) {
    item.signStatus = '已签收';
    item.signTime = formatCurrentTime();
    alert(`员工 ${item.name} 已成功签收当月工资条！`);
  }
};

watch(() => store.salary, () => {
  initDistributionList();
}, { immediate: true, deep: true });

onMounted(() => {
  initDistributionList();
  if (store.salary.length > 0) {
    selectedPreviewId.value = store.salary[0].empId;
  }
});
</script>

<style scoped>
/* Stepper 导航栏样式 */
.salary-stepper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
  padding: 20px 30px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  margin-bottom: 30px;
  border: 1px solid rgba(226, 232, 240, 0.4);
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  position: relative;
  cursor: pointer;
}

.step-item:last-child {
  flex: none;
}

.step-num-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--bg-main);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  border: 2px solid var(--border-color);
  z-index: 2;
  transition: var(--transition);
}

.step-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  z-index: 2;
  transition: var(--transition);
}

.step-connector {
  flex: 1;
  height: 2px;
  background-color: var(--border-color);
  margin: 0 16px;
  z-index: 1;
}

/* Stepper Stepper Active/Completed classes */
.step-item.active .step-num-circle {
  background-color: var(--primary);
  border-color: var(--primary);
  color: white;
}

.step-item.active .step-label {
  color: var(--primary);
}

.step-item.completed .step-num-circle {
  background-color: var(--success-light);
  border-color: var(--success);
  color: var(--success);
}

.step-item.completed .step-label {
  color: var(--text-title);
}

.step-item.completed .step-connector {
  background-color: var(--success);
}

/* 步骤内容块样式 */
.step-content {
  background-color: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(226, 232, 240, 0.4);
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1.5px solid var(--border-color);
  padding-bottom: 16px;
}

.step-title-bar h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-title);
}

.step-actions {
  display: flex;
  gap: 12px;
}

/* 分栏布局 */
.split-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
}

@media (max-width: 1024px) {
  .split-layout {
    grid-template-columns: 1fr;
  }
}

/* 左侧选择器 */
.employee-selector-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #fafbfc;
  height: 600px;
}

.selector-header {
  padding: 16px;
  font-weight: bold;
  color: var(--text-title);
  border-bottom: 1px solid var(--border-color);
  background-color: white;
}

.selector-search {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  background-color: white;
}

.selector-list {
  flex: 1;
  overflow-y: auto;
}

.selector-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
  background-color: white;
  transition: var(--transition);
}

.selector-item:hover {
  background-color: #f7fafc;
}

.selector-item.active {
  background-color: var(--primary-light);
  border-left: 4px solid var(--primary);
}

.emp-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.emp-info {
  text-align: left;
}

.emp-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-title);
}

.emp-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 右侧 WPS 工资条预览 */
.wps-preview-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  background-color: #f1f3f7;
  overflow-y: auto;
  height: 600px;
  display: flex;
  justify-content: center;
}

.wps-excel-canvas {
  width: 100%;
  max-width: 780px;
  background-color: #ffffff;
  border: 1px solid #cbd5e0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  font-family: 'SimSun', 'Arial', sans-serif;
  color: #1a1e36;
  text-align: left;
}

/* Excel Row and Grid Styles */
.excel-row {
  width: 100%;
}

.excel-title-row {
  border-top: 3px solid #10b981;
}

.title-cell {
  background-color: #e6f4ea;
  color: #1d4e7a;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding: 12px;
  border-bottom: 1px solid #cbd5e0;
}

.subtitle-cell {
  background-color: #dbeafe;
  color: #1e40af;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  padding: 8px;
  border-bottom: 1px solid #cbd5e0;
}

.section-header-row {
  background-color: #1d4e7a;
}

.section-title {
  color: #ffffff;
  font-weight: bold;
  font-size: 13px;
  padding: 8px 16px;
  letter-spacing: 0.5px;
}

.excel-grid {
  display: flex;
  flex-direction: column;
}

.grid-row {
  display: flex;
  border-bottom: 1px solid #cbd5e0;
}

.grid-cell {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  border-right: 1px solid #cbd5e0;
}

.grid-cell:last-child {
  border-right: none;
}

.grid-cell.label {
  background-color: #ffffff;
  font-weight: bold;
  color: #4a5568;
  max-width: 120px;
}

.grid-cell.val {
  background-color: #ffffff;
}

.grid-cell.colspan-3 {
  flex: 3;
}

.grid-cell.colspan-2 {
  flex: 2;
}

.bold-text {
  font-weight: bold;
}

.text-right {
  text-align: right;
  font-family: var(--font-title);
  font-weight: 500;
}

.color-danger {
  color: var(--danger);
  font-weight: 500;
}

.total-row-bg {
  background-color: #fef9c3;
}

.highlight-item {
  border-left: 2.5px solid var(--primary);
}

.deduct-item {
  border-left: 2.5px solid var(--danger);
}

/* 实发工资条样式 */
.net-pay-container {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #cbd5e0;
  background-color: #ffffff;
}

.net-formula-cell {
  flex: 2;
  padding: 16px;
  font-size: 14px;
  font-weight: bold;
  border-right: 1px solid #cbd5e0;
  display: flex;
  align-items: center;
}

.net-val-cell {
  flex: 2;
  padding: 12px 24px;
  font-size: 22px;
  font-weight: bold;
  color: var(--danger);
  text-align: right;
  font-family: var(--font-title);
}

.excel-notes-box {
  padding: 12px 16px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
  border-bottom: 1px solid #cbd5e0;
}

.excel-signature-box {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sig-col {
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.sig-box {
  display: inline-block;
  width: 120px;
  height: 28px;
  border: 1px solid var(--border-color);
  background-color: white;
  margin-left: 8px;
  border-radius: 4px;
}

/* 薪资结构可视化 */
.structure-chart-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.structure-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.structure-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}

.structure-name {
  color: var(--text-title);
}

.structure-val {
  color: var(--text-muted);
}

.bar-bg {
  height: 14px;
  background-color: var(--border-color);
  border-radius: 7px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.8s ease-out;
}

/* 审批流程 */
.step-status-tag {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
}

.step-status-tag.muted { background-color: #f1f3f7; color: var(--text-muted); }
.step-status-tag.warning { background-color: var(--warning-light); color: var(--warning); }
.step-status-tag.info { background-color: var(--info-light); color: var(--info); }
.step-status-tag.success { background-color: var(--success-light); color: var(--success); }

.flow-nodes {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 30px 40px;
  background-color: #fafbfc;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: 30px;
}

.flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 160px;
}

.node-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: white;
  border: 2.5px solid var(--border-color);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
  transition: var(--transition);
}

.flow-node.active .node-circle {
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.flow-node.done .node-circle {
  background-color: var(--success);
  border-color: var(--success);
  color: white;
}

.node-title {
  font-weight: bold;
  font-size: 14px;
  color: var(--text-title);
}

.node-operator {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.node-status {
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.flow-node.active .node-status { color: var(--primary); }
.flow-node.done .node-status { color: var(--success); }

.node-time {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 6px;
}

.flow-line {
  flex: 1;
  height: 3px;
  background-color: var(--border-color);
  margin-top: 20px;
}

.flow-line.filled {
  background-color: var(--success);
}

.approval-actions-box {
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: left;
}

.approval-actions-box h4 {
  font-weight: 700;
  font-size: 15px;
  color: var(--text-title);
  margin-bottom: 8px;
}

/* 标签通知渠道 */
.channel-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 4px;
  margin-bottom: 4px;
}

.channel-tag.text-mail { background-color: #eff6ff; color: #1d4ed8; }
.channel-tag.text-sms { background-color: #ecfdf5; color: #047857; }
.channel-tag.text-app { background-color: #f5f3ff; color: #6d28d9; }

.btn-xs {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
}

/* 提高薪资管理和发放签收表格的横向呼吸空间，防止换行和局促感 */
.data-table-container .data-table {
  min-width: 1250px;
}

.data-table-container .data-table th,
.data-table-container .data-table td {
  white-space: nowrap;
  padding: 16px 22px;
  text-align: center;
}

/* 前三列和操作列适当对齐，其余数值列可居中或右对齐 */
.data-table-container .data-table th:nth-child(1),
.data-table-container .data-table td:nth-child(1),
.data-table-container .data-table th:nth-child(2),
.data-table-container .data-table td:nth-child(2),
.data-table-container .data-table th:nth-child(3),
.data-table-container .data-table td:nth-child(3) {
  text-align: left;
}

.data-table-container .data-table th:last-child,
.data-table-container .data-table td:last-child {
  text-align: center;
}
</style>
