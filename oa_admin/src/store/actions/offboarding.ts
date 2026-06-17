import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Offboarding } from '../types';

export const addOffboarding = async (offboarding: Omit<Offboarding, 'id' | 'createTime'>) => {
  try {
    const res = await api.createOffboarding(offboarding);
    logActivity(`系统 提交了离职申请: ${offboarding.empName}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('提交离职申请失败:', error);
    throw error;
  }
};

export const updateOffboarding = async (id: string, fields: Partial<Offboarding>) => {
  try {
    const res = await api.updateOffboarding(id, fields);
    logActivity(`系统 更新了离职单ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新离职申请失败:', error);
    throw error;
  }
};
