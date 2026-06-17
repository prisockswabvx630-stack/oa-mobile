import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Contract } from '../types';

export const addContract = async (contract: Omit<Contract, 'id'>) => {
  try {
    const res = await api.createContract(contract);
    logActivity(`系统 新增了合同: ${contract.empName} - ${contract.type}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增合同失败:', error);
    throw error;
  }
};

export const updateContract = async (id: string, fields: Partial<Contract>) => {
  try {
    const res = await api.updateContract(id, fields);
    logActivity(`系统 更新了合同ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新合同失败:', error);
    throw error;
  }
};

export const deleteContract = async (id: string) => {
  try {
    const res = await api.deleteContract(id);
    logActivity(`系统 删除了合同ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除合同失败:', error);
    throw error;
  }
};
