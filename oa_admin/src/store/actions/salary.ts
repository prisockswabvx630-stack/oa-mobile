import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { Salary } from '../types';

export const updateSalary = async (empId: string, fields: Partial<Salary>) => {
  try {
    const baseSalary = fields.baseSalary;
    const allowance = fields.allowance;
    const bonus = fields.bonus;
    const socialSec = fields.socialSec;
    const housingFund = fields.housingFund;
    const tax = fields.tax;
    const status = fields.status;

    const emp = store.employees.find(e => e.id === empId);
    const userId = emp?.userId || empId;

    const res = await api.updateSalary(userId, {
      baseSalary,
      allowance,
      bonus,
      socialSec,
      housingFund,
      tax,
      status
    });
    logActivity(`系统 更新了员工薪资明细 (工号: ${empId})`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新薪资失败:', error);
    throw error;
  }
};
