<template>
  <div id="page-documents-mgmt" class="page-section">
    <div class="page-header">
      <h2 class="page-title">文档管理</h2>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="openFolderModal">📁 新建文件夹</button>
        <button class="btn btn-primary" @click="openUploadModal">+ 上传文档</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">全部文档</div>
          <div class="stat-info-val">{{ stats.total }}</div>
        </div>
        <div class="stat-icon-wrapper purple">📄</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">本月上传</div>
          <div class="stat-info-val" style="color: var(--info);">{{ stats.thisMonth }}</div>
        </div>
        <div class="stat-icon-wrapper blue">⬆</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">总浏览量</div>
          <div class="stat-info-val" style="color: var(--success);">{{ stats.totalViews }}</div>
        </div>
        <div class="stat-icon-wrapper green">👁</div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-info-title">总下载量</div>
          <div class="stat-info-val" style="color: var(--warning);">{{ stats.totalDownloads }}</div>
        </div>
        <div class="stat-icon-wrapper yellow">⬇</div>
      </div>
    </div>

    <!-- 搜索过滤栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>文件名:</label>
        <input type="text" class="form-control form-control-search" v-model="searchKeyword" placeholder="搜索文档名称/上传者">
      </div>
      <div class="filter-item">
        <label>类型:</label>
        <select class="form-control" v-model="searchType">
          <option value="">全部</option>
          <option value="Word">Word</option>
          <option value="Excel">Excel</option>
          <option value="PDF">PDF</option>
          <option value="PPT">PPT</option>
          <option value="Folder">文件夹</option>
        </select>
      </div>
      <div class="filter-item">
        <label>权限:</label>
        <select class="form-control" v-model="searchPermission">
          <option value="">全部</option>
          <option value="全员可见">全员可见</option>
          <option value="部门可见">部门可见</option>
          <option value="项目组">项目组</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="handleSearch">🔍 查询</button>
      <button class="btn btn-secondary" @click="handleReset">🔄 重置</button>
    </div>

    <!-- 数据列表 -->
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>类型</th>
            <th>大小</th>
            <th>上传者</th>
            <th>浏览/下载</th>
            <th>更新时间</th>
            <th>权限</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedDocs.length === 0">
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">暂无数据</td>
          </tr>
          <tr v-else v-for="doc in pagedDocs" :key="doc.id">
            <td style="font-weight: 500;">
              <span v-if="doc.type === 'Word'">📝</span>
              <span v-else-if="doc.type === 'Excel'">📊</span>
              <span v-else-if="doc.type === 'PDF'">📕</span>
              <span v-else-if="doc.type === 'PPT'">📈</span>
              <span v-else>📁</span>
              {{ doc.name }}
            </td>
            <td>{{ doc.type }}</td>
            <td>{{ doc.size }}</td>
            <td>{{ doc.uploader }}</td>
            <td style="font-size: 13px; color: var(--text-muted);">
              👁 {{ doc.viewCount }} / ⬇ {{ doc.downloadCount }}
            </td>
            <td style="color: var(--text-muted); font-size: 13px;">{{ doc.updateTime }}</td>
            <td>
              <span class="badge" :class="getPermissionBadgeClass(doc.permission)">{{ doc.permission }}</span>
            </td>
            <td>
              <span class="action-link" @click="viewDetail(doc)">详情</span>
              <span class="action-link" @click="handleDownload(doc)">下载</span>
              <span class="action-link" @click="openEditModal(doc)">编辑</span>
              <span class="action-link" @click="handleShare(doc)">分享</span>
              <span class="action-link danger" @click="handleDelete(doc.id)">删除</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination-container">
        <div>共 {{ filteredDocs.length }} 条记录</div>
        <div class="pagination-pages">
          <button class="page-btn" :disabled="currentPage === 1" :class="{ disabled: currentPage === 1 }" @click="currentPage--">◀</button>
          <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" :class="{ disabled: currentPage === totalPages }" @click="currentPage++">▶</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">文档详情</h3>
          <span class="modal-close" @click="closeDetailModal">&times;</span>
        </div>
        <div class="modal-body" v-if="detailDoc">
          <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">
              <span v-if="detailDoc.type === 'Word'">📝</span>
              <span v-else-if="detailDoc.type === 'Excel'">📊</span>
              <span v-else-if="detailDoc.type === 'PDF'">📕</span>
              <span v-else-if="detailDoc.type === 'PPT'">📈</span>
              <span v-else>📁</span>
            </span>
            <div>
              <strong style="color: var(--text-title); font-size: 16px;">{{ detailDoc.name }}</strong>
              <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">{{ detailDoc.type }} · {{ detailDoc.size }}</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
            <div><span style="color: var(--text-muted);">上传者:</span> {{ detailDoc.uploader }}</div>
            <div><span style="color: var(--text-muted);">部门:</span> {{ detailDoc.dept }}</div>
            <div><span style="color: var(--text-muted);">访问权限:</span> <span class="badge" :class="getPermissionBadgeClass(detailDoc.permission)">{{ detailDoc.permission }}</span></div>
            <div><span style="color: var(--text-muted);">更新时间:</span> {{ detailDoc.updateTime }}</div>
            <div><span style="color: var(--text-muted);">浏览次数:</span> {{ detailDoc.viewCount }}</div>
            <div><span style="color: var(--text-muted);">下载次数:</span> {{ detailDoc.downloadCount }}</div>
          </div>
          <div v-if="detailDoc.remark" style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 14px; line-height: 1.6; color: var(--text-body);">
            <span style="color: var(--text-muted); font-size: 12px; display: block; margin-bottom: 4px;">备注</span>
            {{ detailDoc.remark }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetailModal">关闭</button>
          <button type="button" class="btn btn-primary" @click="closeDetailModal(); handleDownload(detailDoc)">下载</button>
        </div>
      </div>
    </div>

    <!-- 编辑文档弹窗 -->
    <div class="modal-overlay" v-if="showEditModal">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">编辑文档</h3>
          <span class="modal-close" @click="closeEditModal">&times;</span>
        </div>
        <form @submit.prevent="handleEditSave">
          <div class="modal-body">
            <div class="form-group">
              <label>文档名称</label>
              <input type="text" class="form-control" v-model="editForm.name" style="width: 100%;" required>
            </div>
            <div class="form-group">
              <label>访问权限</label>
              <select class="form-control" v-model="editForm.permission" style="width: 100%;">
                <option value="全员可见">全员可见</option>
                <option value="部门可见">部门可见</option>
                <option value="项目组">项目组</option>
              </select>
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea class="form-control" v-model="editForm.remark" style="width: 100%; min-height: 60px; resize: vertical;" placeholder="添加备注信息（选填）"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 新建文件夹弹窗 -->
    <div class="modal-overlay" v-if="showFolderModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">新建文件夹</h3>
          <span class="modal-close" @click="closeFolderModal">&times;</span>
        </div>
        <form @submit.prevent="handleCreateFolder">
          <div class="modal-body">
            <div class="form-group">
              <label>文件夹名称</label>
              <input type="text" class="form-control" v-model="folderForm.name" style="width: 100%;" required placeholder="请输入文件夹名称">
            </div>
            <div class="form-group">
              <label>所属目录</label>
              <input type="text" class="form-control" v-model="folderForm.folder" style="width: 100%;" placeholder="根目录">
            </div>
            <div class="form-group">
              <label>访问权限</label>
              <select class="form-control" v-model="folderForm.permission" style="width: 100%;">
                <option value="全员可见">全员可见</option>
                <option value="部门可见">部门可见</option>
                <option value="项目组">项目组</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeFolderModal">取消</button>
            <button type="submit" class="btn btn-primary">确定</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 上传文档弹窗 -->
    <div class="modal-overlay" v-if="showUploadModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">上传文档</h3>
          <span class="modal-close" @click="closeUploadModal">&times;</span>
        </div>
        <form @submit.prevent="handleUploadDoc">
          <div class="modal-body">
            <div class="form-group">
              <label>文档名称</label>
              <input type="text" class="form-control" v-model="uploadForm.name" style="width: 100%;" required placeholder="例如：2026年度总结.xlsx">
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>文档类型</label>
                <select class="form-control" v-model="uploadForm.type" style="width: 100%;">
                  <option value="Word">Word</option>
                  <option value="Excel">Excel</option>
                  <option value="PDF">PDF</option>
                  <option value="PPT">PPT</option>
                </select>
              </div>
              <div style="flex: 1;">
                <label>文档大小</label>
                <input type="text" class="form-control" v-model="uploadForm.size" style="width: 100%;" required placeholder="如：1.2MB">
              </div>
            </div>
            <div class="form-group" style="display: flex; gap: 16px;">
              <div style="flex: 1;">
                <label>所属目录</label>
                <input type="text" class="form-control" v-model="uploadForm.folder" style="width: 100%;" placeholder="公司制度">
              </div>
              <div style="flex: 1;">
                <label>访问权限</label>
                <select class="form-control" v-model="uploadForm.permission" style="width: 100%;">
                  <option value="全员可见">全员可见</option>
                  <option value="部门可见">部门可见</option>
                  <option value="项目组">项目组</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea class="form-control" v-model="uploadForm.remark" style="width: 100%; min-height: 50px; resize: vertical;" placeholder="文档备注信息（选填）"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeUploadModal">取消</button>
            <button type="submit" class="btn btn-primary">上传</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 分享弹窗 -->
    <div class="modal-overlay" v-if="showShareModal">
      <div class="modal-content" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title">分享文档</h3>
          <span class="modal-close" @click="showShareModal = false">&times;</span>
        </div>
        <div class="modal-body" v-if="shareDoc">
          <div style="margin-bottom: 16px; font-size: 14px;">
            <span style="color: var(--text-muted);">文档:</span> <strong>{{ shareDoc.name }}</strong>
          </div>
          <div class="form-group">
            <label>分享链接</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-control" :value="shareLink" readonly style="flex: 1;">
              <button type="button" class="btn btn-primary" @click="copyShareLink">复制</button>
            </div>
          </div>
          <div class="form-group">
            <label>有效期</label>
            <select class="form-control" v-model="shareExpiry" style="width: 100%;">
              <option value="7">7天</option>
              <option value="30">30天</option>
              <option value="0">永久有效</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showShareModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, addDocument, updateDocument, deleteDocument, viewDocument, downloadDocument, Alert } from '../store';
