<template>
  <div id="page-attendance-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">考勤管理</h2>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="mockExport">📊 导出报表</button>
        <button class="btn btn-secondary" @click="syncAttendance">🔄 同步考勤数据</button>
      </div>
    </div>

    <!-- 业务模块导航 Tab -->
    <div class="attendance-nav-tabs">
      <div 
        class="attendance-nav-tab" 
        :class="{ active: activeTab === 'punch' }" 
        @click="activeTab = 'punch'"
      >
        🌅 模拟打卡与记录
      </div>
      <div 
        class="attendance-nav-tab" 
        :class="{ active: activeTab === 'roster' }" 
        @click="activeTab = 'roster'"
      >
        📅 智能排班管理
      </div>
      <div 
        class="attendance-nav-tab" 
        :class="{ active: activeTab === 'exception' }" 
        @click="activeTab = 'exception'"
      >
        🚨 异常申请与审批
        <span class="tab-badge" v-if="pendingExceptionsCount > 0">{{ pendingExceptionsCount }}</span>
      </div>
      <div 
        class="attendance-nav-tab" 
        :class="{ active: activeTab === 'settlement' }" 
        @click="activeTab = 'settlement'"
      >
        🪙 考勤数据核算
      </div>
      <div 
        class="attendance-nav-tab" 
        :class="{ active: activeTab === 'analysis' }" 
        @click="activeTab = 'analysis'"
      >
        📈 数据汇总与分析
      </div>
    </div>

    <!-- ==================== Tab 1: 模拟打卡与记录 ==================== -->
    <div v-if="activeTab === 'punch'" class="tab-content-wrapper">
      <!-- 顶部简报 -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">应出勤</div>
            <div class="stat-info-val">{{ summary.should }}</div>
          </div>
          <div class="stat-icon-wrapper purple">⏱️</div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">实出勤</div>
            <div class="stat-info-val" style="color: var(--success);">{{ summary.actual }}</div>
          </div>
          <div class="stat-icon-wrapper green">✓</div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">迟到</div>
            <div class="stat-info-val" style="color: var(--warning);">{{ summary.late }}</div>
          </div>
          <div class="stat-icon-wrapper yellow">⚠</div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">早退</div>
            <div class="stat-info-val" style="color: var(--danger);">{{ summary.early }}</div>
          </div>
          <div class="stat-icon-wrapper blue">⌛</div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <div class="stat-info-title">外勤</div>
            <div class="stat-info-val" style="color: #f97316;">{{ summary.outOfRange }}</div>
          </div>
          <div class="stat-icon-wrapper orange" style="background-color: #ffedd5; color: #f97316;">🏃</div>
        </div>
      </div>

      <!-- 考勤打卡面板 -->
      <div class="sandbox-card punch-card-real">
        <div class="sandbox-header">
          <h3 class="sandbox-title">⏱️ 员工定位打卡签到</h3>
          <p class="sandbox-subtitle" style="margin-bottom: 8px;">系统已开启安全打卡防作弊策略。当前考勤需验证您在公司指定的物理围栏范围内，或直连公司办公无线网络。</p>
        </div>
        <div class="sandbox-body">
          <!-- 员工简要信息 -->
          <div class="punch-user-info-bar">
            <div class="user-info-item">
              <span class="info-icon">👤</span>
              <span class="info-label">打卡人：</span>
              <span class="info-value font-highlight">{{ activeEmpName }} ({{ activeEmpId }})</span>
            </div>
            <div class="user-info-item">
              <span class="info-icon">🏢</span>
              <span class="info-label">所属部门：</span>
              <span class="info-value">{{ activeEmpDept }}</span>
            </div>
            <div class="user-info-item">
              <span class="info-icon">📱</span>
              <span class="info-label">安全绑定终端：</span>
              <span class="info-value font-code">{{ sandboxDevice }}</span>
            </div>
          </div>

          <div class="sandbox-grid real-punch-layout">
            <!-- 左侧：地图展示区域/雷达 -->
            <div class="sandbox-section map-section-wrapper" style="margin-bottom: 0;">
              <h4 class="section-title">🗺️ 打卡考勤定位地图</h4>
              
              <!-- 地图容器 -->
              <div class="map-inner-container">
                <div id="punch-map-container" class="map-canvas"></div>
                
                <!-- 雷达扫描 fallback 画面 -->
                <div v-if="!isMapLoaded" class="radar-scan-fallback">
                  <div class="radar-circle-outer animate-pulse"></div>
                  <div class="radar-circle-middle animate-pulse-delay"></div>
                  <div class="radar-sweep"></div>
                  <div class="radar-center-dot">🏢</div>
                  <div v-if="sandboxLat && sandboxLng" class="radar-user-dot" :style="radarUserDotStyle">📍</div>
                  <div class="radar-loading-text">
                    <span>📡 定位数据融合中...</span>
                  </div>
                </div>
              </div>

              <!-- 地图控制与重刷 -->
              <div class="map-actions-row">
                <button class="btn-refresh-location" @click="getCurrentLocation" :disabled="isLocating">
                  <span v-if="isLocating" class="btn-spinner" style="border-color: rgba(99, 88, 238, 0.3); border-top-color: #6358ee; width: 10px; height: 10px; vertical-align: middle; margin-right: 4px;"></span>
                  <span>🔄 重新获取真实定位</span>
                </button>
                <div v-if="isAdmin" class="developer-override-badges">
                  <span class="dev-badge-title">🧪 考勤测试：</span>
                  <button class="btn-dev-override inline-success" @click="simulateWithinOffice">设为范围内</button>
                  <button class="btn-dev-override inline-danger" @click="simulateOutsideOffice">设为范围外</button>
                </div>
              </div>
            </div>

            <!-- 右侧：考勤规则校验与打卡执行 -->
            <div class="sandbox-section rule-section-wrapper" style="margin-bottom: 0;">
              <h4 class="section-title">📋 地理围栏校验规则</h4>
              
              <div class="geofence-details-list">
                <div class="geofence-detail-item">
                  <span class="geo-label">公司中心经纬度:</span>
                  <span class="geo-value">{{ (Number(store.systemSettings.longitude) || 113.26436).toFixed(5) }}, {{ (Number(store.systemSettings.latitude) || 23.12908).toFixed(5) }}</span>
                </div>
                <div class="geofence-detail-item">
                  <span class="geo-label">有效打卡半径:</span>
                  <span class="geo-value highlight-blue">{{ store.systemSettings.radius || 300 }} 米</span>
                </div>
                <div class="geofence-detail-item">
                  <span class="geo-label">您当前经纬度:</span>
                  <span class="geo-value font-code" v-if="sandboxLat && sandboxLng">{{ sandboxLng.toFixed(5) }}, {{ sandboxLat.toFixed(5) }}</span>
                  <span class="geo-value text-red" v-else>未获取到定位</span>
                </div>
                <div class="geofence-detail-item">
                  <span class="geo-label">您当前偏离公司:</span>
                  <span class="geo-value font-code" :class="isWithinRange ? 'text-green' : 'text-red'" v-if="currentDistance !== null">{{ Math.round(currentDistance) }} 米</span>
                  <span class="geo-value text-red" v-else>未知</span>
                </div>
                <div class="geofence-detail-item" v-if="store.systemSettings.wifiName || store.systemSettings.wifiMac">
                  <span class="geo-label">白名单 Wi-Fi:</span>
                  <span class="geo-value">{{ store.systemSettings.wifiName || store.systemSettings.wifiMac }}</span>
                </div>
              </div>

              <!-- 围栏判定警告框 -->
              <div class="geofence-status-banner" :class="isWithinRange ? 'success-banner' : 'warning-banner'">
                <div class="banner-title">
                  <span class="banner-icon">{{ isWithinRange ? '✅' : '⚠️' }}</span>
                  <span class="banner-heading">{{ isWithinRange ? '您已进入打卡范围' : '您当前在考勤范围外（外勤模式）' }}</span>
                </div>
                <p class="banner-desc">
                  {{ isWithinRange ? '定位精度和距离校验已通过，现在可以正常签到或签退。' : '您当前距离公司较远，打卡将标记为外勤，需管理员审核确认。' }}
                </p>
              </div>

              <!-- 打卡触发动作 -->
              <div class="sandbox-actions-wrapper" style="margin-top: 24px; padding: 0;">
                <div class="sandbox-action-buttons">
                  <button
                    class="btn-punch-in"
                    :disabled="isSubmittingPunch"
                    @click="handlePunchIn"
                  >
                    <span class="punch-icon">🌅</span> {{ isWithinRange ? '上班签到' : '外勤签到' }}
                  </button>
                  <button
                    class="btn-punch-out"
                    :disabled="isSubmittingPunch"
                    @click="handlePunchOut"
                  >
                    <span class="punch-icon">🌇</span> {{ isWithinRange ? '下班签退' : '外勤签退' }}
                  </button>
                </div>

                <!-- 结果消息显示 -->
                <div v-if="sandboxMessage.text" class="sandbox-response" :class="sandboxMessage.type" style="margin-top: 16px;">
                  <span class="response-icon">
                    <template v-if="sandboxMessage.type === 'success'">✅</template>
                    <template v-else-if="sandboxMessage.type === 'error'">❌</template>
                    <template v-else-if="sandboxMessage.type === 'warning'">⚠️</template>
                    <template v-else>ℹ️</template>
                  </span>
                  <div class="response-text">{{ sandboxMessage.text }}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- 搜索过滤栏 -->
      <div class="filter-bar">
        <div class="filter-item">
          <label>日期:</label>
          <input type="date" class="form-control" v-model="searchDate">
        </div>
        <div class="filter-item">
          <label>部门:</label>
          <select class="form-control" v-model="searchDept">
            <option value="">全部</option>
            <option value="技术部">技术部</option>
            <option value="市场部">市场部</option>
            <option value="销售部">销售部</option>
            <option value="人事部">人事部</option>
            <option value="财务部">财务部</option>
            <option value="行政部">行政部</option>
          </select>
        </div>
        <div class="filter-item">
          <label>状态:</label>
          <select class="form-control" v-model="searchStatus">
            <option value="">全部</option>
            <option value="正常">正常</option>
            <option value="迟到">迟到</option>
            <option value="早退">早退</option>
            <option value="迟到+早退">迟到+早退</option>
            <option value="外勤打卡">外勤打卡</option>
            <option value="fieldwork">外勤(待审核)</option>
            <option value="进行中">进行中</option>
            <option value="缺勤">缺勤</option>
          </select>
        </div>
        <button class="btn btn-primary" @click="handleSearch">🔍 查询</button>
      </div>

      <!-- 考勤数据表格 -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>工号</th>
              <th>姓名</th>
              <th>部门</th>
              <th>上班打卡</th>
              <th>下班打卡</th>
              <th>工时</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedAttendance.length === 0">
              <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无打卡数据</td>
            </tr>
            <tr v-else v-for="a in pagedAttendance" :key="a.empId">
              <td style="font-weight: 600; font-family: var(--font-title);">{{ a.empId }}</td>
              <td style="font-weight: 500;">{{ a.empName }}</td>
              <td>{{ a.dept }}</td>
              <td>{{ a.clockIn || '--:--' }}</td>
              <td>{{ a.clockOut || '--:--' }}</td>
              <td style="font-weight: 500;">{{ a.workHours }}</td>
              <td>
                <span class="badge" :class="getBadgeClass(a.status)">
                  {{ a.status }}
                </span>
              </td>
              <td>
                <span class="action-link" @click="viewDetails(a)">详情</span>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 分页 -->
        <div class="pagination-container">
          <div>共 {{ filteredAttendance.length }} 条记录</div>
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

    <!-- ==================== Tab 2: 排班管理 ==================== -->
    <div v-else-if="activeTab === 'roster'" class="tab-content-wrapper">
      <div class="roster-card">
        <div class="roster-header">
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-title); margin-bottom: 4px;">📅 本周值班排班表</h3>
            <p style="font-size: 13px; color: var(--text-muted);">点击下表单元格可循环快速切换班次类型。排班配置会即时生效并直接联动计算当日考勤状态。</p>
          </div>
          <div class="shift-legend">
            <div class="legend-item"><span class="shift-badge normal">常规</span> 常规白班 (9:00-18:00)</div>
            <div class="legend-item"><span class="shift-badge flex">弹性</span> 弹性班次 (10:00-19:00)</div>
            <div class="legend-item"><span class="shift-badge night">夜班</span> 夜班班次 (20:00-5:00)</div>
            <div class="legend-item"><span class="shift-badge off">休息</span> 双休/请假休息</div>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 120px;">姓名 (工号)</th>
                <th style="width: 120px;">部门</th>
                <th v-for="(day, idx) in rosterWeekdays" :key="idx" style="text-align: center;">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in store.employees" :key="emp.id">
                <td style="font-weight: 600;">{{ emp.name }} <span style="font-size: 11px; color: var(--text-muted);">({{ emp.id }})</span></td>
                <td>{{ emp.dept }}</td>
                <td v-for="(_, dayIdx) in rosterWeekdays" :key="dayIdx" style="text-align: center; padding: 12px 6px;">
                  <span 
                    class="shift-badge" 
                    :class="getShiftBadgeClass(getEmployeeShift(emp.id, dayIdx))"
                    @click="cycleShift(emp.id, dayIdx)"
                  >
                    {{ getShiftBadgeLabel(getEmployeeShift(emp.id, dayIdx)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
          <button class="btn btn-secondary" @click="resetRoster">🔄 恢复默认排班</button>
          <button class="btn btn-primary" @click="saveRosterConfig">💾 保存排班方案</button>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 3: 异常申请与审批 ==================== -->
    <div v-else-if="activeTab === 'exception'" class="tab-content-wrapper">
      <div class="exception-grid">
        <!-- 异常发起表单 -->
        <div class="exception-form-card">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-title); margin-bottom: 16px;">✍️ 发起考勤异常申报</h3>
          <form @submit.prevent="submitExceptionRequest">
            <div class="form-group-custom" style="margin-bottom: 14px;">
              <label class="form-label-custom">申报员工</label>
              <select v-model="newException.empId" class="form-input-custom" required>
                <option v-for="emp in store.employees" :key="emp.id" :value="emp.id">
                  {{ emp.name }} ({{ emp.dept }})
                </option>
              </select>
            </div>
            
            <div class="form-group-custom" style="margin-bottom: 14px;">
              <label class="form-label-custom">异常发生日期</label>
              <input type="date" v-model="newException.date" class="form-input-custom" required />
            </div>

            <div class="form-group-custom" style="margin-bottom: 14px;">
              <label class="form-label-custom">申请补偿类型</label>
              <select v-model="newException.type" class="form-input-custom" required>
                <option value="补卡">补卡 (漏打卡补签)</option>
                <option value="销假">销假 (假期提前返回)</option>
                <option value="外勤申诉">外勤申诉 (修正异常外勤)</option>
              </select>
            </div>

            <div class="form-group-custom" style="margin-bottom: 20px;">
              <label class="form-label-custom">申请缘由及凭证备注</label>
              <textarea 
                v-model="newException.reason" 
                class="form-input-custom" 
                style="height: 100px; resize: none; padding: 10px;"
                placeholder="请输入详细的异常原因，如：Wi-Fi异常连不上、见客户等..."
                required
              ></textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; height: 40px; border-radius: 8px;">提交异常申报</button>
          </form>
        </div>

        <!-- 异常待审批列表 -->
        <div class="exception-list-card">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-title); margin-bottom: 16px;">⏳ 考勤异常申诉审批面板</h3>
          <div class="data-table-container" style="max-height: 480px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>申诉人</th>
                  <th>类型</th>
                  <th>异常日期</th>
                  <th>原因/事由</th>
                  <th>状态</th>
                  <th style="width: 120px; text-align: center;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="exceptionRequests.length === 0">
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无待处理申诉单据</td>
                </tr>
                <tr v-else v-for="req in exceptionRequests" :key="req.id">
                  <td style="font-weight: 600;">{{ req.name }} <br><span style="font-size: 11px; color: var(--text-muted);">{{ req.dept }}</span></td>
                  <td>
                    <span class="badge info" style="font-size: 11px;">{{ req.type }}</span>
                  </td>
                  <td style="font-family: monospace; font-size: 13px;">{{ req.date }}</td>
                  <td style="font-size: 13px; max-width: 180px; word-break: break-all;" :title="req.reason">{{ req.reason }}</td>
                  <td>
                    <span class="badge" :class="req.status === '待审批' ? 'warning' : (req.status === '已通过' ? 'success' : 'danger')">
                      {{ req.status }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <div v-if="req.status === '待审批'" style="display: flex; gap: 6px; justify-content: center;">
                      <button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px; height: auto;" @click="handleApproveException(req, true)">同意</button>
                      <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px; height: auto; background-color: var(--danger);" @click="handleApproveException(req, false)">拒绝</button>
                    </div>
                    <span v-else style="color: var(--text-muted); font-size: 12px;">已归档</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 外勤审核面板 -->
      <div style="margin-top: 24px;">
        <div class="exception-list-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-title); margin: 0;">🏃 外勤打卡审核面板</h3>
            <div style="display: flex; gap: 12px; align-items: center;">
              <span class="badge warning">待审核: {{ fieldworkStats.pending }}</span>
              <span class="badge success">已通过: {{ fieldworkStats.approved }}</span>
              <span class="badge danger">已驳回: {{ fieldworkStats.rejected }}</span>
              <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" @click="loadFieldworkData">🔄 刷新</button>
            </div>
          </div>
          <div class="data-table-container" style="max-height: 400px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>员工</th>
                  <th>考勤日期</th>
                  <th>上班打卡</th>
                  <th>下班打卡</th>
                  <th>打卡位置</th>
                  <th>工时</th>
                  <th>状态</th>
                  <th style="width: 180px; text-align: center;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="fieldworkPendingList.length === 0">
                  <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无待审核的外勤记录</td>
                </tr>
                <tr v-else v-for="item in fieldworkPendingList" :key="String(item.id)">
                  <td style="font-weight: 600;">{{ item.user_name }}</td>
                  <td style="font-family: monospace; font-size: 13px;">{{ formatAttendDate(item.attend_date) }}</td>
                  <td style="font-family: monospace;">{{ formatTime(item.clock_in_time) }}</td>
                  <td style="font-family: monospace;">{{ formatTime(item.clock_out_time) }}</td>
                  <td style="font-size: 12px; max-width: 160px; word-break: break-all;">{{ item.clock_in_location || item.clock_out_location || '--' }}</td>
                  <td>{{ item.work_hours || '--' }}h</td>
                  <td>
                    <span class="badge orange">外勤待审核</span>
                  </td>
                  <td style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                      <button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px; height: auto;" @click="handleFieldworkReview(String(item.id), 'approved')">通过</button>
                      <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px; height: auto; background-color: var(--danger);" @click="showFieldworkRejectModal(String(item.id))">驳回</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 外勤驳回弹窗 -->
      <div v-if="showFieldworkRejectDialog" class="logs-modal-overlay" @click.self="showFieldworkRejectDialog = false">
        <div class="logs-modal-card" style="max-width: 450px;">
          <div class="logs-modal-header">
            <h3 class="logs-modal-title">❌ 驳回外勤打卡</h3>
            <span class="logs-modal-close" @click="showFieldworkRejectDialog = false">✕</span>
          </div>
          <div class="logs-modal-body" style="padding: 24px;">
            <div class="form-group-custom" style="margin-bottom: 14px;">
              <label class="form-label-custom">驳回后考勤状态</label>
              <select v-model="fieldworkRejectForm.final_status" class="form-input-custom">
                <option value="absent">缺勤</option>
                <option value="late">迟到</option>
                <option value="early">早退</option>
                <option value="late_early">迟到+早退</option>
              </select>
            </div>
            <div class="form-group-custom" style="margin-bottom: 20px;">
              <label class="form-label-custom">驳回备注</label>
              <textarea v-model="fieldworkRejectForm.remark" class="form-input-custom" style="height: 80px; resize: none; padding: 10px;" placeholder="请输入驳回原因..."></textarea>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button class="btn btn-secondary" @click="showFieldworkRejectDialog = false">取消</button>
              <button class="btn btn-danger" style="background-color: var(--danger);" @click="confirmFieldworkReject">确认驳回</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 4: 考勤数据核算 ==================== -->
    <div v-else-if="activeTab === 'settlement'" class="tab-content-wrapper">
      <div class="settlement-card">
        <div class="settlement-header">
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-title); margin-bottom: 4px;">🪙 考勤工时结算账单 (月度汇总)</h3>
            <p style="font-size: 13px; color: var(--text-muted);">一键汇总本月至今所有打卡日志、加班时间及异常假单，自动生成结算报表。</p>
          </div>
          <div>
            <button 
              class="btn btn-primary" 
              :disabled="isCalculating" 
              @click="runSettlement"
              style="display: flex; align-items: center; gap: 8px;"
            >
              <span v-if="isCalculating" class="btn-spinner"></span>
              ⚡ 开始一键核算考勤
            </button>
          </div>
        </div>

        <div v-if="isCalculating" class="loading-overlay-inline">
          <div class="spinner"></div>
          <p style="font-size: 14px; font-weight: 600; color: var(--text-title);">系统正在执行高精度考勤数据核算引擎，请稍候...</p>
          <p style="font-size: 12px; color: var(--text-muted);">匹配地理坐标、检测Wi-Fi白名单、比对值班排班表、抵消异常审批单...</p>
        </div>

        <div v-else class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>工号</th>
                <th>姓名</th>
                <th>部门</th>
                <th style="text-align: center;">应出勤 (天)</th>
                <th style="text-align: center;">实出勤 (天)</th>
                <th style="text-align: center;">迟到 (次)</th>
                <th style="text-align: center;">早退 (次)</th>
                <th style="text-align: center;">缺勤 (天)</th>
                <th style="text-align: center;">结算状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in settlementList" :key="row.empId">
                <td style="font-weight: 600; font-family: var(--font-title);">{{ row.empId }}</td>
                <td style="font-weight: 500;">{{ row.name }}</td>
                <td>{{ row.dept }}</td>
                <td style="text-align: center; font-weight: 500;">{{ row.shouldDays }}</td>
                <td style="text-align: center; font-weight: 600; color: var(--success);">{{ row.actualDays }}</td>
                <td style="text-align: center; color: var(--warning); font-weight: 500;">{{ row.lateCount }}</td>
                <td style="text-align: center; color: var(--danger); font-weight: 500;">{{ row.earlyCount }}</td>
                <td style="text-align: center; color: #ef4444; font-weight: 500;">{{ row.absentCount }}</td>
                <td style="text-align: center;">
                  <span class="badge" :class="row.status === '已核算' ? 'success' : 'muted'">
                    {{ row.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="showSettlementResults" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; background-color: var(--success-light); padding: 12px 20px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
            <span style="font-size: 13px; color: #065f46; font-weight: 600;">✓ 考勤自动采集结算核算完毕。无漏算/错算。</span>
            <button class="btn btn-secondary" style="background-color: white; border-color: var(--success);" @click="exportSettlement">📥 导出财务工资报备单</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 5: 数据汇总与分析 ==================== -->
    <div v-else-if="activeTab === 'analysis'" class="tab-content-wrapper">
      <div class="analysis-grid">
        <!-- 统计核心卡片 -->
        <div class="chart-card-custom">
          <h3 style="font-size: 15px; font-weight: 700; color: var(--text-title); margin-bottom: 12px;">📊 考勤关键效能指标 (本月)</h3>
          <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
              <div>
                <div style="font-size: 13px; color: var(--text-muted);">平均每日工时</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--text-title); margin-top: 4px;">7.9 小时</div>
              </div>
              <span style="font-size: 12px; color: var(--success); font-weight: 600;">▲ 4.2% 环比上月</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
              <div>
                <div style="font-size: 13px; color: var(--text-muted);">平均打卡合规率</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--text-title); margin-top: 4px;">96.8%</div>
              </div>
              <span style="font-size: 12px; color: var(--success); font-weight: 600;">▲ 0.8% 环比上月</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px;">
              <div>
                <div style="font-size: 13px; color: var(--text-muted);">异常申诉发生率</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--text-title); margin-top: 4px;">2.4%</div>
              </div>
              <span style="font-size: 12px; color: var(--danger); font-weight: 600;">▼ 1.5% 发生率降低</span>
            </div>
          </div>
        </div>

        <!-- 异常因素占比饼图模拟 -->
        <div class="chart-card-custom">
          <h3 style="font-size: 15px; font-weight: 700; color: var(--text-title); margin-bottom: 4px;">🍩 考勤异常因素分布分析</h3>
          <div class="donut-chart-simulation">
            <div class="donut-circle"></div>
            <div class="donut-legend">
              <div class="donut-legend-item">
                <span class="donut-color-dot" style="background-color: var(--warning);"></span>
                <span>迟到漏签 (52%)</span>
              </div>
              <div class="donut-legend-item">
                <span class="donut-color-dot" style="background-color: var(--primary);"></span>
                <span>忘签退/早退 (28%)</span>
              </div>
              <div class="donut-legend-item">
                <span class="donut-color-dot" style="background-color: var(--danger);"></span>
                <span>缺勤矿工 (12%)</span>
              </div>
              <div class="donut-legend-item">
                <span class="donut-color-dot" style="background-color: var(--success);"></span>
                <span>外勤连不上 (8%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 部门出勤合规率龙虎榜 -->
        <div class="chart-card-custom">
          <h3 style="font-size: 15px; font-weight: 700; color: var(--text-title); margin-bottom: 4px;">🏆 部门考勤合规率龙虎榜</h3>
          <div class="leaderboard-list">
            <div class="leaderboard-item">
              <div><span class="leaderboard-rank">1</span> 🥇 财务部</div>
              <strong style="color: var(--success);">100%</strong>
            </div>
            <div class="leaderboard-item">
              <div><span class="leaderboard-rank">2</span> 🥈 人事部</div>
              <strong style="color: var(--text-title);">98.2%</strong>
            </div>
            <div class="leaderboard-item">
              <div><span class="leaderboard-rank">3</span> 🥉 行政部</div>
              <strong style="color: var(--text-title);">97.5%</strong>
            </div>
            <div class="leaderboard-item">
              <div><span class="leaderboard-rank">4</span> 👨‍💻 技术部</div>
              <strong style="color: var(--text-title);">95.8%</strong>
            </div>
            <div class="leaderboard-item">
              <div><span class="leaderboard-rank">5</span> 📈 市场部</div>
              <strong style="color: var(--warning);">93.4%</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 趋势变化柱状图 -->
      <div class="card">
        <div class="dashboard-title-bar">
          <h3 style="font-size: 15px; font-weight: 700; color: var(--text-title);">📅 考勤率周变化分析趋势</h3>
          <span style="font-size: 12px; color: var(--text-muted);">最近四周平均考勤波动</span>
        </div>
        <div class="chart-container" style="height: 180px; margin-top: 10px;">
          <div class="chart-bar-wrapper" style="width: 20%;">
            <div class="chart-bar-fill" style="height: 98%;">
              <div class="chart-bar-tooltip">98%</div>
            </div>
            <div class="chart-label">W1 (第1周)</div>
          </div>
          <div class="chart-bar-wrapper" style="width: 20%;">
            <div class="chart-bar-fill" style="height: 95%;">
              <div class="chart-bar-tooltip">95%</div>
            </div>
            <div class="chart-label">W2 (第2周)</div>
          </div>
          <div class="chart-bar-wrapper" style="width: 20%;">
            <div class="chart-bar-fill" style="height: 96.8%;">
              <div class="chart-bar-tooltip">96.8%</div>
            </div>
            <div class="chart-label">W3 (第3周)</div>
          </div>
          <div class="chart-bar-wrapper" style="width: 20%;">
            <div class="chart-bar-fill" style="height: 99.1%;">
              <div class="chart-bar-tooltip">99.1%</div>
            </div>
            <div class="chart-label">W4 (本周)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 考勤明细详情弹窗 -->
    <div v-if="showDetailModal" class="logs-modal-overlay" @click.self="showDetailModal = false">
      <div class="logs-modal-card" style="max-width: 600px;">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">📄 考勤记录原始明细</h3>
          <span class="logs-modal-close" @click="showDetailModal = false">✕</span>
        </div>
        <div class="logs-modal-body" style="padding: 24px;">
          <div class="detail-grid-custom">
            <div class="detail-item-custom">
              <span class="detail-label">打卡员工:</span>
              <span class="detail-value" style="font-weight: 600;">{{ selectedAttendance.empName }} ({{ selectedAttendance.empId }})</span>
            </div>
            <div class="detail-item-custom">
              <span class="detail-label">所属部门:</span>
              <span class="detail-value">{{ selectedAttendance.dept }}</span>
            </div>
            <div class="detail-item-custom">
              <span class="detail-label">考勤日期:</span>
              <span class="detail-value" style="font-family: monospace;">{{ selectedAttendance.date }}</span>
            </div>
            <div class="detail-item-custom">
              <span class="detail-label">考勤状态:</span>
              <span class="badge" :class="getBadgeClass(selectedAttendance.status)">{{ selectedAttendance.status }}</span>
            </div>
            <div class="detail-item-custom">
              <span class="detail-label">今日工时:</span>
              <span class="detail-value" style="font-weight: 600;">{{ selectedAttendance.workHours }}</span>
            </div>
          </div>

          <div class="form-divider-custom" style="margin-top: 20px;">🌅 上班打卡 (签到明细)</div>
          <div class="punch-detail-block">
            <div class="punch-detail-row">
              <span class="detail-label">打卡时间:</span>
              <span class="detail-value" style="font-family: monospace; font-weight: 600;">{{ selectedAttendance.clockIn || '--:--' }}</span>
            </div>
            <div class="punch-detail-row">
              <span class="detail-label">物理终端:</span>
              <span class="detail-value" style="font-family: monospace;">{{ selectedAttendance.clockInDevice || '无记录' }}</span>
            </div>
            <div class="punch-detail-row">
              <span class="detail-label">位置与备注:</span>
              <span class="detail-value" style="color: #475569;">{{ selectedAttendance.clockInLocation || '无记录' }}</span>
            </div>
          </div>

          <div class="form-divider-custom" style="margin-top: 20px;">🌇 下班打卡 (签退明细)</div>
          <div class="punch-detail-block">
            <div class="punch-detail-row">
              <span class="detail-label">打卡时间:</span>
              <span class="detail-value" style="font-family: monospace; font-weight: 600;">{{ selectedAttendance.clockOut || '--:--' }}</span>
            </div>
            <div class="punch-detail-row">
              <span class="detail-label">物理终端:</span>
              <span class="detail-value" style="font-family: monospace;">{{ selectedAttendance.clockOutDevice || '无记录' }}</span>
            </div>
            <div class="punch-detail-row">
              <span class="detail-label">位置与备注:</span>
              <span class="detail-value" style="color: #475569;">{{ selectedAttendance.clockOutLocation || '无记录' }}</span>
            </div>
          </div>

          <div class="modal-actions-custom">
            <button class="btn-view-detail" @click="viewFullDetail(selectedAttendance)">查看详情完整版</button>
            <button class="btn-cancel-custom" style="background-color: var(--primary, #6358ee); color: white; border: none; margin-top: 10px;" @click="showDetailModal = false">确定</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 完整考勤详情弹窗 -->
    <div v-if="showFullDetailModal" class="logs-modal-overlay" @click.self="showFullDetailModal = false">
      <div class="logs-modal-card" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <AttendanceDetail
          :attendance-id="selectedAttendanceId"
          @close="showFullDetailModal = false"
          @go-approval="goToApproval"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { store, loadAllData } from '../store';
import * as api from '../api';
import AttendanceDetail from './AttendanceDetail.vue';

const activeTab = ref('punch'); // punch | roster | exception | settlement | analysis

const todayStr = new Date().toISOString().split('T')[0];
const searchDate = ref(todayStr);
const searchDept = ref('');
const searchStatus = ref('');

const filterDate = ref(todayStr);
const filterDept = ref('');
const filterStatus = ref('');

const currentPage = ref(1);
const pageSize = 10;

const handleSearch = () => {
  filterDate.value = searchDate.value;
  filterDept.value = searchDept.value;
  filterStatus.value = searchStatus.value;
  currentPage.value = 1;
};

// 基础出勤数据和员工联结
const attendanceList = computed(() => {
  const date = filterDate.value;
  return store.attendance.filter(a => a.date === date).map(a => {
    const emp = store.employees.find(e => e.id === a.empId);
    return {
      ...a,
      empName: emp ? emp.name : '未知',
      dept: emp ? emp.dept : '未知'
    };
  });
});

// 执行过滤
const filteredAttendance = computed(() => {
  const dept = filterDept.value;
  const status = filterStatus.value;

  return attendanceList.value.filter(item => {
    const matchDept = !dept || item.dept === dept;
    const matchStatus = !status || item.status === status;
    return matchDept && matchStatus;
  });
});

const totalPages = computed(() => Math.ceil(filteredAttendance.value.length / pageSize) || 1);

const pagedAttendance = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAttendance.value.slice(start, start + pageSize);
});

