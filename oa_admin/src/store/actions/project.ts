import * as api from '../../api';
import { store } from '../index';
import { logActivity, withLoadingAndError } from './utils';
import { Validator, CommonRules } from '../../utils/validator';
import { Confirm } from '../../utils/confirm';
import type { Project } from '../types';

export const addProject = async (proj: Omit<Project, 'id' | 'taskCount'>) => {
  // 数据验证
  const validation = Validator.validateAll(proj, {
    name: [CommonRules.required('请输入项目名称')],
    owner: [CommonRules.required('请选择项目负责人')]
  });

  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  return withLoadingAndError(
    async () => {
      const res = await api.createProject({
        name: proj.name,
        owner: proj.owner,
        dept: proj.dept,
        startDate: proj.startDate,
        endDate: proj.endDate,
        progress: proj.progress,
        status: proj.status,
        description: proj.description || '',
        priority: proj.priority
      });
      logActivity(`系统 创建了新项目: ${proj.name}`);
      await import('../index').then(m => m.loadAllData());
      return res;
    },
    'global',
    '创建项目'
  );
};

export const updateProject = async (id: number, updatedFields: Partial<Project>) => {
  return withLoadingAndError(
    async () => {
      const payload: any = {};
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.owner !== undefined) payload.owner = updatedFields.owner;
      if (updatedFields.dept !== undefined) payload.dept = updatedFields.dept;
      if (updatedFields.startDate !== undefined) payload.startDate = updatedFields.startDate;
      if (updatedFields.endDate !== undefined) payload.endDate = updatedFields.endDate;
      if (updatedFields.progress !== undefined) payload.progress = updatedFields.progress;
      if (updatedFields.status !== undefined) payload.status = updatedFields.status;
      if (updatedFields.description !== undefined) payload.description = updatedFields.description;
      if (updatedFields.priority !== undefined) payload.priority = updatedFields.priority;
      const res = await api.updateProject(id, payload);
      logActivity(`系统 更新了项目信息 (项目ID: ${id})`);
      await import('../index').then(m => m.loadAllData());
      return res;
    },
    'global',
    '更新项目'
  );
};

export const deleteProject = async (id: number) => {
  return new Promise((resolve, reject) => {
    Confirm.delete(
      '该项目',
      async () => {
        try {
          const result = await withLoadingAndError(
            async () => {
              const res = await api.deleteProject(id);
              logActivity(`系统 删除了项目ID: ${id}`);
              await import('../index').then(m => m.loadAllData());
              return res;
            },
            'global',
            '删除项目'
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};
