import * as api from '../../api';
import { store } from '../index';
import { logActivity, withLoadingAndError } from './utils';
import { Validator, CommonRules } from '../../utils/validator';
import { Confirm } from '../../utils/confirm';
import type { Employee } from '../types';

export const addEmployee = async (emp: Omit<Employee, 'id' | 'createTime' | 'joinDate' | 'contractEnd'> & Partial<Pick<Employee, 'id' | 'createTime' | 'joinDate' | 'contractEnd'>>) => {
  // 数据验证
  const validation = Validator.validateAll(emp, {
    name: [CommonRules.required('请输入员工姓名')],
    phone: [CommonRules.phone()]
  });

  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  return withLoadingAndError(
    async () => {
      const res = await api.createUser(emp);
      logActivity(`系统 新增了员工 ${emp.name}`);
      await import('../index').then(m => m.loadAllData());
      return res;
    },
    'global',
    '新增员工'
  );
};

export const updateEmployee = async (id: string, updatedFields: Partial<Employee>) => {
  return withLoadingAndError(
    async () => {
      const res = await api.updateUser(id, updatedFields);
      logActivity(`系统 更新了员工信息 (工号: ${id})`);
      await import('../index').then(m => m.loadAllData());
      return res;
    },
    'global',
    '更新员工'
  );
};

export const resetPassword = async (id: string) => {
  return new Promise((resolve, reject) => {
    Confirm.warning(
      '确定要重置该员工的密码吗？重置后需要通知员工使用新密码登录。',
      async () => {
        try {
          const result = await withLoadingAndError(
            async () => {
              const res = await api.resetUserPassword(id);
              logActivity(`系统 重置了员工密码 (工号: ${id})`);
              await import('../index').then(m => m.loadAllData());
              return res;
            },
            'global',
            '重置密码'
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteEmployee = async (id: string) => {
  return new Promise((resolve, reject) => {
    Confirm.delete(
      '该员工',
      async () => {
        try {
          const result = await withLoadingAndError(
            async () => {
              const res = await api.deleteUser(id);
              logActivity(`系统 删除了员工 (工号: ${id})`);
              await import('../index').then(m => m.loadAllData());
              return res;
            },
            'global',
            '删除员工'
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};
