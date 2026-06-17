import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { MeetingItem } from '../types';

export const addMeeting = async (meeting: Omit<MeetingItem, 'id' | 'organizer' | 'status'>) => {
  try {
    const userJson = localStorage.getItem('currentUser');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    const organizerName = currentUser?.real_name || '管理员';
    const res = await api.createMeeting({
      title: meeting.title,
      room_name: meeting.room,
      organizer_name: organizerName,
      start_time: meeting.startTime,
      end_time: meeting.endTime,
      attendees: meeting.attendees,
      status: '未开始'
    });
    logActivity(`系统 预约了会议: ${meeting.title}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增会议失败:', error);
    throw error;
  }
};

export const updateMeeting = async (id: number, fields: Partial<MeetingItem>) => {
  try {
    const payload: any = {};
    if (fields.title !== undefined) payload.title = fields.title;
    if (fields.room !== undefined) payload.room_name = fields.room;
    if (fields.startTime !== undefined) payload.start_time = fields.startTime;
    if (fields.endTime !== undefined) payload.end_time = fields.endTime;
    if (fields.attendees !== undefined) payload.attendees = fields.attendees;
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.minutes !== undefined) payload.minutes = fields.minutes;
    if (fields.externalMeetingUrl !== undefined) payload.external_meeting_url = fields.externalMeetingUrl;
    if (fields.externalMeetingId !== undefined) payload.external_meeting_id = fields.externalMeetingId;
    if (fields.externalPlatform !== undefined) payload.external_platform = fields.externalPlatform;
    const res = await api.updateMeeting(id, payload);
    logActivity(`系统 更新了会议ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('更新会议失败:', error);
    throw error;
  }
};

export const deleteMeeting = async (id: number) => {
  try {
    const res = await api.deleteMeeting(id);
    logActivity(`系统 删除了会议ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除会议失败:', error);
    throw error;
  }
};

export const syncMeetingToTencent = async (id: number) => {
  try {
    const res: any = await api.syncMeetingToTencent(id);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('同步腾讯会议失败:', error);
    throw error;
  }
};

export const syncMeetingToDingtalk = async (id: number) => {
  try {
    const res: any = await api.syncMeetingToDingtalk(id);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('同步钉钉会议失败:', error);
    throw error;
  }
};
