import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { ApprovalItem } from '../types';

export const addApproval = async (approval: Omit<ApprovalItem, 'id' | 'time' | 'status' | 'reject_reason' | 'cancel_reason' | 'approved_time'>) => {
  try {
    const res = await api.createApproval({
      type: approval.type,
      title: approval.title,
      content: approval.content || '',
      applicant_name: approval.applicant,
      dept_name: approval.dept,
      status: '待审批'
    });
    logActivity(`系统 新增了审批申请: ${approval.title}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增审批失败:', error);
    throw error;
  }
};

export const updateApproval = async (id: string, fields: Partial<ApprovalItem> & { reject_reason?: string }) => {
  try {
    const payload: any = {};
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.reject_reason !== undefined) payload.reject_reason = fields.reject_reason;
    const res = await api.updateApproval(id, payload);
    logActivity(`系统 更新了审批ID/单号: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新审批失败:', error);
    throw error;
  }
};

export const deleteApprovalAction = async (id: string) => {
  try {
    const res = await api.deleteApproval(id);
    logActivity(`系统 删除了审批单: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除审批失败:', error);
    throw error;
  }
};

export const cancelApproval = async (id: string, reason?: string) => {
  try {
    const res = await api.cancelApproval(id, reason);
    logActivity(`系统 撤回了审批单: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('撤回审批失败:', error);
    throw error;
  }
};
