<template>
  <div id="page-notice-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">公告管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="mockAction('发布公告')">+ 发布公告</button>
      </div>
    </div>

    <div class="data-table-container" style="margin-top: 20px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>公告标题</th>
            <th>类型</th>
            <th>发布人</th>
            <th>发布范围</th>
            <th>发布时间</th>
            <th>阅读量</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.notices.length === 0">
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
          </tr>
          <tr v-else v-for="notice in store.notices" :key="notice.id">
            <td style="font-weight: 500;">{{ notice.title }}</td>
            <td style="color: var(--text-muted);">{{ notice.type }}</td>
            <td>{{ notice.publisher }}</td>
            <td>{{ notice.scope }}</td>
            <td style="color: var(--text-muted);">{{ notice.publishTime }}</td>
            <td>{{ notice.reads }}</td>
            <td>
              <span class="badge" :class="notice.status === '已发布' ? 'success' : 'info'">
                {{ notice.status }}
              </span>
            </td>
            <td>
              <span class="action-link" @click="mockAction('查看详情')">查看</span>
              <span v-if="notice.status === '已发布'" class="action-link text-danger" @click="handleWithdraw(notice.id)">撤回</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { store, withdrawNotice, Alert } from '../store';

const handleWithdraw = (id: number) => {
  Alert.alert('撤回公告', '确定要撤回该公告吗？撤回后员工将无法再查看。', [
    { text: '取消', style: 'cancel' },
    {
      text: '撤回',
      style: 'destructive',
      onPress: () => {
        withdrawNotice(id);
        alert('公告已撤回');
      }
    }
  ]);
};

const mockAction = (actionName: string) => {
  alert(`${actionName}功能正在开发中！`);
};
</script>

<style scoped>
.text-danger {
  color: var(--danger-color, #ef4444);
  margin-left: 8px;
}
.text-danger:hover {
  text-decoration: underline;
}
</style>