import type { Document } from '../store';

// --- 搜索过滤 ---
const searchKeyword = ref('');
const searchType = ref('');
const searchPermission = ref('');
const filterKeyword = ref('');
const filterType = ref('');
const filterPermission = ref('');

const currentPage = ref(1);
const pageSize = 10;

const handleSearch = () => {
  filterKeyword.value = searchKeyword.value;
  filterType.value = searchType.value;
  filterPermission.value = searchPermission.value;
  currentPage.value = 1;
};

const handleReset = () => {
  searchKeyword.value = '';
  searchType.value = '';
  searchPermission.value = '';
  handleSearch();
};

const currentUser = computed(() => {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
});

const currentEmployee = computed(() => {
  if (!currentUser.value) return null;
  return store.employees.find(e => e.name === currentUser.value.real_name);
});

const canViewDocument = (doc: Document) => {
  if (!currentUser.value) return false;
  if (currentUser.value.username === 'admin' || store.userPermissions.roleCode === 'ROLE_ADMIN') return true;
  if (currentUser.value.real_name === doc.uploader) return true;
  if (doc.permission === '全员可见') return true;

  const myEmp = currentEmployee.value;
  const uploaderEmp = store.employees.find(e => e.name === doc.uploader);

  if (doc.permission === '部门可见') {
    return myEmp && uploaderEmp && myEmp.dept === uploaderEmp.dept;
  }
  if (doc.permission === '项目组') {
    if (!myEmp || !uploaderEmp) return false;
    const myProjects = store.tasks.filter(t => t.owner === myEmp.name).map(t => t.project);
    const uploaderProjects = store.tasks.filter(t => t.owner === uploaderEmp.name).map(t => t.project);
    return myProjects.some(p => uploaderProjects.includes(p));
  }
  return false;
};