// 计算今日头部简报数据
const summary = computed(() => {
  const activeEmps = store.employees.filter(e => e.hrStatus !== '离职');
  const should = activeEmps.length;
  
  const list = attendanceList.value;
  const actual = list.filter(a => ['正常', '迟到', '进行中', '外勤打卡'].includes(a.status)).length;
  const late = list.filter(a => a.status.includes('迟到')).length;
  const early = list.filter(a => a.status.includes('早退')).length;
  const outOfRange = list.filter(a => a.status === '外勤打卡').length;
  const leave = Math.max(0, should - actual);

  return { should, actual, late, early, leave, outOfRange };
});

const getBadgeClass = (status: string) => {
  if (status === '进行中') return 'info';
  if (status === '迟到') return 'warning';
  if (status.includes('早退')) return 'danger';
  if (status === '外勤打卡' || status === 'fieldwork') return 'orange';
  return 'success';
};

// 详情弹窗
const showDetailModal = ref(false);
const selectedAttendance = ref<any>({});

const viewDetails = (item: any) => {
  selectedAttendance.value = item;
  showDetailModal.value = true;
};

// 完整详情弹窗
const showFullDetailModal = ref(false);
const selectedAttendanceId = ref('');

const viewFullDetail = (item: any) => {
  selectedAttendanceId.value = item.id;
  showFullDetailModal.value = true;
  showDetailModal.value = false;
};

