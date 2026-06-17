import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Training } from '../types';

export const addTraining = async (training: Omit<Training, 'id'>) => {
  try {
    const res = await api.createTraining(training);
    logActivity(`系统 创建了培训计划: ${training.name}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增培训失败:', error);
    throw error;
  }
};

export const updateTraining = async (id: string, fields: Partial<Training>) => {
  try {
    const res = await api.updateTraining(id, fields);
    logActivity(`系统 更新了培训计划ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新培训失败:', error);
    throw error;
  }
};

export const deleteTraining = async (id: string) => {
  try {
    const res = await api.deleteTraining(id);
    logActivity(`系统 删除了培训计划ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除培训失败:', error);
    throw error;
  }
};
