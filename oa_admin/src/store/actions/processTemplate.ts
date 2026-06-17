import * as api from '../../api';
import { withLoadingAndError } from './utils';

export const addProcessTemplate = async (data: any) => {
  return withLoadingAndError(
    async () => {
      const res = await api.createProcessTemplate(data);
      const { loadAllData } = await import('../index');
      await loadAllData();
      return res;
    },
    'global',
    '新增流程模板'
  );
};

export const updateProcessTemplate = async (id: string | number, data: any) => {
  return withLoadingAndError(
    async () => {
      const res = await api.updateProcessTemplate(id, data);
      const { loadAllData } = await import('../index');
      await loadAllData();
      return res;
    },
    'global',
    '更新流程模板'
  );
};

export const deleteProcessTemplate = async (id: string | number) => {
  return withLoadingAndError(
    async () => {
      const res = await api.deleteProcessTemplate(id);
      const { loadAllData } = await import('../index');
      await loadAllData();
      return res;
    },
    'global',
    '删除流程模板'
  );
};