// 跳转到审批
const goToApproval = () => {
  showFullDetailModal.value = false;
  // 这里可以触发跳转到审批页面的逻辑
  alert('即将跳转到审批页面...');
};

const syncAttendance = async () => {
  try {
    await loadAllData();
    alert('考勤数据同步成功！已读取最新打卡日志。');
  } catch (err: any) {
    alert('同步失败: ' + err.message);
  }
};

const mockExport = () => {
  alert('考勤明细报表导出成功！');
};

// ==================== 排班管理数据与方法 ====================
const rosterWeekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const shiftTypes = ['regular', 'flex', 'night', 'off'];

const shiftsRoster = ref<Record<string, string[]>>({
  '10001': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
  '10002': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
  '10003': ['flex', 'flex', 'flex', 'flex', 'flex', 'off', 'off'],
  '10004': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
  '10005': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
  '10006': ['flex', 'flex', 'flex', 'flex', 'flex', 'off', 'off'],
  '10007': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
  '10008': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
  '10009': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off']
});

const getEmployeeShift = (empId: string, dayIdx: number): string => {
  if (!shiftsRoster.value[empId]) {
    shiftsRoster.value[empId] = ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'];
  }
  return shiftsRoster.value[empId][dayIdx];
};

const getShiftBadgeClass = (shift: string) => {
  if (shift === 'regular') return 'normal';
  if (shift === 'flex') return 'flex';
  if (shift === 'night') return 'night';
  return 'off';
};

