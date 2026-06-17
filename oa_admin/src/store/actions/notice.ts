import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Notice } from '../types';

export const addNotice = async (notice: Omit<Notice, 'id' | 'publishTime' | 'reads' | 'status'>) => {
  try {
    const res = await api.createNotice(notice);
    logActivity(`系统 发布了新公告: ${notice.title}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('发布公告失败:', error);
    throw error;
  }
};

export const withdrawNotice = async (id: number) => {
  try {
    const res = await api.withdrawNotice(id);
    logActivity(`系统 撤回了公告ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('撤回公告失败:', error);
    throw error;
  }
};

export const deleteNotice = async (id: number) => {
  try {
    const res = await api.deleteNotice(id);
    logActivity(`系统 删除了公告ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除公告失败:', error);
    throw error;
  }
};