const filteredDocs = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const type = filterType.value;
  const perm = filterPermission.value;

  return store.documents.filter(doc => {
    if (!canViewDocument(doc)) return false;
    const matchKeyword = !keyword || doc.name.toLowerCase().includes(keyword) || doc.uploader.toLowerCase().includes(keyword);
    const matchType = !type || doc.type === type;
    const matchPerm = !perm || doc.permission === perm;
    return matchKeyword && matchType && matchPerm;
  });
});

const totalPages = computed(() => Math.ceil(filteredDocs.value.length / pageSize) || 1);

const pagedDocs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredDocs.value.slice(start, start + pageSize);
});

// --- 统计 ---
const stats = computed(() => {
  const total = store.documents.length;
  const now = new Date();
  const thisMonth = store.documents.filter(d => {
    const parts = d.updateTime.split('-');
    return parts.length >= 2 && Number(parts[0]) === now.getFullYear() && Number(parts[1]) === now.getMonth() + 1;
  }).length;
  const totalViews = store.documents.reduce((sum, d) => sum + d.viewCount, 0);
  const totalDownloads = store.documents.reduce((sum, d) => sum + d.downloadCount, 0);
  return { total, thisMonth, totalViews, totalDownloads };
});

// --- 样式辅助 ---
const getPermissionBadgeClass = (perm: string) => {
  if (perm === '全员可见') return 'success';
  if (perm === '部门可见') return 'info';
  return 'warning';
};

