import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getCurrentUser } from './session';
import { errorHandler } from '../utils/errorHandler';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:3000/api`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = (hostUri as string).split(':')[0];
    if (host) {
      return `http://${host}:3000/api`;
    }
  }

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';
};

const BASE_URL = getBaseUrl();
console.log('API BASE_URL initialized to:', BASE_URL);

const getHeaders = (isGet = false) => {
  const headers: Record<string, string> = {};
  if (!isGet) {
    headers['Content-Type'] = 'application/json';
  }
  const currentUser = getCurrentUser();
  if (currentUser?.token) {
    headers['Authorization'] = `Bearer ${currentUser.token}`;
  }
  return headers;
};

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: number;
}

const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(backoff, attempt);
        console.warn(`请求失败，${waitTime}ms后进行第${attempt + 1}次重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

export const apiGet = async <T = any>(path: string, params?: Record<string, string | number>): Promise<T> => {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  return withRetry(async () => {
    const response = await fetch(url, {
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw { code: data.code, message: data.msg || data.error || '请求失败' };
  });
};

export const apiPost = async <T = any>(path: string, body?: any): Promise<T> => {
  const url = `${BASE_URL}${path}`;

  return withRetry(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw { code: data.code, message: data.msg || data.error || '请求失败' };
  });
};

export const apiPut = async <T = any>(path: string, body?: any): Promise<T> => {
  const url = `${BASE_URL}${path}`;

  return withRetry(async () => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw { code: data.code, message: data.msg || data.error || '请求失败' };
  });
};

export const apiDelete = async <T = any>(path: string): Promise<T> => {
  const url = `${BASE_URL}${path}`;

  return withRetry(async () => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw { code: data.code, message: data.msg || data.error || '请求失败' };
  });
};
