<template>
  <div id="page-placeholder" class="page-section" style="text-align: center; padding: 60px 0;">
    <div class="card" style="max-width: 500px; margin: 0 auto; padding: 40px;">
      <div style="font-size: 64px; margin-bottom: 20px;">🏗️</div>
      <h2 style="margin-bottom: 12px; color: var(--text-title);">{{ title }} (开发中)</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">
        该功能模块在移动端已完整上线，管理后台的数据绑定与流程编辑面板正在规划中。当前系统可支持用户管理、人事管理及考勤管理完整演示。
      </p>
      <button class="btn btn-primary" @click="$emit('go-dashboard')">返回仪表盘</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '功能模块'
  }
});
defineEmits(['go-dashboard']);
</script>