// --- 详情弹窗 ---
const showDetailModal = ref(false);
const detailDoc = ref<Document | null>(null);

const viewDetail = async (doc: Document) => {
  detailDoc.value = doc;
  showDetailModal.value = true;
  await viewDocument(doc.id);
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  detailDoc.value = null;
};

// --- 编辑弹窗 ---
const showEditModal = ref(false);
const editingDoc = ref<Document | null>(null);
const editForm = ref({ name: '', permission: '', remark: '' });

const openEditModal = (doc: Document) => {
  editingDoc.value = doc;
  editForm.value = {
    name: doc.name,
    permission: doc.permission,
    remark: doc.remark || ''
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingDoc.value = null;
};

const handleEditSave = async () => {
  if (!editingDoc.value) return;
  try {
    await updateDocument(editingDoc.value.id, {
      name: editForm.value.name,
      permission: editForm.value.permission,
      remark: editForm.value.remark
    });
    alert('文档更新成功！');
    closeEditModal();
  } catch {
    alert('更新失败，请重试');
  }
};

// --- 新建文件夹 ---
const showFolderModal = ref(false);
const folderForm = ref({ name: '', folder: '根目录', permission: '部门可见' });

const openFolderModal = () => {
  folderForm.value = { name: '', folder: '根目录', permission: '部门可见' };
  showFolderModal.value = true;
};

const closeFolderModal = () => { showFolderModal.value = false; };

const handleCreateFolder = () => {
  const uploaderName = currentUser.value?.real_name || '刘思彤';
  addDocument({
    name: folderForm.value.name,
    type: 'Folder',
    size: '-',
    uploader: uploaderName,
    folder: folderForm.value.folder || '根目录',
    permission: folderForm.value.permission
  });
  alert('文件夹新建成功！');
  closeFolderModal();
};

// --- 上传文档 ---
const showUploadModal = ref(false);
const uploadForm = ref({ name: '', type: 'Word', size: '256KB', folder: '根目录', permission: '全员可见', remark: '' });

const openUploadModal = () => {
  uploadForm.value = { name: '', type: 'Word', size: '256KB', folder: '根目录', permission: '全员可见', remark: '' };
  showUploadModal.value = true;
};

const closeUploadModal = () => { showUploadModal.value = false; };

const handleUploadDoc = () => {
  const uploaderName = currentUser.value?.real_name || '刘思彤';
  addDocument({
    name: uploadForm.value.name,
    type: uploadForm.value.type,
    size: uploadForm.value.size,
    uploader: uploaderName,
    folder: uploadForm.value.folder || '根目录',
    permission: uploadForm.value.permission,
    remark: uploadForm.value.remark
  });
  alert('文档上传成功！');
  closeUploadModal();
};

// --- 删除 ---
const handleDelete = (id: string) => {
  Alert.alert('删除文档', '确定要删除该文档吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '删除',
      style: 'destructive',
      onPress: () => {
        deleteDocument(id);
        alert('文档已删除！');
      }
    }
  ]);
};