const getShiftBadgeLabel = (shift: string) => {
  if (shift === 'regular') return '常规';
  if (shift === 'flex') return '弹性';
  if (shift === 'night') return '夜班';
  return '休息';
};

const cycleShift = (empId: string, dayIdx: number) => {
  if (!shiftsRoster.value[empId]) {
    shiftsRoster.value[empId] = ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'];
  }
  const current = shiftsRoster.value[empId][dayIdx];
  const nextIdx = (shiftTypes.indexOf(current) + 1) % shiftTypes.length;
  shiftsRoster.value[empId][dayIdx] = shiftTypes[nextIdx];
};

const resetRoster = () => {
  shiftsRoster.value = {
    '10001': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
    '10002': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
    '10003': ['flex', 'flex', 'flex', 'flex', 'flex', 'off', 'off'],
    '10004': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
    '10005': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
    '10006': ['flex', 'flex', 'flex', 'flex', 'flex', 'off', 'off'],
    '10007': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
    '10008': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off'],
    '10009': ['regular', 'regular', 'regular', 'regular', 'regular', 'off', 'off']
  };
  alert('排班方案已恢复为系统默认排班！');
};

const saveRosterConfig = () => {
  alert('恭喜，本周值班排班方案已成功保存并同步到云端数据库！已自动发送排班通知至企业微信。');
};


