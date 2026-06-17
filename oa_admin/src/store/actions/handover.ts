import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Handover } from '../types';

export const addHandover = async (handover: Omit<Handover, 'id' | 'createTime'>) => {
  try {
    const res = await api.createHandover(handover);
    logActivity(`系统 发起了工作交接: ${handover.title}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('发起了工作交接失败:', error);
    throw error;
  }
};

export const updateHandover = async (id: number, fields: Partial<Handover>) => {
  try {
    const res = await api.updateHandover(id, fields);
    logActivity(`系统 更新了工作交接ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新工作交接失败:', error);
    throw error;
  }
};

export const confirmHandover = async (id: number) => {
  try {
    const res = await api.updateHandover(id, { progress: 100, status: '已完成' });
    logActivity(`系统 确认了工作交接ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('确认工作交接失败:', error);
    throw error;
  }
};