// --- 下载 ---
const generateDummyContent = (title: string): string => {
  if (title.includes('预算')) {
    return `本文件为《${title}》的正式归档版本。根据公司财务管理规定，结合各业务部门提交的年度资金申请及历史支出数据，财务部编制了此版预算方案。本年度预算主要向核心研发项目倾斜，以支持OA系统的持续重构和移动端开发。同时，对行政办公开支和日常运营费用进行了合理压缩，优化了资金使用效率。请各级预算执行责任人严格控制报销与采购流程，防范财务风险，确保公司在2026年度的稳健增长与盈利目标顺利达成。`;
  }
  if (title.includes('手册') || title.includes('规范')) {
    return `本文件为《${title}》。它是公司管理体系的重要组成部分，旨在明确所有员工的行为规范、考勤纪律、日常福利以及晋升评估制度。全体员工必须严格遵守本规范，核心工作时间为每日 10:00 - 16:00，弹性打卡满8小时。各级主管及HR部门将依此对员工进行绩效考核与考勤抽查。本手册自2026年起正式实施，如有重大修订，将通过系统公告板块向全员公开发布。`;
  }
  if (title.includes('方案') || title.includes('设计') || title.includes('架构')) {
    return `本文件为《${title}》。为了满足日益增长的日常办公协同与分布式文档共享需求，我们设计了此方案。系统整体采用前后端分离架构，前端选用Vue 3，后端利用Express + Prisma + MySQL提供高并发API。本方案详细阐述了数据库结构优化、多租户权限校验模型（RBAC）以及微服务化部署路线。`;
  }
  return `您正在下载的文件标题为《${title}》。该文档已通过智能OA系统安全审计并完成云端归档。文档中包含的内容仅供公司内部传阅与参考，任何人员未经特别授权，不得将本文档以任何形式泄露或共享给公司以外的第三方。`;
};

const handleDownload = async (doc: Document | null) => {
  if (!doc) return;
  await downloadDocument(doc.id);

  const title = doc.name;
  const rawType = doc.type.toLowerCase();
  const content = generateDummyContent(title);

  let blob: Blob;
  if (rawType === 'word' || title.endsWith('.docx') || title.endsWith('.wps')) {
    const htmlWord = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><title>${title}</title><meta charset="utf-8"></head><body style="font-family: SimSun; padding: 30px; line-height: 1.5;"><h1 style="color: #2b579a; text-align: center; border-bottom: 2px solid #2b579a; padding-bottom: 10px;">${title}</h1><p style="color: #888; font-size: 11px; text-align: right;">智能OA办公系统 · 上传者: ${doc.uploader} · ${doc.updateTime}</p><hr/><div style="font-size: 14px; text-align: justify; text-indent: 28px;">${content}</div></body></html>`;
    blob = new Blob([htmlWord], { type: 'application/msword;charset=utf-8' });
  } else if (rawType === 'excel' || title.endsWith('.xlsx')) {
    const csvContent = "﻿" + `报表名称,${title}\n所属目录,${doc.folder}\n导出时间,${doc.updateTime}\n下载用户,${currentUser.value?.real_name || '未知'}\n安全级别,${doc.permission}\n\n分类,核心项,数值 (万元),占比,说明\n营业收入,主营业务费,580.40,65.00%,季度增长符合预期\n研发支出,技术架构研发,150.20,18.00%,前端Vue与移动端重构\n行政成本,房租与日常固定,45.80,6.00%,合理摊销控制较好\n人力资源,绩效薪酬与社保,85.50,11.00%,核心人员留存\n净利润,公司结余利润,248.90,31.00%,整体运营效率良好\n`;
    blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  } else if (rawType === 'pdf' || title.endsWith('.pdf')) {
    const streamContent = ['BT', '/F1 16 Tf', '18 TL', '72 712 Td', `(Smart OA Cloud Document) Tj`, 'T*', '/F1 10 Tf', '12 TL', `(Uploader: ${doc.uploader}) Tj`, 'T*', `(Update: ${doc.updateTime}) Tj`, 'T*', '--------------------------------------------------', 'T*', 'T*', '/F1 11 Tf', '15 TL', `(${content.replace(/[\(\)\\]/g, '\\$&')}) Tj`, 'ET'].join('\n');
    blob = new Blob([`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000282 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${282 + streamContent.length + 100}\n%%EOF`], { type: 'application/pdf' });
  } else {
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = title;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// --- 分享 ---
const showShareModal = ref(false);
const shareDoc = ref<Document | null>(null);
const shareExpiry = ref('7');
const shareLink = computed(() => `https://oa.example.com/share/${shareDoc.value?.id || 'doc'}_${Math.random().toString(36).substring(7)}`);

const handleShare = (doc: Document) => {
  shareDoc.value = doc;
  shareExpiry.value = '7';
  showShareModal.value = true;
};

const copyShareLink = () => {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    alert('分享链接已复制到剪贴板！');
  }).catch(() => {
    alert('复制失败，请手动复制：' + shareLink.value);
  });
};
</script>

<style scoped>
.action-link.danger {
  color: var(--danger);
}
.action-link.danger:hover {
  text-decoration: underline;
}
</style>
