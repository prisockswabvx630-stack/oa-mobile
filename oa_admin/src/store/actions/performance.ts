import { store } from '../index';
import { logActivity } from './utils';
import type { Performance } from '../types';

export const updatePerformance = (empId: string, fields: Partial<Performance>) => {
  const index = store.performance.findIndex(p => p.empId === empId);
  if (index !== -1) {
    const original = store.performance[index];
    const work = fields.workScore !== undefined ? fields.workScore : original.workScore;
    const attitude = fields.attitudeScore !== undefined ? fields.attitudeScore : original.attitudeScore;
    const teamwork = fields.teamworkScore !== undefined ? fields.teamworkScore : original.teamworkScore;
    const total = Math.round((work + attitude + teamwork) / 3);
    let grade = 'C';
    if (total >= 90) grade = 'A';
    else if (total >= 80) grade = 'B';
    else if (total >= 60) grade = 'C';
    else grade = 'D';

    store.performance[index] = {
      ...original,
      workScore: work,
      attitudeScore: attitude,
      teamworkScore: teamwork,
      totalScore: total,
      grade
    };
    logActivity(`系统 更新了员工绩效 (工号: ${empId})`);
  }
};