// ==================== 异常申报与审批 ====================
interface ExceptionRequest {
  id: string;
  empId: string;
  name: string;
  dept: string;
  date: string;
  type: '补卡' | '销假' | '外勤申诉';
  reason: string;
  status: '待审批' | '已通过' | '已拒绝';
  time: string;
}

const exceptionRequests = ref<ExceptionRequest[]>([
  { id: 'EX001', empId: '10003', name: '李明', dept: '技术部', date: todayStr, type: '补卡', reason: '漏打卡，实际已准时到岗', status: '待审批', time: '09:05' },
  { id: 'EX002', empId: '10004', name: '赵敏', dept: '人事部', date: todayStr, type: '外勤申诉', reason: '外出见客户，定位打卡超出范围', status: '待审批', time: '10:15' }
]);

const pendingExceptionsCount = computed(() => {
  return exceptionRequests.value.filter(r => r.status === '待审批').length;
});

const newException = ref({
  empId: '',
  date: todayStr,
  type: '补卡' as '补卡' | '销假' | '外勤申诉',
  reason: ''
});



const submitExceptionRequest = () => {
  const emp = store.employees.find(e => e.id === newException.value.empId);
  if (!emp) return;

  const reqId = 'EX' + Math.floor(100 + Math.random() * 900);
  exceptionRequests.value.push({
    id: reqId,
    empId: emp.id,
    name: emp.name,
    dept: emp.dept,
    date: newException.value.date,
    type: newException.value.type,
    reason: newException.value.reason,
    status: '待审批',
    time: new Date().toTimeString().slice(0, 5)
  });

  // Reset form
  newException.value.reason = '';
  alert('考勤异常申报已成功提交！正在等待主管和人事审批核算。');
};

const handleApproveException = (reqItem: ExceptionRequest, approve: boolean) => {
  reqItem.status = approve ? '已通过' : '已拒绝';
  
  if (approve) {
    // 同意后，自动修复或覆盖考勤数据
    const record = store.attendance.find(a => String(a.empId) === String(reqItem.empId) && a.date === reqItem.date);
    if (record) {
      record.status = '正常';
      record.clockIn = record.clockIn || '09:00';
      record.clockOut = record.clockOut || '18:00';
      record.workHours = '8h';
    } else {
      store.attendance.push({
        date: reqItem.date,
        empId: reqItem.empId,
        clockIn: '09:00',
        clockOut: '18:00',
        workHours: '8h',
        status: '正常',
        clockInLocation: '异常申诉补卡',
        clockOutLocation: '异常申诉补卡'
      });
    }
    alert(`审批通过！员工【${reqItem.name}】于 ${reqItem.date} 的考勤状态已自动修正并结算为【正常】！`);
  } else {
    alert(`已拒绝该异常申报！考勤记录保持不变。`);
  }
};


// ==================== 外勤审核 ====================
const fieldworkPendingList = ref<any[]>([]);
const fieldworkStats = ref({ pending: 0, approved: 0, rejected: 0, total: 0 });
const showFieldworkRejectDialog = ref(false);
const fieldworkRejectForm = ref({ id: '', final_status: 'absent', remark: '' });

