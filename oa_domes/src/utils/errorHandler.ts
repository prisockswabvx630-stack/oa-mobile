import { Alert } from 'react-native';

export interface AppError {
  code?: number;
  message: string;
  details?: any;
  timestamp?: Date;
}

class ErrorHandler {
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  handle(error: any, context?: string): AppError {
    const appError = this.normalize(error, context);
    this.log(appError);
    this.notify(appError);
    return appError;
  }

  private normalize(error: any, context?: string): AppError {
    let message = '未知错误';
    let code = 500;

    if (typeof error === 'string') {
      message = error;
    } else if (error?.response?.data) {
      const data = error.response.data;
      message = data.message || data.msg || data.error || '请求失败';
      code = data.code || error.response.status || 500;
    } else if (error?.message) {
      message = error.message;
    }

    if (context) {
      message = `[${context}] ${message}`;
    }

    return {
      code,
      message,
      details: error,
      timestamp: new Date()
    };
  }

  private log(error: AppError) {
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop();
    }
    console.error('[AppError]', error);
  }

  private notify(error: AppError) {
    if (error.code === 401) {
      Alert.alert('登录过期', '请重新登录');
    } else if (error.code === 403) {
      Alert.alert('权限不足', '您没有权限执行此操作');
    } else if (error.code === 404) {
      Alert.alert('未找到', '请求的资源不存在');
    } else if (error.code === 422) {
      Alert.alert('数据验证失败', error.message);
    } else if (error.code === 429) {
      Alert.alert('请求过于频繁', '请稍后再试');
    } else if (error.code && error.code >= 500) {
      Alert.alert('服务器错误', '服务器内部错误，请稍后再试');
    } else {
      Alert.alert('操作失败', error.message);
    }
  }

  getErrors(): AppError[] {
    return [...this.errorLog];
  }

  clearErrors() {
    this.errorLog = [];
  }
}

export const errorHandler = new ErrorHandler();

export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    errorHandler.handle(error, context);
    return null;
  }
};
