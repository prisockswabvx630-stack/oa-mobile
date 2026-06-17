import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';

export const updateSystemSettings = async (settings: {
  systemName: string;
  logo: string;
  workTimeStart: string;
  workTimeEnd: string;
  flexTime: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  wifiMac?: string;
  wifiName?: string;
  deviceCheck?: boolean;
}) => {
  try {
    const res = await api.updateSystemSettings(settings);
    logActivity(`系统 更新了全局系统设置`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新系统设置失败:', error);
    throw error;
  }
};