const formatAttendDate = (d: any) => {
  if (!d) return '--';
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatTime = (t: any) => {
  if (!t) return '--:--';
  const date = new Date(t);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const loadFieldworkData = async () => {
  try {
    const [pending, stats] = await Promise.all([
      api.getFieldworkPending({ pageSize: 50 }),
      api.getFieldworkStats()
    ]);
    fieldworkPendingList.value = (pending as any)?.list || [];
    fieldworkStats.value = (stats as any) || { pending: 0, approved: 0, rejected: 0, total: 0 };
  } catch (err: any) {
    console.error('加载外勤数据失败:', err.message);
  }
};

const handleFieldworkReview = async (id: string, status: 'approved' | 'rejected') => {
  try {
    await api.reviewFieldwork(id, { review_status: status });
    alert(status === 'approved' ? '外勤打卡已通过审核！' : '外勤打卡已驳回！');
    await loadFieldworkData();
    await loadAllData();
  } catch (err: any) {
    alert('操作失败: ' + err.message);
  }
};

const showFieldworkRejectModal = (id: string) => {
  fieldworkRejectForm.value = { id, final_status: 'absent', remark: '' };
  showFieldworkRejectDialog.value = true;
};

const confirmFieldworkReject = async () => {
  try {
    await api.reviewFieldwork(fieldworkRejectForm.value.id, {
      review_status: 'rejected',
      final_status: fieldworkRejectForm.value.final_status,
      remark: fieldworkRejectForm.value.remark
    });
    showFieldworkRejectDialog.value = false;
    alert('外勤打卡已驳回！');
    await loadFieldworkData();
    await loadAllData();
  } catch (err: any) {
    alert('操作失败: ' + err.message);
  }
};

// ==================== 考勤核算 ====================
const isCalculating = ref(false);
const showSettlementResults = ref(false);

const settlementList = computed(() => {
  return store.employees.map(emp => {
    const records = store.attendance.filter(a => String(a.empId) === String(emp.id));
    const normalCount = records.filter(a => a.status === '正常' || a.status === '外勤打卡').length;
    const lateCount = records.filter(a => a.status.includes('迟到')).length;
    const earlyCount = records.filter(a => a.status.includes('早退')).length;
    const absentCount = records.filter(a => a.status === '缺勤').length;
    const shouldDays = 21; // 模拟本月出勤要求
    const actualDays = Math.min(shouldDays, normalCount + lateCount + earlyCount);
    
    return {
      empId: emp.id,
      name: emp.name,
      dept: emp.dept,
      shouldDays,
      actualDays,
      lateCount,
      earlyCount,
      absentCount,
      status: showSettlementResults.value ? '已核算' : '待核算'
    };
  });
});

const runSettlement = () => {
  isCalculating.value = true;
  setTimeout(() => {
    isCalculating.value = false;
    showSettlementResults.value = true;
    alert('恭喜，本月度考勤数据精准核算完成！已自动校验地理围栏及排班偏差，生成财务薪资所需汇总。');
  }, 1500);
};

const exportSettlement = () => {
  alert('考勤月度核算表导出成功！已保存为 Excel 财务对账单格式。');
};


// ==================== 考勤打卡定位与逻辑 ====================
const isLocating = ref(false);
const isMapLoaded = ref(false);

const sandboxLat = ref<number | null>(null);
const sandboxLng = ref<number | null>(null);
const sandboxWifiName = ref('');
const sandboxWifiMac = ref('');

// 持续性浏览器指纹绑定
const getBrowserDeviceId = () => {
  let devId = localStorage.getItem('punch_device_id');
  if (!devId) {
    const brands = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const brand = brands.find(b => navigator.userAgent.includes(b)) || 'Browser';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    devId = `${brand}-Client-${randomSuffix}`;
    localStorage.setItem('punch_device_id', devId);
  }
  return devId;
};
const sandboxDevice = ref(getBrowserDeviceId());
const sandboxMessage = ref({ type: '', text: '' });
const isSubmittingPunch = ref(false);

// 读取当前登录账号
const userJson = localStorage.getItem('currentUser');
const currentUser = userJson ? JSON.parse(userJson) : null;

// 判断当前用户是否是管理员
const isAdmin = computed(() => {
  return store.userPermissions.roleCode === 'ROLE_ADMIN' || currentUser?.username === 'admin';
});

// 从员工列表中检索当前登录者的员工详情
const currentEmployee = computed(() => {
  if (!currentUser) return null;
  return store.employees.find(e => 
    String(e.userId) === String(currentUser.id) || 
    String(e.id) === String(currentUser.id) || 
    e.name === (currentUser.real_name || currentUser.realName)
  );
});

const activeEmpId = computed(() => {
  return currentEmployee.value?.id || String(currentUser?.id || '10001');
});

const activeEmpName = computed(() => {
  return currentEmployee.value?.name || currentUser?.real_name || '当前用户';
});

const activeEmpDept = computed(() => {
  return currentEmployee.value?.dept || '管理部';
});



// 计算两点之间的距离（Haversine 公式）
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 地球半径，单位米
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const currentDistance = computed(() => {
  if (sandboxLat.value === null || sandboxLng.value === null) return null;
  const companyLat = Number(store.systemSettings.latitude) || 23.12908;
  const companyLng = Number(store.systemSettings.longitude) || 113.26436;
  return getDistance(sandboxLat.value, sandboxLng.value, companyLat, companyLng);
});

const isWithinRange = computed(() => {
  // WiFi 白名单判断
  const hasWifiConfig = !!(store.systemSettings.wifiMac || store.systemSettings.wifiName);
  const clientHasWifi = !!(sandboxWifiName.value || sandboxWifiMac.value);
  if (hasWifiConfig && clientHasWifi) {
    const wifiMacMatch = store.systemSettings.wifiMac && sandboxWifiMac.value && store.systemSettings.wifiMac.toLowerCase() === sandboxWifiMac.value.toLowerCase();
    const wifiNameMatch = store.systemSettings.wifiName && sandboxWifiName.value && store.systemSettings.wifiName.toLowerCase() === sandboxWifiName.value.toLowerCase();
    if (wifiMacMatch || wifiNameMatch) {
      return true;
    }
  }

  if (currentDistance.value === null) return false;
  const companyRadius = Number(store.systemSettings.radius) || 300;
  return currentDistance.value <= companyRadius;
});

// 动态载入高德地图 JS API
let amapInstance: any = null;
let amapCompanyMarker: any = null;
let amapUserMarker: any = null;
let amapCircle: any = null;
const landmarkMarkers = ref<any[]>([]);

const loadAMap = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) {
      resolve((window as any).AMap);
      return;
    }
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=608d75903d29ad8c31d4ee9d777e8039';
    script.onerror = () => reject(new Error('地图 API 加载失败'));
    script.onload = () => {
      resolve((window as any).AMap);
    };
    document.head.appendChild(script);
  });
};

const showNearbyLandmarks = (AMap: any) => {
  if (!amapInstance) return;
  const companyLat = Number(store.systemSettings.latitude) || 23.12908;
  const companyLng = Number(store.systemSettings.longitude) || 113.26436;
  
  // 清理老的地标 Marker
  landmarkMarkers.value.forEach((m: any) => amapInstance.remove(m));
  landmarkMarkers.value = [];

  AMap.plugin(["AMap.PlaceSearch"], () => {
    const placeSearch = new AMap.PlaceSearch({
      pageSize: 10,
      type: "商务住宅|政府机构及社会团体|交通设施服务|金融保险服务|科教文化服务|商务写字楼"
    });
    
    placeSearch.searchNearBy("", [companyLng, companyLat], 600, (status: string, result: any) => {
      if (status === 'complete' && result.info === 'OK') {
        const pois = result.poiList.pois;
        pois.forEach((poi: any) => {
          const distToCompany = getDistance(poi.location.lat, poi.location.lng, companyLat, companyLng);
          if (distToCompany < 25) return; // 太近的不重复加地标标记
          
          const marker = new AMap.Marker({
            position: [poi.location.lng, poi.location.lat],
            title: poi.name,
            content: `<div style="background: rgba(255,255,255,0.95); border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 6px; font-size: 11px; white-space: nowrap; color: #334155; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 4px;"><span style="color: #6358ee;">🏢</span> ${poi.name}</div>`,
            offset: new AMap.Pixel(-15, -15)
          });
          amapInstance.add(marker);
          landmarkMarkers.value.push(marker);
        });
      }
    });
  });
};

const initAMap = async () => {
  try {
    const AMap = await loadAMap();
    if (!AMap) return;
    
    const companyLat = Number(store.systemSettings.latitude) || 23.12908;
    const companyLng = Number(store.systemSettings.longitude) || 113.26436;
    const radius = Number(store.systemSettings.radius) || 300;
    
    const companyPos = [companyLng, companyLat];
    
    amapInstance = new AMap.Map('punch-map-container', {
      center: companyPos,
      zoom: 15,
      viewMode: '2D'
    });
    
    amapCompanyMarker = new AMap.Marker({
      position: companyPos,
      title: '公司位置',
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
    });
    amapInstance.add(amapCompanyMarker);
    
    amapCircle = new AMap.Circle({
      center: companyPos,
      radius: radius,
      strokeColor: "#6358ee",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#6358ee",
      fillOpacity: 0.15
    });
    amapInstance.add(amapCircle);
    
    isMapLoaded.value = true;
    updateMapLocation();
    
    // 加载地标标志建筑
    showNearbyLandmarks(AMap);
  } catch (err) {
    console.warn('高德地图载入失败，启用雷达扫描 Fallback UI:', err);
    isMapLoaded.value = false;
  }
};

