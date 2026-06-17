<template>
  <Transition name="fade">
    <div class="custom-alert-overlay" v-if="alertState.visible" @click="handleBackdropClick">
      <div class="custom-alert-container">
        <div class="custom-alert-content">
          <div class="custom-alert-title" v-if="alertState.title">{{ alertState.title }}</div>
          <div class="custom-alert-message" v-if="alertState.message">{{ alertState.message }}</div>
          <div class="custom-alert-input-wrapper" v-if="alertState.isPrompt">
            <input
              type="text"
              ref="inputRef"
              class="custom-alert-input"
              v-model="alertState.inputValue"
              :placeholder="alertState.placeholder"
              @keyup.enter="handleEnterKey"
            />
          </div>
        </div>
        <div class="custom-alert-buttons" :class="{ 'buttons-column': alertState.buttons.length > 2 }">
          <div
            v-for="(btn, index) in alertState.buttons"
            :key="index"
            class="custom-alert-btn"
            :class="[
              btn.style || 'default',
              { 'btn-border-left': index > 0 && alertState.buttons.length <= 2 },
              { 'btn-border-top': index > 0 && alertState.buttons.length > 2 }
            ]"
            @click="handleBtnClick(btn)"
          >
            {{ btn.text }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { alertState } from '../store';

const inputRef = ref<HTMLInputElement | null>(null);

const handleBtnClick = (btn: any) => {
  alertState.visible = false;
  if (btn.onPress) {
    btn.onPress(alertState.inputValue);
  }
};

const handleEnterKey = () => {
  const defaultBtn = alertState.buttons.find(btn => btn.style !== 'cancel') || alertState.buttons[0];
  if (defaultBtn) {
    handleBtnClick(defaultBtn);
  }
};

const handleBackdropClick = () => {
  // Click backdrop has no effect on critical alerts, resembling mobile native Alert behavior
};

watch(() => alertState.visible, (visible) => {
  if (visible && alertState.isPrompt) {
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  }
});
</script>

<style scoped>
/* 渐变过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .custom-alert-container {
  animation: alert-in 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
}

.fade-leave-active .custom-alert-container {
  animation: alert-out 0.18s ease-in forwards;
}

@keyframes alert-in {
  from {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes alert-out {
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.95) translateY(5px);
    opacity: 0;
  }
}

/* 全屏遮罩 */
.custom-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* 确保在最上层 */
}

/* 提示框主体容器 */
.custom-alert-container {
  background-color: #ffffff;
  border-radius: 16px;
  width: 320px;
  max-width: 85%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 文字内容区域 */
.custom-alert-content {
  padding: 24px 24px 20px;
  text-align: center;
}

.custom-alert-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  line-height: 1.4;
}

.custom-alert-message {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* 底部按钮区域 */
.custom-alert-buttons {
  display: flex;
  border-top: 1px solid #f1f5f9;
}

.custom-alert-buttons.buttons-column {
  flex-direction: column;
}

/* 按钮基础样式 */
.custom-alert-btn {
  flex: 1;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  line-height: 1;
}

.custom-alert-btn:hover {
  background-color: #f8fafc;
}

.custom-alert-btn:active {
  background-color: #f1f5f9;
}

/* 按钮间边框 */
.btn-border-left {
  border-left: 1px solid #f1f5f9;
}

.btn-border-top {
  border-top: 1px solid #f1f5f9;
}

/* 按钮样式体系 */
.custom-alert-btn.default {
  color: #6358ee; /* 主色紫色调 */
  font-weight: 600;
}

.custom-alert-btn.cancel {
  color: #64748b; /* 灰色辅助色 */
  font-weight: 500;
}

.custom-alert-btn.destructive {
  color: #ef4444; /* 红色破坏性按钮（用于删除、重置） */
  font-weight: 600;
}

/* 提示框输入框样式 */
.custom-alert-input-wrapper {
  margin-top: 16px;
  width: 100%;
}

.custom-alert-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  color: #0f172a;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  outline: none;
}

.custom-alert-input:focus {
  border-color: #6358ee;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(99, 88, 238, 0.15);
}
</style>
