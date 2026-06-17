import { getCurrentUser } from '../api/session';

export type PermissionCode = string;

export interface PermissionOptions {
  mode?: 'all' | 'some';
}

export const Permission = {
  has(code: PermissionCode | PermissionCode[], options: PermissionOptions = {}): boolean {
    const { mode = 'some' } = options;
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return false;
    }

    // 管理员拥有所有权限
    if (currentUser.role === '超级管理员' || currentUser.username === 'admin') {
      return true;
    }

    const codes = Array.isArray(code) ? code : [code];
    const userPermissions = currentUser.permissions || [];

    if (mode === 'all') {
      return codes.every(c => userPermissions.includes(c));
    }

    return codes.some(c => userPermissions.includes(c));
  },

  check(code: PermissionCode | PermissionCode[], options: PermissionOptions = {}): boolean {
    return this.has(code, options);
  },

  require(code: PermissionCode | PermissionCode[], action?: string): void {
    if (!this.has(code)) {
      const actionText = action || '执行此操作';
      throw new Error(`权限不足：您没有权限${actionText}`);
    }
  },

  requireAny(codes: PermissionCode[], action?: string): void {
    if (!this.has(codes, { mode: 'some' })) {
      const actionText = action || '执行此操作';
      throw new Error(`权限不足：您没有权限${actionText}`);
    }
  },

  requireAll(codes: PermissionCode[], action?: string): void {
    if (!this.has(codes, { mode: 'all' })) {
      const actionText = action || '执行此操作';
      throw new Error(`权限不足：您没有权限${actionText}`);
    }
  }
};

// 权限Hook
export const usePermission = () => {
  return {
    has: Permission.has.bind(Permission),
    check: Permission.check.bind(Permission),
    require: Permission.require.bind(Permission),
    requireAny: Permission.requireAny.bind(Permission),
    requireAll: Permission.requireAll.bind(Permission)
  };
};
