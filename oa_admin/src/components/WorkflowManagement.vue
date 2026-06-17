<template>
  <div id="page-workflow-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">流程模板管理</h2>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openModal()">+ 新建流程模板</button>
      </div>
    </div>

    <!-- 数据列表 -->
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>流程名称</th>
            <th>流程编码</th>
            <th>适用范围</th>
            <th>审批节点</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="templates.length === 0">
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无流程模板</td>
          </tr>
          <tr v-else v-for="item in templates" :key="item.code">
            <td style="font-weight: 500;">{{ item.name }}</td>
            <td style="font-family: var(--font-title); font-weight: 600;">{{ item.code }}</td>
            <td>{{ item.scope }}</td>
            <td style="font-weight: 500;">
              <span v-for="(node, index) in parseNodes(item.nodes)" :key="index">
                <span v-if="index > 0" style="color: var(--text-muted); margin: 0 4px;">-></span>
                <span :style="getNodeStyle(node)">{{ node }}</span>
              </span>
            </td>
            <td>
              <span class="badge" :class="item.status === '启用' ? 'success' : 'muted'">
                {{ item.status }}
              </span>
            </td>
            <td style="color: var(--text-muted); font-size: 13px;">{{ item.createTime }}</td>
            <td>
              <span class="action-link" @click="openModal(item)">编辑</span>
              <span class="action-link" @click="designFlow(item)">设计</span>
              <span 
                class="action-link" 
                :class="item.status === '启用' ? 'danger' : 'success'" 
                @click="toggleStatus(item)"
              >
                {{ item.status === '启用' ? '停用' : '启用' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 流程增改弹窗 -->
    <div class="modal-overlay" v-if="showModal">
      <div class="modal-content" style="max-width: 460px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingTemplate ? '编辑流程模板' : '新建流程模板' }}</h3>
          <span class="modal-close" @click="closeModal">&times;</span>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div class="form-group">
              <label>流程名称</label>
              <input type="text" class="form-control" v-model="form.name" style="width: 100%;" placeholder="如：请假审批流程" required>
            </div>
            <div class="form-group">
              <label>流程编码</label>
              <input type="text" class="form-control" v-model="form.code" style="width: 100%;" placeholder="如：LEAVE" :disabled="!!editingTemplate" required>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>适用范围</label>
                <input type="text" class="form-control" v-model="form.scope" style="width: 100%;" required>
              </div>
              <div style="flex: 1;">
                <label>默认状态</label>
                <select class="form-control" v-model="form.status" style="width: 100%;">
                  <option value="启用">启用</option>
                  <option value="停用">停用</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>审批节点链 (半角逗号分隔)</label>
              <input type="text" class="form-control" v-model="form.nodes" style="width: 100%;" placeholder="如：发起,主管,总监,HR" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 流程图设计弹窗 -->
    <div class="modal-overlay" v-if="showDesign">
      <div class="modal-content" style="max-width: 600px; width: 100%;">
        <div class="modal-header">
          <h3 class="modal-title">流程设计看板 - {{ designingItem?.name }}</h3>
          <span class="modal-close" @click="showDesign = false">&times;</span>
        </div>
        <div class="modal-body" style="background-color: #f7fafc; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div class="designer-node start">
            <span class="node-icon">🟢</span>
            <div>开始 (提交申请)</div>
          </div>
          
          <template v-for="(node, index) in parseNodes(designingItem?.nodes || '')" :key="index">
            <div class="designer-arrow">⬇</div>
            <div class="designer-node normal">
              <span class="node-icon">👤</span>
              <div>{{ node }} 审批</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">直属岗位自动流转</div>
            </div>
          </template>
          
          <div class="designer-arrow">⬇</div>
          <div class="designer-node end">
            <span class="node-icon">🏁</span>
            <div>归档 (流程结束)</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showDesign = false">关闭预览</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addProcessTemplate, updateProcessTemplate } from '../store';

interface TemplateItem {
  name: string;
  code: string;
  scope: string;
  nodes: string; // e.g. "发起,主管,总监,HR"
  status: '启用' | '停用';
  createTime: string;
}

const showModal = ref(false);
const showDesign = ref(false);
const editingTemplate = ref<TemplateItem | null>(null);
const designingItem = ref<TemplateItem | null>(null);

const form = ref({
  name: '',
  code: '',
  scope: '全员',
  status: '启用' as '启用' | '停用',
  nodes: '发起,主管'
});

const templates = computed(() => store.processTemplates);

const parseNodes = (nodesStr: string): string[] => {
  if (!nodesStr) return [];
  // 尝试解析JSON格式
  try {
    const parsed = JSON.parse(nodesStr);
    if (Array.isArray(parsed)) {
      return parsed.map((n: any) => n.nodeName || n.node_name || '').filter(Boolean);
    }
  } catch {}
  // 回退：逗号分隔的纯文本格式
  return nodesStr.split(',').map(n => n.trim()).filter(Boolean);
};

const getNodeStyle = (node: string) => {
  if (node === '发起') return { color: 'var(--text-muted)' };
  if (node === '主管') return { color: 'var(--primary)', fontWeight: '600' };
  if (node === '财务' || node === '出纳') return { color: 'var(--warning)', fontWeight: '600' };
  return { color: 'var(--success)', fontWeight: '600' };
};

const nodesToString = (nodesStr: string): string => {
  return parseNodes(nodesStr).join(',');
};

const openModal = (item: TemplateItem | null = null) => {
  editingTemplate.value = item;
  if (item) {
    form.value = {
      name: item.name,
      code: item.code,
      scope: item.scope,
      status: item.status,
      nodes: nodesToString(item.nodes)
    };
  } else {
    form.value = {
      name: '',
      code: '',
      scope: '全员',
      status: '启用',
      nodes: '发起,主管,总监'
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingTemplate.value = null;
};

const handleSave = async () => {
  if (editingTemplate.value) {
    try {
      await updateProcessTemplate(editingTemplate.value.code, {
        name: form.value.name,
        scope: form.value.scope,
        status: form.value.status,
        nodes: form.value.nodes
      });
      alert('修改成功！');
    } catch (e) {
      alert('修改失败，请重试');
    }
  } else {
    const code = form.value.code.toUpperCase().trim();
    if (store.processTemplates.some(t => t.code === code)) {
      alert('编码已存在！');
      return;
    }
    try {
      await addProcessTemplate({
        name: form.value.name,
        code,
        scope: form.value.scope,
        status: form.value.status,
        nodes: form.value.nodes
      });
      alert('新建成功！');
    } catch (e) {
      alert('新建失败，请重试');
    }
  }
  closeModal();
};

const toggleStatus = async (item: TemplateItem) => {
  try {
    const newStatus = item.status === '启用' ? '停用' : '启用';
    await updateProcessTemplate(item.code, {
      status: newStatus
    });
    alert(`流程模板已${newStatus}`);
  } catch (e) {
    alert('操作失败，请重试');
  }
};

const designFlow = (item: TemplateItem) => {
  designingItem.value = item;
  showDesign.value = true;
};
</script>

<style scoped>
/* 流程设计看板节点样式 */
.designer-node {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  width: 220px;
  padding: 16px;
  text-align: center;
  border-left: 5px solid var(--primary);
  font-weight: 600;
  font-size: 14px;
}

.designer-node.start {
  border-left-color: var(--success);
}

.designer-node.end {
  border-left-color: var(--text-muted);
}

.node-icon {
  font-size: 20px;
  margin-bottom: 6px;
  display: block;
}

.designer-arrow {
  font-size: 20px;
  color: var(--text-muted);
  margin: 10px 0;
}
</style>