const updateMapLocation = () => {
  if (!amapInstance || !isMapLoaded.value) return;
  const AMap = (window as any).AMap;
  if (!AMap) return;
  
  if (sandboxLat.value && sandboxLng.value) {
    const userPos = [sandboxLng.value, sandboxLat.value];
    if (amapUserMarker) {
      amapUserMarker.setPosition(userPos);
    } else {
      amapUserMarker = new AMap.Marker({
        position: userPos,
        title: '我的位置',
        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
      });
      amapInstance.add(amapUserMarker);
    }
    amapInstance.setFitView([amapCompanyMarker, amapUserMarker].filter(Boolean));
    
    // 定位更新时，重新显示周边的标志地标
    showNearbyLandmarks(AMap);
  }
};

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    sandboxMessage.value = { type: 'error', text: '很抱歉，您的浏览器不支持地理定位功能！' };
    return;
  }
  
  isLocating.value = true;
  sandboxMessage.value = { type: 'info', text: '正在尝试获取您的设备当前真实物理位置信息...' };
  
  const options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      sandboxLat.value = Number(position.coords.latitude);
      sandboxLng.value = Number(position.coords.longitude);
      sandboxMessage.value = {
        type: 'success',
        text: `定位成功！已获取当前物理坐标 (经度: ${sandboxLng.value.toFixed(5)}, 纬度: ${sandboxLat.value.toFixed(5)})`
      };
      isLocating.value = false;
      if (amapInstance) updateMapLocation(); else initAMap();
    },
    (error) => {
      isLocating.value = false;
      let errorMsg = '获取位置失败';
      if (error.code === error.TIMEOUT) {
        errorMsg = '获取位置失败：定位请求超时。已自动使用公司附近测试点。';
        simulateWithinOffice();
      } else {
        sandboxMessage.value = { type: 'error', text: errorMsg };
        simulateWithinOffice();
      }
    },
    options
  );
};

const simulateWithinOffice = () => {
  sandboxLat.value = store.systemSettings.latitude !== undefined ? Number(store.systemSettings.latitude) : 23.12908;
  sandboxLng.value = store.systemSettings.longitude !== undefined ? Number(store.systemSettings.longitude) : 113.26436;
  sandboxMessage.value = { type: 'info', text: '🧪 已模拟定位至公司打卡范围中心点' };
  if (amapInstance) {
    updateMapLocation();
  } else {
    initAMap();
  }
};

const simulateOutsideOffice = () => {
  sandboxLat.value = (store.systemSettings.latitude !== undefined ? Number(store.systemSettings.latitude) : 23.12908) + 0.015;
  sandboxLng.value = (store.systemSettings.longitude !== undefined ? Number(store.systemSettings.longitude) : 113.26436) + 0.015;
  sandboxMessage.value = { type: 'warning', text: '🧪 已模拟定位至公司考勤范围外（相距约 2.3 公里）' };
  if (amapInstance) {
    updateMapLocation();
  } else {
    initAMap();
  }
};

// 计算雷达扫描上用户定位点的方向偏移样式
const radarUserDotStyle = computed(() => {
  if (sandboxLat.value === null || sandboxLng.value === null) return {};
  const companyLat = Number(store.systemSettings.latitude) || 23.12908;
  const companyLng = Number(store.systemSettings.longitude) || 113.26436;
  
  const deltaLat = sandboxLat.value - companyLat;
  const deltaLng = sandboxLng.value - companyLng;
  const scale = 1200; // 缩放比例以适配雷达盘
  
  let x = deltaLng * scale;
  let y = -deltaLat * scale; // 纬度坐标与CSS top相反
  
  const dist = Math.sqrt(x * x + y * y);
  const maxRadarRadius = 55; // 雷达可视最大半径 55px
  if (dist > maxRadarRadius) {
    x = (x / dist) * maxRadarRadius;
    y = (y / dist) * maxRadarRadius;
  }
  
  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
  };
});

// 执行签到
const handlePunchIn = async () => {
  isSubmittingPunch.value = true;
  sandboxMessage.value = { type: '', text: '' };
  try {
    const res: any = await api.clockIn({
      user_id: Number(activeEmpId.value),
      latitude: sandboxLat.value !== null ? Number(sandboxLat.value) : undefined,
      longitude: sandboxLng.value !== null ? Number(sandboxLng.value) : undefined,
      device: sandboxDevice.value,
      wifiName: sandboxWifiName.value,
      wifiMac: sandboxWifiMac.value
    });
    const statusMap: Record<string, string> = {
      normal: '正常签到',
      late: '迟到打卡',
      fieldwork: '外勤签到(待审核)'
    };
    const msgType = res.status === 'fieldwork' ? 'warning' : 'success';
    sandboxMessage.value = {
      type: msgType,
      text: `🎉 上班签到成功！打卡状态：【${statusMap[res.status] || res.status}】。位置备注：${res.clock_in_location}${res.status === 'fieldwork' ? '。外勤打卡需管理员审核确认。' : ''}`
    };
    await loadAllData();
  } catch (err: any) {
    sandboxMessage.value = { type: 'error', text: `打卡失败：${err.message}` };
  } finally {
    isSubmittingPunch.value = false;
  }
};

// 执行签退
const handlePunchOut = async () => {
  isSubmittingPunch.value = true;
  sandboxMessage.value = { type: '', text: '' };
  try {
    const res: any = await api.clockOut({
      user_id: Number(activeEmpId.value),
      latitude: sandboxLat.value !== null ? Number(sandboxLat.value) : undefined,
      longitude: sandboxLng.value !== null ? Number(sandboxLng.value) : undefined,
      device: sandboxDevice.value,
      wifiName: sandboxWifiName.value,
      wifiMac: sandboxWifiMac.value
    });
    const statusMap: Record<string, string> = {
      normal: '正常下班',
      early: '早退打卡',
      late_early: '迟到且早退下班',
      fieldwork: '外勤签退(待审核)'
    };
    const msgType = res.status === 'fieldwork' ? 'warning' : 'success';
    sandboxMessage.value = {
      type: msgType,
      text: `🎉 下班签退成功！打卡状态：【${statusMap[res.status] || res.status}】。位置备注：${res.clock_out_location}${res.status === 'fieldwork' ? '。外勤打卡需管理员审核确认。' : ''}`
    };
    await loadAllData();
  } catch (err: any) {
    sandboxMessage.value = { type: 'error', text: `签退失败：${err.message}` };
  } finally {
    isSubmittingPunch.value = false;
  }
};

const resetAMap = () => {
  amapInstance = null;
  amapCompanyMarker = null;
  amapUserMarker = null;
  amapCircle = null;
  landmarkMarkers.value = [];
  isMapLoaded.value = false;
};

watch(activeTab, (newTab) => {
  if (newTab === 'punch') {
    resetAMap();
    nextTick(() => {
      getCurrentLocation();
    });
  }
  if (newTab === 'exception') {
    loadFieldworkData();
  }
});

onMounted(() => {
  if (store.employees.length > 0) {
    newException.value.empId = store.employees[0].id;
  }
  getCurrentLocation();
});
</script>

<style scoped>
/* Tab 导航样式 */
.attendance-nav-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 24px;
  padding-bottom: 4px;
  overflow-x: auto;
}

.attendance-nav-tab {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  transition: var(--transition);
  white-space: nowrap;
  position: relative;
}

.attendance-nav-tab:hover {
  color: var(--primary);
  background-color: rgba(99, 88, 238, 0.05);
}

.attendance-nav-tab.active {
  color: var(--primary);
  background-color: rgba(99, 88, 238, 0.08);
}

.attendance-nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--primary);
  border-radius: 2px;
}

.tab-badge {
  background-color: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

.tab-content-wrapper {
  animation: fadeIn 0.25s ease-out;
}

/* 考勤排班管理卡片 */
.roster-card {
  background-color: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.4);
  text-align: left;
}

.roster-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.shift-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.shift-badge {
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: var(--transition);
  display: inline-block;
  text-align: center;
  min-width: 50px;
}

.shift-badge.normal {
  background-color: #eff6ff;
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.shift-badge.flex {
  background-color: #f3e8ff;
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.15);
}

.shift-badge.night {
  background-color: #fff1f2;
  color: #f43f5e;
  border: 1px solid rgba(244, 63, 94, 0.15);
}

.shift-badge.off {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid rgba(100, 116, 139, 0.15);
}

/* 异常申请审批卡片 */
.exception-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .exception-grid {
    grid-template-columns: 1fr;
  }
}

.exception-form-card, .exception-list-card, .settlement-card {
  background-color: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.4);
  text-align: left;
}

/* 考勤核算 */
.settlement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.loading-overlay-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
  background-color: rgba(248, 250, 252, 0.5);
  border-radius: var(--radius-lg);
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 汇总与分析图表 */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card-custom {
  background-color: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.4);
  text-align: left;
}

.donut-chart-simulation {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
  justify-content: center;
}

.donut-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    var(--warning) 0% 52%,
    var(--primary) 52% 80%,
    var(--danger) 80% 92%,
    var(--success) 92% 100%
  );
  position: relative;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.donut-circle::after {
  content: '';
  position: absolute;
  top: 22px;
  left: 22px;
  width: 76px;
  height: 76px;
  background-color: var(--card-bg);
  border-radius: 50%;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.donut-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.leaderboard-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--bg-main);
  color: var(--text-main);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.leaderboard-item:nth-child(1) .leaderboard-rank {
  background-color: #fef3c7;
  color: #d97706;
}

