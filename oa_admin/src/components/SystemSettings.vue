<template>
  <div id="page-system-settings" class="page-section">
    
    <div class="settings-container">
      
      <!-- 基本设置 -->
      <div class="settings-card">
        <h3 class="settings-card-title">基本设置</h3>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">系统名称</div>
              <div class="settings-value">{{ store.systemSettings.systemName }}</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="mockAction('修改系统名称')">修改</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">Logo</div>
              <div class="settings-value">当前：{{ store.systemSettings.logo }}</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="mockAction('更换Logo')">更换</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">系统版本</div>
              <div class="settings-value" style="color: var(--text-muted);">{{ store.systemSettings.version }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 组织架构 -->
      <div class="settings-card">
        <h3 class="settings-card-title">组织架构</h3>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">部门管理</div>
              <div class="settings-value">管理公司部门架构</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="mockAction('部门管理')">管理</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">职位管理</div>
              <div class="settings-value">管理职位体系</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="mockAction('职位管理')">管理</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">角色权限</div>
              <div class="settings-value">管理员、普通用户等角色配置</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="openPermissionsModal">管理</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 考勤设置 -->
      <div class="settings-card">
        <h3 class="settings-card-title">考勤设置</h3>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">工作时间</div>
              <div class="settings-value">
                {{ store.systemSettings.workTimeStart }} - {{ store.systemSettings.workTimeEnd }} 
                (弹性{{ store.systemSettings.flexTime }}分钟)
              </div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="openWorkTimeModal">修改</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">打卡方式</div>
              <div class="settings-value">
                经纬度: {{ (Number(store.systemSettings.latitude) || 0).toFixed(5) }}, {{ (Number(store.systemSettings.longitude) || 0).toFixed(5) }} 
                (半径{{ store.systemSettings.radius }}米)
                <span v-if="store.systemSettings.wifiName || store.systemSettings.wifiMac"> | 办公 Wi-Fi: {{ store.systemSettings.wifiName || store.systemSettings.wifiMac }}</span>
                <span v-if="store.systemSettings.deviceCheck"> | 🛡️ 启用设备绑定</span>
              </div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="openPunchSettingsModal">修改</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">节假日配置</div>
              <div class="settings-value">配置法定节假日和调休</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="mockAction('配置节假日')">配置</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="settings-card">
        <h3 class="settings-card-title">通知设置</h3>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">审批提醒</div>
              <div class="settings-value">新审批时推送通知</div>
            </div>
            <div class="settings-action">
              <div class="toggle-switch active"></div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">考勤提醒</div>
              <div class="settings-value">每日上下班打卡提醒</div>
            </div>
            <div class="settings-action">
              <div class="toggle-switch active"></div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">会议提醒</div>
              <div class="settings-value">会议开始前15分钟提醒</div>
            </div>
            <div class="settings-action">
              <div class="toggle-switch active"></div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">公告提醒</div>
              <div class="settings-value">新公告发布时推送</div>
            </div>
            <div class="settings-action">
              <div class="toggle-switch active"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统维护 -->
      <div class="settings-card">
        <h3 class="settings-card-title">系统维护</h3>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">数据备份</div>
              <div class="settings-value">上次备份: 2026-05-10 23:00</div>
            </div>
            <div class="settings-action">
              <button class="btn btn-primary" @click="mockAction('立即备份')">立即备份</button>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">系统实时监控</div>
              <div class="settings-value">监控 CPU、物理内存、C盘负载及 Node.js 内存占用</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="openMonitorModal">实时性能</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">在线活跃会话</div>
              <div class="settings-value">管理当前在线会话，支持踢出并拦截请求</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="openOnlineModal">会话管理</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">数据回收站</div>
              <div class="settings-value">查看已软删除的用户、资产、项目和任务数据，支持还原和物理粉碎</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="openRecycleModal">回收站</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">操作日志</div>
              <div class="settings-value">查看系统操作记录</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="openLogsModal">查看</span>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-label">接口文档</div>
              <div class="settings-value">Swagger API文档</div>
            </div>
            <div class="settings-action">
              <span class="action-link" @click="mockAction('查看接口文档')">查看</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 操作日志审计弹窗 (Modal) -->
    <div v-if="showLogsModal" class="logs-modal-overlay" @click.self="showLogsModal = false">
      <div class="logs-modal-card">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">🛡️ 系统操作日志审计看板</h3>
          <span class="logs-modal-close" @click="showLogsModal = false">✕</span>
        </div>
        <div class="logs-modal-body">
          <!-- 检索过滤器 -->
          <div class="logs-search-bar">
            <div class="search-input-group">
              <label>操作人员</label>
              <input type="text" v-model="searchUsername" placeholder="用户名或真实姓名" @keyup.enter="handleSearch">
            </div>
            <div class="search-input-group">
              <label>模块名称</label>
              <input type="text" v-model="searchModule" placeholder="例如 users, projects" @keyup.enter="handleSearch">
            </div>
            <button class="logs-btn btn-search" @click="handleSearch">🔍 检索</button>
            <button class="logs-btn btn-reset" @click="resetSearch">🔄 重置</button>
          </div>

          <!-- 日志表格 -->
          <div class="logs-table-wrapper">
            <table class="logs-table">
              <thead>
                <tr>
                  <th style="width: 60px">ID</th>
                  <th style="width: 140px">操作人</th>
                  <th style="width: 100px">模块</th>
                  <th style="width: 80px">方法</th>
                  <th>路由地址</th>
                  <th>请求入参 (JSON)</th>
                  <th style="width: 120px">IP地址</th>
                  <th style="width: 80px">耗时</th>
                  <th style="width: 80px">状态</th>
                  <th style="width: 160px">时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingLogs">
                  <td colspan="10" class="text-center py-4" style="text-align: center; color: var(--primary-color);">正在加载日志数据...</td>
                </tr>
                <tr v-else-if="logsList.length === 0">
                  <td colspan="10" class="text-center py-4" style="text-align: center; color: var(--text-muted);">暂无操作日志记录</td>
                </tr>
                <tr v-else v-for="log in logsList" :key="log.id">
                  <td>{{ log.id }}</td>
                  <td>
                    <div class="log-user-info">
                      <span class="log-real-name">{{ log.real_name || '系统' }}</span>
                      <span class="log-username">@{{ log.username }}</span>
                    </div>
                  </td>
                  <td><span class="module-tag">{{ log.module }}</span></td>
                  <td><span class="method-tag" :class="log.method?.toLowerCase()">{{ log.method }}</span></td>
                  <td class="td-url" :title="log.request_url">{{ log.request_url }}</td>
                  <td class="td-params" :title="log.request_params">{{ log.request_params }}</td>
                  <td>{{ log.request_ip }}</td>
                  <td>
                    <span :class="log.execute_time > 500 ? 'text-warning' : 'text-success'">
                      {{ log.execute_time }}ms
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" :class="log.status === 1 ? 'success' : 'danger'">
                      {{ log.status === 1 ? '成功' : '失败' }}
                    </span>
                  </td>
                  <td class="td-time">{{ formatDate(log.create_time) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页器 -->
          <div class="logs-pagination">
            <span class="pagination-info">共 <strong>{{ logsTotal }}</strong> 条日志记录，当前第 {{ logsPage }} 页</span>
            <div class="pagination-buttons">
              <button 
                class="logs-btn btn-outline" 
                :disabled="logsPage === 1 || loadingLogs"
                @click="handlePageChange(logsPage - 1)"
              >
                上一页
              </button>
              <button 
                class="logs-btn btn-outline" 
                :disabled="logsPage * logsLimit >= logsTotal || loadingLogs"
                @click="handlePageChange(logsPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- 服务器性能监控弹窗 -->
    <div v-if="showMonitorModal" class="logs-modal-overlay" @click.self="closeMonitorModal">
      <div class="logs-modal-card" style="max-width: 700px;">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">🖥️ 服务器实时负载监控</h3>
          <span class="logs-modal-close" @click="closeMonitorModal">✕</span>
        </div>
        <div class="logs-modal-body" style="padding: 24px;">
          <div v-if="loadingMonitor && !monitorData" class="text-center py-4" style="color: var(--primary-color);">
            正在采集服务器硬件数据...
          </div>
          <div v-else-if="monitorData" class="monitor-dashboard" style="width: 100%">
            <!-- CPU & Memory Gauges -->
            <div class="monitor-grid">
              <div class="monitor-card-item">
                <div class="monitor-card-header">
                  <span class="monitor-card-icon">⚡</span>
                  <div class="monitor-card-title-group">
                    <span class="monitor-card-name">CPU 使用率</span>
                    <span class="monitor-card-desc">{{ monitorData.cpu.model }} ({{ monitorData.cpu.cores }} 核)</span>
                  </div>
                </div>
                <div class="monitor-progress-wrapper">
                  <div class="monitor-progress-bar">
                    <div class="progress-fill cpu-fill" :style="{ width: monitorData.cpu.usage + '%' }"></div>
                  </div>
                  <span class="monitor-percentage">{{ monitorData.cpu.usage }}%</span>
                </div>
              </div>

              <div class="monitor-card-item">
                <div class="monitor-card-header">
                  <span class="monitor-card-icon">💾</span>
                  <div class="monitor-card-title-group">
                    <span class="monitor-card-name">物理内存使用率</span>
                    <span class="monitor-card-desc">已用: {{ formatBytes(monitorData.memory.used) }} / 总计: {{ formatBytes(monitorData.memory.total) }}</span>
                  </div>
                </div>
                <div class="monitor-progress-wrapper">
                  <div class="monitor-progress-bar">
                    <div class="progress-fill mem-fill" :style="{ width: monitorData.memory.usage + '%' }"></div>
                  </div>
                  <span class="monitor-percentage">{{ monitorData.memory.usage }}%</span>
                </div>
              </div>

              <div class="monitor-card-item" style="grid-column: span 2;">
                <div class="monitor-card-header">
                  <span class="monitor-card-icon">💿</span>
                  <div class="monitor-card-title-group">
                    <span class="monitor-card-name">系统磁盘空间 (C盘)</span>
                    <span class="monitor-card-desc">已用: {{ formatBytes(monitorData.disk.used) }} / 可用: {{ formatBytes(monitorData.disk.free) }} / 总容量: {{ formatBytes(monitorData.disk.total) }}</span>
                  </div>
                </div>
                <div class="monitor-progress-wrapper">
                  <div class="monitor-progress-bar">
                    <div class="progress-fill disk-fill" :style="{ width: monitorData.disk.usage + '%' }"></div>
                  </div>
                  <span class="monitor-percentage">{{ monitorData.disk.usage }}%</span>
                </div>
              </div>
            </div>

            <!-- More Details -->
            <div class="form-divider-custom" style="margin-top: 16px;">📦 NODE.JS 运行环境指标</div>
            <div class="monitor-details-grid">
              <div class="detail-cell-custom"><strong>运行内存 (RSS):</strong> <span>{{ formatBytes(monitorData.node.rss) }}</span></div>
              <div class="detail-cell-custom"><strong>V8 堆内存总计:</strong> <span>{{ formatBytes(monitorData.node.heapTotal) }}</span></div>
              <div class="detail-cell-custom"><strong>V8 堆内存已用:</strong> <span>{{ formatBytes(monitorData.node.heapUsed) }}</span></div>
              <div class="detail-cell-custom"><strong>运行系统平台:</strong> <span>{{ monitorData.platform.toUpperCase() }}</span></div>
              <div class="detail-cell-custom" style="grid-column: span 2;"><strong>服务器开机时间:</strong> <span>{{ formatUptime(monitorData.uptime) }}</span></div>
            </div>
          </div>
          <div class="modal-actions-custom" style="margin-top: 16px;">
            <span style="font-size: 12px; color: var(--text-muted); align-self: center; margin-right: auto;">💡 监控数据每 5 秒自动采样刷新一次</span>
            <button class="btn-cancel-custom" @click="closeMonitorModal">关闭监控</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 在线用户会话管理弹窗 -->
    <div v-if="showOnlineModal" class="logs-modal-overlay" @click.self="showOnlineModal = false">
      <div class="logs-modal-card" style="max-width: 900px;">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">👥 当前在线用户会话</h3>
          <span class="logs-modal-close" @click="showOnlineModal = false">✕</span>
        </div>
        <div class="logs-modal-body" style="padding: 24px;">
          <div class="logs-table-wrapper" style="max-height: 50vh;">
            <table class="logs-table">
              <thead>
                <tr>
                  <th style="width: 80px">用户ID</th>
                  <th style="width: 120px">登录账号</th>
                  <th style="width: 120px">真实姓名</th>
                  <th style="width: 120px">客户端IP</th>
                  <th style="width: 160px">首次登录时间</th>
                  <th style="width: 160px">最后活跃时间</th>
                  <th style="width: 100px; text-align: center;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingOnline">
                  <td colspan="7" class="text-center py-4" style="text-align: center; color: var(--primary-color);">正在载入在线会话列表...</td>
                </tr>
                <tr v-else-if="onlineList.length === 0">
                  <td colspan="7" class="text-center py-4" style="text-align: center; color: var(--text-muted);">暂无在线活动会话</td>
                </tr>
                <tr v-else v-for="user in onlineList" :key="user.userId">
                  <td class="font-mono">{{ user.userId }}</td>
                  <td style="font-weight: 600;">@{{ user.username }}</td>
                  <td>{{ user.realName }}</td>
                  <td class="font-mono">{{ user.ip || '127.0.0.1' }}</td>
                  <td class="td-time">{{ formatDate(user.loginTime) }}</td>
                  <td class="td-time">{{ formatDate(user.lastActiveTime) }}</td>
                  <td style="text-align: center;">
                    <button 
                      class="btn-danger-custom"
                      :disabled="isCurrentUser(user.userId)"
                      @click="handleKickUser(user.userId, user.realName)"
                    >
                      {{ isCurrentUser(user.userId) ? '当前登录' : '强制退登' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-actions-custom" style="margin-top: 16px;">
            <span style="font-size: 12px; color: var(--text-muted); align-self: center; margin-right: auto;">🛡️ 被强退的用户在发起下一次请求时会被拦截并退出至登录页</span>
            <button class="btn-cancel-custom" @click="showOnlineModal = false">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 统一回收站数据管理弹窗 -->
    <div v-if="showRecycleModal" class="logs-modal-overlay" @click.self="showRecycleModal = false">
      <div class="logs-modal-card" style="max-width: 900px;">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">🗑️ 系统软删除统一回收站</h3>
          <span class="logs-modal-close" @click="showRecycleModal = false">✕</span>
        </div>
        <div class="logs-modal-body" style="padding: 24px;">
          <!-- 清空回收站按钮 -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <button 
              class="btn-danger-custom" 
              style="padding: 8px 16px; font-weight: 600;" 
              :disabled="recycleList.length === 0"
              @click="handleCleanRecycleBin"
            >
              ⚠️ 物理清空回收站
            </button>
          </div>
          
          <div class="logs-table-wrapper" style="max-height: 50vh;">
            <table class="logs-table">
              <thead>
                <tr>
                  <th style="width: 80px">主键ID</th>
                  <th style="width: 120px">实体模块</th>
                  <th>标识数据信息 (Name)</th>
                  <th style="width: 180px">软删除日期</th>
                  <th style="width: 150px; text-align: center;">决策操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingRecycle">
                  <td colspan="5" class="text-center py-4" style="text-align: center; color: var(--primary-color);">正在盘点回收站资产...</td>
                </tr>
                <tr v-else-if="recycleList.length === 0">
                  <td colspan="5" class="text-center py-4" style="text-align: center; color: var(--text-muted);">回收站空空如也，暂无软删除资产</td>
                </tr>
                <tr v-else v-for="item in recycleList" :key="`${item.type}-${item.id}`">
                  <td class="font-mono">{{ item.id }}</td>
                  <td>
                    <span class="module-tag" :class="item.type">{{ item.typeLabel }}</span>
                  </td>
                  <td style="font-weight: 500;">{{ item.name }}</td>
                  <td class="td-time">{{ formatDate(item.deleteTime) }}</td>
                  <td style="text-align: center; display: flex; justify-content: center; gap: 8px;">
                    <span class="action-link success" @click="handleRecoverRecycleItem(item.id, item.type)">还原</span>
                    <span class="action-link danger" @click="handleDeleteRecycleItem(item.id, item.type)">物理粉碎</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-actions-custom" style="margin-top: 16px;">
            <span style="font-size: 12px; color: var(--text-muted); align-self: center; margin-right: auto;">⚠️ 物理粉碎和清空为不可逆删除，请确保不再需要这些历史数据</span>
            <button class="btn-cancel-custom" @click="showRecycleModal = false">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 工作时间设置 Modal -->
    <div v-if="showWorkTimeModal" class="logs-modal-overlay" @click.self="showWorkTimeModal = false">
      <div class="logs-modal-card" style="max-width: 500px;">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">⏰ 修改工作时间设置</h3>
          <span class="logs-modal-close" @click="showWorkTimeModal = false">✕</span>
        </div>
        <div class="logs-modal-body" style="padding: 24px;">
          <div class="form-group-custom">
            <label class="form-label-custom">上班时间 (Start Time)</label>
            <input type="time" v-model="workTimeForm.workTimeStart" class="form-input-custom" />
          </div>
          <div class="form-group-custom">
            <label class="form-label-custom">下班时间 (End Time)</label>
            <input type="time" v-model="workTimeForm.workTimeEnd" class="form-input-custom" />
          </div>
          <div class="form-group-custom">
            <label class="form-label-custom">弹性时间范围 (分钟)</label>
            <input type="number" v-model="workTimeForm.flexTime" min="0" max="60" class="form-input-custom" placeholder="允许迟到的弹性缓冲时长" />
            <span class="form-tip-custom">在此时间段内打卡算正常上班，超过则算作迟到</span>
          </div>
          <div class="modal-actions-custom">
            <button class="btn-cancel-custom" @click="showWorkTimeModal = false">取消</button>
            <button class="btn-submit-custom" :disabled="savingWorkTime" @click="saveWorkTime">
              {{ savingWorkTime ? '正在保存...' : '保存更改' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 打卡定位与防作弊 Modal -->
    <div v-if="showPunchSettingsModal" class="logs-modal-overlay" @click.self="showPunchSettingsModal = false">
      <div class="logs-modal-card" style="max-width: 550px;">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">📍 考勤定位与智能防作弊配置</h3>
          <span class="logs-modal-close" @click="showPunchSettingsModal = false">✕</span>
        </div>
        <div class="logs-modal-body" style="padding: 24px;">
          <div class="form-row-custom">
            <div class="form-group-custom" style="flex: 1;">
              <label class="form-label-custom">公司中心点纬度</label>
              <input type="number" step="0.00001" v-model="punchForm.latitude" class="form-input-custom" placeholder="例如 38.82056" />
            </div>
            <div class="form-group-custom" style="flex: 1;">
              <label class="form-label-custom">公司中心点经度</label>
              <input type="number" step="0.00001" v-model="punchForm.longitude" class="form-input-custom" placeholder="例如 115.49877" />
            </div>
          </div>
          <div style="margin-top: -8px; margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-preset-custom" @click="setGZHQ">📍 设为广州总部</button>
            <button class="btn-preset-custom" @click="setLibraryLocation" style="background-color: var(--primary); color: white; border-color: var(--primary);">🎯 设为河北科技学院图书馆</button>
          </div>
          <div class="form-group-custom">
            <label class="form-label-custom">有效打卡半径 (米)</label>
            <input type="number" v-model="punchForm.radius" class="form-input-custom" placeholder="默认 300" />
            <span class="form-tip-custom">在此物理半径范围外打卡，将被记为“外勤打卡”</span>
          </div>
          <div class="form-divider-custom">🏢 办公 Wi-Fi 白名单 (直连免签)</div>
          <div class="form-row-custom">
            <div class="form-group-custom" style="flex: 1;">
              <label class="form-label-custom">Wi-Fi 名称 (SSID)</label>
              <input type="text" v-model="punchForm.wifiName" class="form-input-custom" placeholder="如 Office_Wifi" />
            </div>
            <div class="form-group-custom" style="flex: 1;">
              <label class="form-label-custom">Wi-Fi MAC 地址</label>
              <input type="text" v-model="punchForm.wifiMac" class="form-input-custom" placeholder="如 00:11:22:33:44:55" />
            </div>
          </div>
          <span class="form-tip-custom" style="margin-top: -8px; margin-bottom: 12px; display: block;">用户连接白名单 Wi-Fi 后，不受物理 GPS 距离限制，一律视为在场打卡</span>
          
          <div class="form-divider-custom">📱 手机设备指纹绑定 (防代打卡)</div>
          <div class="settings-item" style="border-bottom: none; padding: 8px 0;">
            <div class="settings-info">
              <div class="settings-label" style="font-size: 14px;">启用手机唯一设备绑定校验</div>
              <div class="settings-value" style="font-size: 12px;">开启后，用户打卡自动绑定首台设备，禁止多台手机换号打卡</div>
            </div>
            <div class="settings-action">
              <div class="toggle-switch" :class="{ active: punchForm.deviceCheck }" @click="punchForm.deviceCheck = !punchForm.deviceCheck"></div>
            </div>
          </div>
          <div class="modal-actions-custom" style="margin-top: 16px;">
            <button class="btn-cancel-custom" @click="showPunchSettingsModal = false">取消</button>
            <button class="btn-submit-custom" :disabled="savingPunchSettings" @click="savePunchSettings">
              {{ savingPunchSettings ? '正在保存...' : '保存更改' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色权限配置 Modal -->
    <div v-if="showPermissionsModal" class="logs-modal-overlay" @click.self="showPermissionsModal = false">
      <div class="logs-modal-card" style="max-width: 850px;">
        <div class="logs-modal-header">
          <h3 class="logs-modal-title">🔐 角色权限配置中心</h3>
          <span class="logs-modal-close" @click="showPermissionsModal = false">✕</span>
        </div>
        <div class="logs-modal-body" style="padding: 0; display: flex; flex-direction: row; height: 60vh; min-height: 400px; overflow: hidden;">
          
          <!-- 左侧角色列表 -->
          <div class="perms-roles-panel">
            <div class="perms-panel-title">👥 选择角色</div>
            <div class="perms-roles-list">
              <div 
                v-for="role in rolesList" 
                :key="role.id" 
                class="perms-role-item"
                :class="{ active: selectedRoleId === role.id }"
                @click="selectRole(role.id)"
              >
                <div class="role-item-name">{{ role.role_name }}</div>
                <div class="role-item-code">{{ role.role_code }}</div>
              </div>
            </div>
          </div>
          
          <div class="perms-tree-panel">
            <div class="perms-panel-title">
              🛡️ 权限分配 (勾选授权)
            </div>
            
            <!-- 管理员提示信息 -->
            <div v-if="selectedRoleId === 1" class="admin-perms-warning">
              💡 提示：<strong>系统管理员</strong>角色默认拥有系统内的所有操作及菜单权限，无需且禁止进行修改。
            </div>
            
            <div v-if="loadingPermissions" class="perms-tree-loading">
              正在读取权限定义...
            </div>
            <div v-else class="perms-tree-scroll">
              <div v-for="parent in permissionTree" :key="parent.id" class="perms-tree-section">
                <!-- 一级权限菜单 -->
                <div class="perms-parent-row" :style="{ borderBottom: parent.children && parent.children.length > 0 ? '1px solid #edf2f7' : 'none' }">
                  <label class="perms-checkbox-label parent-label">
                    <input 
                      type="checkbox" 
                      :checked="isNodeChecked(parent.id)" 
                      :disabled="selectedRoleId === 1"
                      @change="toggleParentNode(parent)"
                    />
                    <span class="perms-node-icon">{{ getMenuIcon(parent.permission_code) }}</span>
                    <span class="perms-node-name">{{ parent.permission_name }}</span>
                  </label>
                </div>
                
                <!-- 二级权限菜单 (子项) -->
                <div v-if="parent.children && parent.children.length > 0" class="perms-children-grid">
                  <div v-for="child in parent.children" :key="child.id" class="perms-child-item">
                    <label class="perms-checkbox-label child-label">
                      <input 
                        type="checkbox" 
                        :checked="isNodeChecked(child.id)" 
                        :disabled="selectedRoleId === 1"
                        @change="toggleChildNode(child, parent)"
                      />
                      <span class="perms-node-name">{{ child.permission_name }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        <!-- 底部按钮 -->
        <div class="modal-actions-custom" style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; margin-top: 0;">
          <button class="btn-cancel-custom" @click="showPermissionsModal = false">关闭</button>
          <button 
            v-if="selectedRoleId !== 1" 
            class="btn-submit-custom" 
            :disabled="savingPermissions" 
            @click="saveRolePermissions"
          >
            {{ savingPermissions ? '正在保存...' : '保存更改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { store, updateSystemSettings, Alert } from '../store';
import { 
  getOperationLogs,
  getServerMonitor,
  getOnlineUsers,
  kickOnlineUser,
  getRecycleBin,
  recoverRecycleItem,
  deleteRecycleItem,
  cleanRecycleBin,
  getActiveRoles,
  getPermissionTree,
  getRolePermissions,
  updateRolePermissions
} from '../api';

const mockAction = (actionName: string) => {
  alert(`【${actionName}】功能正在开发中！`);
};

// 角色权限管理相关状态
const showPermissionsModal = ref(false);
const rolesList = ref<any[]>([]);
const selectedRoleId = ref<number | null>(null);
const permissionTree = ref<any[]>([]);
const checkedPermissionIds = ref<number[]>([]);
const savingPermissions = ref(false);
const loadingPermissions = ref(false);

const openPermissionsModal = async () => {
  showPermissionsModal.value = true;
  loadingPermissions.value = true;
  try {
    const [roles, tree] = await Promise.all([
      getActiveRoles(),
      getPermissionTree()
    ]);
    rolesList.value = roles || [];
    permissionTree.value = tree || [];
    console.log('Frontend fetched permission tree:', JSON.stringify(permissionTree.value, null, 2));
    
    if (rolesList.value.length > 0) {
      await selectRole(rolesList.value[0].id);
    }
  } catch (error: any) {
    alert('加载权限数据失败: ' + error.message);
  } finally {
    loadingPermissions.value = false;
  }
};

const selectRole = async (roleId: number) => {
  selectedRoleId.value = roleId;
  try {
    const perms = await getRolePermissions(roleId);
    checkedPermissionIds.value = perms ? perms.map((p: any) => Number(p)) : [];
  } catch (error: any) {
    alert('获取角色权限失败: ' + error.message);
  }
};

const isNodeChecked = (id: number) => {
  return checkedPermissionIds.value.includes(id);
};

const toggleParentNode = (parent: any) => {
  if (selectedRoleId.value === 1) return;
  
  const index = checkedPermissionIds.value.indexOf(parent.id);
  const childIds = parent.children ? parent.children.map((c: any) => c.id) : [];
  
  if (index > -1) {
    checkedPermissionIds.value = checkedPermissionIds.value.filter(
      id => id !== parent.id && !childIds.includes(id)
    );
  } else {
    checkedPermissionIds.value.push(parent.id);
    childIds.forEach((cid: number) => {
      if (!checkedPermissionIds.value.includes(cid)) {
        checkedPermissionIds.value.push(cid);
      }
    });
  }
};

const toggleChildNode = (child: any, parent: any) => {
  if (selectedRoleId.value === 1) return;
  
  const index = checkedPermissionIds.value.indexOf(child.id);
  if (index > -1) {
    checkedPermissionIds.value.splice(index, 1);
  } else {
    checkedPermissionIds.value.push(child.id);
    if (!checkedPermissionIds.value.includes(parent.id)) {
      checkedPermissionIds.value.push(parent.id);
    }
  }
};

const saveRolePermissions = async () => {
  if (selectedRoleId.value === null) return;
  if (selectedRoleId.value === 1) {
    alert('系统管理员权限默认拥有全部，无需且禁止修改！');
    showPermissionsModal.value = false;
    return;
  }
  
  savingPermissions.value = true;
  try {
    await updateRolePermissions(selectedRoleId.value, checkedPermissionIds.value);
    alert('分配角色权限成功！');
    showPermissionsModal.value = false;
  } catch (error: any) {
    alert('保存权限失败: ' + error.message);
  } finally {
    savingPermissions.value = false;
  }
};

const getMenuIcon = (code: string) => {
  const icons: Record<string, string> = {
    'dashboard': '📊',
    'org': '👥',
    'office': '⏱️',
    'business': '💼',
    'collaboration': '↩',
    'system': '⚙️'
  };
  return icons[code] || '📁';
};

// 工作时间弹窗状态
const showWorkTimeModal = ref(false);
const workTimeForm = ref({
  workTimeStart: '',
  workTimeEnd: '',
  flexTime: 15
});
const savingWorkTime = ref(false);

const openWorkTimeModal = () => {
  workTimeForm.value = {
    workTimeStart: store.systemSettings.workTimeStart,
    workTimeEnd: store.systemSettings.workTimeEnd,
    flexTime: store.systemSettings.flexTime
  };
  showWorkTimeModal.value = true;
};

const saveWorkTime = async () => {
  savingWorkTime.value = true;
  try {
    await updateSystemSettings({
      ...store.systemSettings,
      workTimeStart: workTimeForm.value.workTimeStart,
      workTimeEnd: workTimeForm.value.workTimeEnd,
      flexTime: Number(workTimeForm.value.flexTime)
    });
    showWorkTimeModal.value = false;
  } catch (err: any) {
    alert('保存工作时间设置失败: ' + err.message);
  } finally {
    savingWorkTime.value = false;
  }
};

// 打卡方式及防作弊配置弹窗状态
const showPunchSettingsModal = ref(false);
const punchForm = ref({
  latitude: 38.820564,
  longitude: 115.498772,
  radius: 300,
  wifiName: '',
  wifiMac: '',
  deviceCheck: false
});
const savingPunchSettings = ref(false);

const openPunchSettingsModal = () => {
  punchForm.value = {
    latitude: store.systemSettings.latitude !== undefined ? Number(store.systemSettings.latitude) : 38.820564,
    longitude: store.systemSettings.longitude !== undefined ? Number(store.systemSettings.longitude) : 115.498772,
    radius: store.systemSettings.radius !== undefined ? Number(store.systemSettings.radius) : 300,
    wifiName: store.systemSettings.wifiName || '',
    wifiMac: store.systemSettings.wifiMac || '',
    deviceCheck: store.systemSettings.deviceCheck || false
  };
  showPunchSettingsModal.value = true;
};

const savePunchSettings = async () => {
  savingPunchSettings.value = true;
  try {
    await updateSystemSettings({
      ...store.systemSettings,
      latitude: Number(punchForm.value.latitude),
      longitude: Number(punchForm.value.longitude),
      radius: Number(punchForm.value.radius),
      wifiName: punchForm.value.wifiName,
      wifiMac: punchForm.value.wifiMac,
      deviceCheck: punchForm.value.deviceCheck
    });
    showPunchSettingsModal.value = false;
  } catch (err: any) {
    alert('保存打卡设置失败: ' + err.message);
  } finally {
    savingPunchSettings.value = false;
  }
};

const setGZHQ = () => {
  punchForm.value.latitude = 23.12908;
  punchForm.value.longitude = 113.26436;
};

const setLibraryLocation = () => {
  if ((window as any).AMap) {
    const AMap = (window as any).AMap;
    AMap.plugin(["AMap.PlaceSearch"], () => {
      const placeSearch = new AMap.PlaceSearch({
        city: "\u4fdd\u5b9a",
        pageSize: 1
      });
      placeSearch.search("\u6cb3\u5317\u79d1\u6280\u5b66\u9662\u56fe\u4e66\u9986", (status: string, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          const poi = result.poiList.pois[0];
          punchForm.value.longitude = Number(poi.location.lng);
          punchForm.value.latitude = Number(poi.location.lat);
          alert(`自动定位成功！已设为：${poi.name} (经度: ${poi.location.lng}, 纬度: ${poi.location.lat})`);
        } else {
          punchForm.value.latitude = 38.820564;
          punchForm.value.longitude = 115.498772;
          alert('高德定位失败，已设为河北科技学院图书馆保定默认备用坐标(115.498772, 38.820564)');
        }
      });
    });
  } else {
    punchForm.value.latitude = 38.820564;
    punchForm.value.longitude = 115.498772;
    alert('地图组件未就绪，已设为河北科技学院图书馆保定默认坐标(115.498772, 38.820564)');
  }
};

// 操作日志审计相关响应式状态
const showLogsModal = ref(false);
const logsList = ref<any[]>([]);
const logsTotal = ref(0);
const logsPage = ref(1);
const logsLimit = ref(10);
const loadingLogs = ref(false);
const searchUsername = ref('');
const searchModule = ref('');

const fetchLogs = async () => {
  loadingLogs.value = true;
  try {
    const res: any = await getOperationLogs({
      page: logsPage.value,
      limit: logsLimit.value,
      username: searchUsername.value,
      module: searchModule.value
    });
    // 强制转换为 array，以防后台出错
    logsList.value = res.list || [];
    logsTotal.value = res.total || 0;
  } catch (error: any) {
    console.error('获取操作日志失败:', error);
    alert('获取操作日志失败: ' + error.message);
  } finally {
    loadingLogs.value = false;
  }
};

const openLogsModal = () => {
  showLogsModal.value = true;
  logsPage.value = 1;
  fetchLogs();
};

const handlePageChange = (page: number) => {
  logsPage.value = page;
  fetchLogs();
};

const handleSearch = () => {
  logsPage.value = 1;
  fetchLogs();
};

const resetSearch = () => {
  searchUsername.value = '';
  searchModule.value = '';
  logsPage.value = 1;
  fetchLogs();
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', { hour12: false });
};

// --- 系统监控 ---
const showMonitorModal = ref(false);
const monitorData = ref<any>(null);
const loadingMonitor = ref(false);
let monitorInterval: any = null;

const fetchMonitorData = async () => {
  loadingMonitor.value = true;
  try {
    const res = await getServerMonitor();
    monitorData.value = res;
  } catch (error: any) {
    console.error('获取系统监控失败:', error);
  } finally {
    loadingMonitor.value = false;
  }
};

const openMonitorModal = () => {
  showMonitorModal.value = true;
  fetchMonitorData();
  monitorInterval = setInterval(fetchMonitorData, 5000);
};

const closeMonitorModal = () => {
  showMonitorModal.value = false;
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
};

// --- 在线会话 ---
const showOnlineModal = ref(false);
const onlineList = ref<any[]>([]);
const loadingOnline = ref(false);

const fetchOnlineUsers = async () => {
  loadingOnline.value = true;
  try {
    const res: any = await getOnlineUsers();
    onlineList.value = res || [];
  } catch (error: any) {
    console.error('获取在线用户失败:', error);
    alert('获取在线用户失败: ' + error.message);
  } finally {
    loadingOnline.value = false;
  }
};

const openOnlineModal = () => {
  showOnlineModal.value = true;
  fetchOnlineUsers();
};

const isCurrentUser = (userId: any) => {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    const user = JSON.parse(userJson);
    return String(user.id) === String(userId);
  }
  return false;
};

const handleKickUser = async (userId: any, realName: string) => {
  Alert.alert('强退用户', `确定要强行踢出在线用户 [${realName}] 吗？`, [
    { text: '取消', style: 'cancel' },
    {
      text: '强退',
      style: 'destructive',
      onPress: async () => {
        try {
          await kickOnlineUser(userId);
          alert(`用户 [${realName}] 已被强退！`);
          fetchOnlineUsers();
        } catch (error: any) {
          alert('操作失败: ' + error.message);
        }
      }
    }
  ]);
};

// --- 统一回收站 ---
const showRecycleModal = ref(false);
const recycleList = ref<any[]>([]);
const loadingRecycle = ref(false);

const fetchRecycleBin = async () => {
  loadingRecycle.value = true;
  try {
    const res: any = await getRecycleBin();
    recycleList.value = res || [];
  } catch (error: any) {
    console.error('获取回收站数据失败:', error);
    alert('获取回收站数据失败: ' + error.message);
  } finally {
    loadingRecycle.value = false;
  }
};

const openRecycleModal = () => {
  showRecycleModal.value = true;
  fetchRecycleBin();
};

const handleRecoverRecycleItem = async (id: any, type: string) => {
  try {
    await recoverRecycleItem(id, type);
    alert('数据已成功恢复！');
    fetchRecycleBin();
  } catch (error: any) {
    alert('恢复失败: ' + error.message);
  }
};

const handleDeleteRecycleItem = async (id: any, type: string) => {
  Alert.alert('彻底删除', '确定彻底粉碎此项数据吗？物理删除后不可恢复！', [
    { text: '取消', style: 'cancel' },
    {
      text: '粉碎数据',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteRecycleItem(id, type);
          alert('数据已物理粉碎！');
          fetchRecycleBin();
        } catch (error: any) {
          alert('删除失败: ' + error.message);
        }
      }
    }
  ]);
};

const handleCleanRecycleBin = async () => {
  Alert.alert('清空回收站', '💥 警告：即将一键清空回收站中所有已软删除的数据项！此操作极其危险且不可逆，确认继续吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '清空回收站',
      style: 'destructive',
      onPress: async () => {
        try {
          await cleanRecycleBin();
          alert('回收站已全部清空！');
          fetchRecycleBin();
        } catch (error: any) {
          alert('操作失败: ' + error.message);
        }
      }
    }
  ]);
};

// --- 字节转换和开机时间 ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600*24));
  const h = Math.floor((seconds % (3600*24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const dDisplay = d > 0 ? d + " 天 " : "";
  const hDisplay = h > 0 ? h + " 小时 " : "";
  const mDisplay = m > 0 ? m + " 分 " : "";
  const sDisplay = s > 0 ? s + " 秒" : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 10px 0 40px 0;
}

.settings-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.settings-card-title {
  padding: 20px 24px 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-title, #1e293b);
  margin: 0;
}

.settings-list {
  padding: 0 24px 10px;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-label {
  font-weight: 500;
  color: var(--text-title, #1e293b);
}

.settings-value {
  font-size: 14px;
  color: var(--text-muted, #64748b);
}

.settings-action {
  display: flex;
  align-items: center;
}

/* 简单的 Toggle 开关样式 */
.toggle-switch {
  width: 44px;
  height: 24px;
  background-color: #cbd5e1;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-switch.active {
  background-color: var(--primary-color, #6366f1);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.toggle-switch.active::after {
  transform: translateX(20px);
}

/* 操作日志弹窗 Modal 样式 */
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
  max-width: 1100px;
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
  font-size: 18px;
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

/* 搜索栏 */
.logs-search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #edf2f7;
}

.search-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input-group label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.search-input-group input {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input-group input:focus {
  border-color: var(--primary-color, #6366f1);
}

.logs-btn {
  padding: 7px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
}

.btn-search {
  background-color: var(--primary-color, #6366f1);
  color: white;
}

.btn-search:hover {
  opacity: 0.9;
}

.btn-reset {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-reset:hover {
  background-color: #e2e8f0;
}

.btn-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f8fafc;
  border-color: #94a3b8;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表格样式 */
.logs-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 45vh;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.logs-table th, .logs-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.logs-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.logs-table tr:hover {
  background-color: #f8fafc;
}

.log-user-info {
  display: flex;
  flex-direction: column;
}

.log-real-name {
  font-weight: 600;
  color: #0f172a;
}

.log-username {
  font-size: 11px;
  color: #64748b;
}

/* Tag 样式 */
.module-tag {
  background-color: #e0e7ff;
  color: #4338ca;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.method-tag {
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

.method-tag.post { background-color: #ecfdf5; color: #047857; }
.method-tag.put { background-color: #eff6ff; color: #1d4ed8; }
.method-tag.delete { background-color: #fdf2f8; color: #be185d; }

.td-url, .td-params {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.td-time {
  color: #64748b;
  font-family: monospace;
}

.text-success { color: #10b981; }
.text-warning { color: #f59e0b; }

.status-badge {
  padding: 2px 6px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.success {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.danger {
  background-color: #fee2e2;
  color: #991b1b;
}

/* 分页器 */
.logs-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.pagination-info {
  font-size: 13px;
  color: #64748b;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 自定义表单及对话框样式 */
.form-group-custom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  text-align: left;
}

.form-row-custom {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  text-align: left;
}

.form-label-custom {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.form-input-custom {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background-color: #f8fafc;
  transition: all 0.2s ease;
}

.form-input-custom:focus {
  border-color: var(--primary-color, #6366f1);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-tip-custom {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

.form-divider-custom {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
  margin: 20px 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.btn-preset-custom {
  background: none;
  border: none;
  color: var(--primary-color, #6366f1);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s;
  float: left;
}

.btn-preset-custom:hover {
  color: #4f46e5;
}

.modal-actions-custom {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel-custom {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background-color: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-custom:hover {
  background-color: #f8fafc;
  color: #1e293b;
}

.btn-submit-custom {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary-color, #6366f1), #4f46e5);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
  transition: all 0.2s;
}

.btn-submit-custom:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.btn-submit-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 监控面板样式 */
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.monitor-card-item {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.monitor-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monitor-card-icon {
  font-size: 24px;
  background-color: #e2e8f0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monitor-card-title-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.monitor-card-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.monitor-card-desc {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.monitor-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monitor-progress-bar {
  flex: 1;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.cpu-fill {
  background: linear-gradient(90deg, #a855f7, #6366f1);
}

.mem-fill {
  background: linear-gradient(90deg, #3b82f6, #10b981);
}

.disk-fill {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.monitor-percentage {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  min-width: 36px;
  text-align: right;
}

.monitor-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.detail-cell-custom {
  font-size: 12px;
  color: #475569;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
}

.detail-cell-custom span {
  font-family: monospace;
  font-weight: 600;
  color: #0f172a;
}

/* 按钮样式 */
.btn-danger-custom {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-danger-custom:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-danger-custom:disabled {
  background-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}

.module-tag.user { background-color: #e0f2fe; color: #0369a1; }
.module-tag.asset { background-color: #fef3c7; color: #b45309; }
.module-tag.project { background-color: #f3e8ff; color: #7e22ce; }
.module-tag.task { background-color: #dcfce7; color: #15803d; }

/* 角色权限分配样式 */
.perms-roles-panel {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.perms-panel-title {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.perms-roles-list {
  display: flex;
  flex-direction: column;
}

.perms-role-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.perms-role-item:hover {
  background-color: #f8fafc;
}

.perms-role-item.active {
  background-color: rgba(99, 88, 238, 0.08);
  border-left: 4px solid var(--primary, #6358ee);
}

.role-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.role-item-code {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.perms-tree-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f8fafc;
  height: 100%;
  min-height: 0;
}

.perms-tree-scroll {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
  box-sizing: border-box;
  min-height: 0;
}

.admin-perms-warning {
  margin: 16px;
  padding: 12px 16px;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  color: #b45309;
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
}

.perms-tree-loading {
  padding: 40px;
  text-align: center;
  color: var(--primary, #6358ee);
  font-size: 14px;
}

.perms-tree-section {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
}

.perms-tree-section:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(99, 88, 238, 0.05), 0 4px 6px -2px rgba(99, 88, 238, 0.02);
  border-color: var(--primary, #6358ee);
}

.perms-parent-row {
  padding: 16px 20px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
}

.perms-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
}

.parent-label {
  font-weight: 600;
  color: #0f172a;
}

.child-label {
  font-weight: 400;
  color: #475569;
}

.perms-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary, #6358ee);
  cursor: pointer;
}

.perms-node-icon {
  font-size: 16px;
}

.perms-node-name {
  font-size: 14px;
}

.perms-children-grid {
  padding: 18px 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 20px;
  background-color: #fafafa;
}

.perms-child-item {
  display: flex;
  align-items: center;
}
</style>
