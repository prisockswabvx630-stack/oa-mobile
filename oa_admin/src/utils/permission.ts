import { store } from '../store';

export type PermissionCode = string;

export interface PermissionOptions {
  mode?: 'all' | 'some';
  fallback?: () => void;
}

export const Permission = {
  has(code: PermissionCode | PermissionCode[], options: PermissionOptions = {}): boolean {
    const { mode = 'some' } = options;

    // 管理员拥有所有权限
    if (store.userPermissions.roleCode === 'ROLE_ADMIN') {
      return true;
    }

    const codes = Array.isArray(code) ? code : [code];
    const userPermissions = store.userPermissions.permissions;

    if (mode === 'all') {
      return codes.every(c => userPermissions.includes(c));
    }

    return codes.some(c => userPermissions.includes(c));
  },

  check(code: PermissionCode | PermissionCode[], options: PermissionOptions = {}): boolean {
    const hasPermission = this.has(code, options);

    if (!hasPermission && options.fallback) {
      options.fallback();
    }

    return hasPermission;
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

// 权限指令
export const permissionDirective = {
  mounted(el: HTMLElement, binding: any) {
    const { value, arg } = binding;
    const mode = arg === 'all' ? 'all' : 'some';

    if (!Permission.has(value, { mode })) {
      el.parentNode?.removeChild(el);
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