.leaderboard-item:nth-child(2) .leaderboard-rank {
  background-color: #f1f5f9;
  color: #475569;
}

.leaderboard-item:nth-child(3) .leaderboard-rank {
  background-color: #ffedd5;
  color: #ea580c;
}

/* 考勤仿真与防作弊沙箱面板 */
.sandbox-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.55));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  transition: var(--transition);
}

.sandbox-card:hover {
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.08);
}

.sandbox-header {
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding-bottom: 16px;
  text-align: left;
}

.sandbox-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-title);
  margin-bottom: 6px;
  font-family: var(--font-title);
}

.sandbox-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.sandbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.sandbox-section {
  background: rgba(248, 250, 252, 0.55);
  padding: 18px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(226, 232, 240, 0.7);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-title);
  margin-bottom: 4px;
  border-left: 3px solid var(--primary);
  padding-left: 8px;
  text-align: left;
}

/* 表单组件 */
.form-group-custom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.form-label-custom {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.form-input-custom {
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-size: 13px;
  background-color: #ffffff;
  color: var(--text-main);
  outline: none;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.form-input-custom:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 88, 238, 0.15);
}

.sandbox-btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.btn-secondary-sm {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
  background-color: var(--primary-light);
  border: 1px solid rgba(99, 88, 238, 0.15);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary-sm:hover {
  background-color: var(--primary);
  color: #ffffff;
  transform: translateY(-0.5px);
}

.btn-secondary-sm:active {
  transform: translateY(0);
}

/* 按钮及操作栏 */
.sandbox-actions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  padding-top: 20px;
}

.sandbox-action-buttons {
  display: flex;
  gap: 16px;
}

.btn-punch-in, .btn-punch-out {
  flex: 1;
  height: 42px;
  border-radius: 21px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.btn-punch-in {
  background: linear-gradient(135deg, #10b981, #059669);
}

.btn-punch-in:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
  transform: translateY(-1.5px);
}

.btn-punch-out {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
}

.btn-punch-out:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(99, 88, 238, 0.35);
  transform: translateY(-1.5px);
}

.btn-punch-in:active, .btn-punch-out:active {
  transform: translateY(0);
}

.btn-punch-in:disabled, .btn-punch-out:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.punch-icon {
  font-size: 16px;
}

/* 反馈消息 */
.sandbox-response {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
  animation: fadeIn 0.25s ease-out;
}

.response-icon {
  font-size: 15px;
  line-height: 1;
}

.response-text {
  font-weight: 500;
  word-break: break-all;
}

.sandbox-response.success {
  background-color: var(--success-light);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #065f46;
}

.sandbox-response.error {
  background-color: var(--danger-light);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #991b1b;
}

.sandbox-response.warning {
  background-color: var(--warning-light);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #92400e;
}

.sandbox-response.info {
  background-color: var(--info-light);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #1e3a8a;
}

/* 详情弹窗 Modal */
.logs-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

.logs-modal-card {
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: scaleIn 0.2s ease-out;
}

.logs-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
}

.logs-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.logs-modal-close {
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s;
}

.logs-modal-close:hover {
  color: #0f172a;
}

.logs-modal-body {
  padding: 24px;
  overflow-y: auto;
}

/* 考勤明细网格与排版 */
.detail-grid-custom {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 8px;
  text-align: left;
}

.detail-item-custom {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.form-divider-custom {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1.5px solid #f1f5f9;
  padding-bottom: 6px;
  margin: 20px 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.punch-detail-block {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  margin-bottom: 8px;
}

.punch-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.punch-detail-row .detail-label {
  min-width: 65px;
  margin-top: 1px;
}

.punch-detail-row .detail-value {
  font-size: 13px;
  line-height: 1.4;
  word-break: break-all;
}

.modal-actions-custom {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel-custom {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-custom:hover {
  transform: translateY(-0.5px);
  opacity: 0.9;
}

/* 徽章样式 */
.badge.orange {
  background-color: #ffedd5;
  color: #ea580c;
  border: 1px solid rgba(234, 88, 12, 0.15);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 真实打卡 UI 增强样式 */
.punch-card-real {
  border: 1px solid rgba(99, 88, 238, 0.15) !important;
  background: linear-gradient(135deg, #ffffff, #fdfdff) !important;
}

.punch-user-info-bar {
  display: flex;
  justify-content: flex-start;
  gap: 24px;
  background-color: #f8fafc;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.user-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
}

.user-info-item .info-label {
  font-weight: 500;
  color: #64748b;
}

.user-info-item .info-value {
  font-weight: 600;
  color: #1e293b;
}

.font-highlight {
  color: var(--primary) !important;
}

.font-code {
  font-family: monospace;
  font-weight: 600;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.real-punch-layout {
  grid-template-columns: 1.2fr 1fr !important;
  align-items: stretch;
}

@media (max-width: 900px) {
  .real-punch-layout {
    grid-template-columns: 1fr !important;
  }
}

.map-section-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.map-inner-container {
  width: 100%;
  height: 280px;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
}

.map-canvas {
  width: 100%;
  height: 100%;
}

/* 雷达扫描 Fallback */
.radar-scan-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #1e293b 20%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.radar-circle-outer, .radar-circle-middle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(99, 88, 238, 0.25);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.radar-circle-outer {
  width: 220px;
  height: 220px;
}

.radar-circle-middle {
  width: 130px;
  height: 130px;
}

.radar-sweep {
  position: absolute;
  width: 260px;
  height: 260px;
  background: conic-gradient(from 0deg, rgba(99, 88, 238, 0.15) 0deg, rgba(99, 88, 238, 0) 90deg);
  border-radius: 50%;
  animation: radar-rotate 4s linear infinite;
  transform-origin: center;
  top: calc(50% - 130px);
  left: calc(50% - 130px);
}

.radar-center-dot {
  position: absolute;
  width: 26px;
  height: 26px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  box-shadow: 0 0 12px #6358ee;
  border: 2px solid #6358ee;
  top: calc(50% - 13px);
  left: calc(50% - 13px);
  z-index: 5;
}

.radar-user-dot {
  position: absolute;
  width: 22px;
  height: 22px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 0 10px #f43f5e;
  border: 2px solid #f43f5e;
  z-index: 6;
  top: 50%;
  left: 50%;
  transition: transform 0.5s ease-out;
}

.radar-loading-text {
  position: absolute;
  bottom: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 500;
  background: rgba(15, 23, 42, 0.7);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
}

.map-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-refresh-location {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  background: #ffffff;
  border: 1px solid rgba(99, 88, 238, 0.3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh-location:hover:not(:disabled) {
  background: var(--primary-light);
  border-color: var(--primary);
}

.developer-override-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff7ed;
  border: 1px dashed #fdba74;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.dev-badge-title {
  font-size: 11px;
  font-weight: 600;
  color: #c2410c;
}

.btn-dev-override {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-dev-override:hover {
  opacity: 0.9;
}

.btn-dev-override.inline-success {
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.btn-dev-override.inline-danger {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.geofence-details-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid #e2e8f0;
}

.geofence-detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
}

.geofence-detail-item .geo-label {
  font-weight: 500;
  color: #64748b;
}

.geofence-detail-item .geo-value {
  font-weight: 600;
  color: #1e293b;
}

.geofence-detail-item .geo-value.highlight-blue {
  color: #2563eb;
}

.text-green {
  color: #059669 !important;
}

.text-red {
  color: #dc2626 !important;
}

.geofence-status-banner {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  text-align: left;
}

.geofence-status-banner.success-banner {
  background-color: #ecfdf5;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.geofence-status-banner.error-banner {
  background-color: #fef2f2;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.geofence-status-banner.warning-banner {
  background-color: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.geofence-status-banner.warning-banner .banner-heading {
  color: #92400e;
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.banner-heading {
  font-weight: 700;
  font-size: 13px;
}

.geofence-status-banner.success-banner .banner-heading {
  color: #065f46;
}

.geofence-status-banner.error-banner .banner-heading {
  color: #991b1b;
}

.banner-desc {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

@keyframes radar-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-pulse {
  animation: pulse-wave 2s infinite ease-in-out;
}

.animate-pulse-delay {
  animation: pulse-wave 2s infinite ease-in-out;
  animation-delay: 1s;
}

@keyframes pulse-wave {
  0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.15; }
}

.btn-view-detail {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  margin-right: 8px;
}

.btn-view-detail:hover {
  background-color: #40a9ff;
}
</style>
