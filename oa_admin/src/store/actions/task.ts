import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { TaskItem } from '../types';

export const addTask = async (task: Omit<TaskItem, 'id' | 'status'>) => {
  try {
    const res = await api.createTask({
      title: task.name,
      description: task.description || '',
      project_name: task.project,
      assignee_name: task.owner,
      priority: task.priority,
      due_date: task.deadline,
      progress: task.progress,
      status: task.progress === 100 ? '已完成' : (task.progress > 0 ? '进行中' : '待开始')
    });
    logActivity(`系统 新增了任务: ${task.name}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增任务失败:', error);
    throw error;
  }
};

export const updateTask = async (id: number, fields: Partial<TaskItem>) => {
  try {
    const payload: any = {};
    if (fields.name !== undefined) payload.title = fields.name;
    if (fields.description !== undefined) payload.description = fields.description;
    if (fields.project !== undefined) payload.project_name = fields.project;
    if (fields.owner !== undefined) payload.assignee_name = fields.owner;
    if (fields.priority !== undefined) payload.priority = fields.priority;
    if (fields.deadline !== undefined) payload.due_date = fields.deadline;
    if (fields.progress !== undefined) {
      payload.progress = fields.progress;
      payload.status = fields.progress === 100 ? '已完成' : (fields.progress > 0 ? '进行中' : '待开始');
    }
    const res = await api.updateTask(id, payload);
    logActivity(`系统 更新了任务ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新任务失败:', error);
    throw error;
  }
};

export const deleteTask = async (id: number) => {
  try {
    const res = await api.deleteTask(id);
    logActivity(`系统 删除了任务ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除任务失败:', error);
    throw error;
  }
};

export const completeTask = async (id: number) => {
  try {
    const res = await api.completeTask(id);
    logActivity(`系统 完成了任务ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('完成任务失败:', error);
    throw error;
  }
};

export const assignTask = async (id: number, assigneeName: string) => {
  try {
    const res = await api.assignTask(id, { assigneeName });
    logActivity(`系统 重新分配了任务ID: ${id} 给 ${assigneeName}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('分配任务失败:', error);
    throw error;
  }
};
