import * as api from '../../api';
import { store } from '../index';
import { logActivity } from './utils';
import type { ScheduleItem } from '../types';

export const addSchedule = async (schedule: Omit<ScheduleItem, 'id'>) => {
  try {
    const startStr = `${schedule.date} ${schedule.time}:00`;
    let durationMinutes = 60;
    if (schedule.duration) {
      const match = schedule.duration.match(/^(\d+(?:\.\d+)?)\s*(小时|分钟)$/);
      if (match) {
        const val = Number(match[1]);
        const unit = match[2];
        durationMinutes = unit === '小时' ? val * 60 : val;
      }
    }
    const startTime = new Date(startStr);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    const res = await api.createSchedule({
      title: schedule.title,
      description: schedule.title,
      start_time: startTime,
      end_time: endTime,
      location: schedule.location,
      type: schedule.color,
      attendees: schedule.attendees
    });
    logActivity(`系统 新增了日程: ${schedule.title}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('新增日程失败:', error);
    throw error;
  }
};

export const deleteSchedule = async (id: number) => {
  try {
    const res = await api.deleteSchedule(id);
    logActivity(`系统 删除了日程ID: ${id}`);
    await import('../index').then(m => m.loadAllData());
    return res;
  } catch (error) {
    console.error('删除日程失败:', error);
    throw error;
  }
};
