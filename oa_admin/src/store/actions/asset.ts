import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Asset } from '../types';

export const addAsset = async (asset: Omit<Asset, 'id'>) => {
  try {
    const res = await api.createAsset(asset);
    logActivity(`系统 新增了资产: ${asset.name}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增资产失败:', error);
    throw error;
  }
};

export const updateAsset = async (id: string, fields: Partial<Asset>) => {
  try {
    const res = await api.updateAsset(id, fields);
    logActivity(`系统 更新了资产状态 (资产ID: ${id})`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新资产失败:', error);
    throw error;
  }
};

export const deleteAsset = async (id: string) => {
  try {
    const res = await api.deleteAsset(id);
    logActivity(`系统 删除了资产ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除资产失败:', error);
    throw error;
  }
};
