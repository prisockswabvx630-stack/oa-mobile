import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Transfer } from '../types';

export const addTransfer = async (transfer: Omit<Transfer, 'id' | 'createTime'>) => {
  try {
    const res = await api.createTransfer(transfer);
    logActivity(`系统 发起了异动申请: ${transfer.empName} - ${transfer.type}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增异动失败:', error);
    throw error;
  }
};

export const updateTransfer = async (id: string, fields: Partial<Transfer>) => {
  try {
    const res = await api.updateTransfer(id, fields);
    logActivity(`系统 更新了异动单ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新异动失败:', error);
    throw error;
  }
};
