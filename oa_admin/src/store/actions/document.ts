import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Document } from '../types';

export const addDocument = async (doc: Omit<Document, 'id' | 'updateTime' | 'viewCount' | 'downloadCount'>) => {
  try {
    const res = await api.createDocument({
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploader: doc.uploader,
      permission: doc.permission,
      remark: doc.remark || ''
    });
    logActivity(`系统 上传了文档: ${doc.name}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('上传文档失败:', error);
    throw error;
  }
};

export const updateDocument = async (id: string, fields: Partial<Document>) => {
  try {
    const payload: any = {};
    if (fields.remark !== undefined) payload.remark = fields.remark;
    if (fields.permission !== undefined) {
      payload.scope = fields.permission === '全员可见' ? 'all' : fields.permission === '部门可见' ? 'dept' : 'personal';
    }
    if (fields.name !== undefined) payload.doc_name = fields.name;
    const res = await api.updateDocument(id, payload);
    logActivity(`系统 更新了文档ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新文档失败:', error);
    throw error;
  }
};

export const deleteDocument = async (id: string) => {
  try {
    const res = await api.deleteDocument(id);
    logActivity(`系统 删除了文档ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除文档失败:', error);
    throw error;
  }
};

export const viewDocument = async (id: string) => {
  try {
    const res: any = await api.viewDocument(id);
    const idx = store.documents.findIndex(d => d.id === id);
    if (idx !== -1 && res?.view_count !== undefined) {
      store.documents[idx].viewCount = res.view_count;
    }
    return res;
  } catch (error) {
    console.error('记录浏览失败:', error);
  }
};

export const downloadDocument = async (id: string) => {
  try {
    const res: any = await api.downloadDocument(id);
    const idx = store.documents.findIndex(d => d.id === id);
    if (idx !== -1 && res?.download_count !== undefined) {
      store.documents[idx].downloadCount = res.download_count;
    }
    return res;
  } catch (error) {
    console.error('记录下载失败:', error);
  }
};
