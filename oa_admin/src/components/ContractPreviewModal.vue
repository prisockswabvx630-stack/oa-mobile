<template>
  <div class="modal-overlay" v-if="visible" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <span class="modal-close" @click="close">&times;</span>
      </div>
      <div class="modal-body">
        <div class="contract-content" ref="contractContent" v-html="contractHTML"></div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" @click="close">关闭</button>
        <button class="btn-print" @click="handlePrint">打印</button>
        <button class="btn-submit" @click="handleDownload" :disabled="downloading">
          {{ downloading ? '生成中...' : '下载PDF' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { exportToPdf, printHtml } from '../utils/contractPdf'

const props = defineProps<{
  visible: boolean
  title: string
  contractHTML: string
  employeeName: string
  contractType: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const contractContent = ref<HTMLElement | null>(null)
const downloading = ref(false)

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const handleDownload = async () => {
  if (!contractContent.value) return
  downloading.value = true
  try {
    const date = new Date().toISOString().split('T')[0]
    await exportToPdf({
      filename: `${props.employeeName}_${props.contractType}_${date}.pdf`,
      element: contractContent.value
    })
  } catch (e) {
    console.error('PDF生成失败:', e)
    alert('PDF生成失败，请重试')
  } finally {
    downloading.value = false
  }
}

const handlePrint = () => {
  if (!contractContent.value) return
  printHtml(contractContent.value, props.title)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-card {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f3f4f6;
}

.contract-content {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 20px;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-print,
.btn-submit {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-print {
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
}

.btn-print:hover {
  background: #dbeafe;
}

.btn-submit {
  background: #4f46e5;
  color: white;
}

.btn-submit:hover {
  background: #4338ca;
}

.btn-submit:disabled {
  background: #a5b4fc;
  cursor: not-allowed;
}
</style>
