import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'oa_user_session';

let currentUser: any = null;

export const getCurrentUser = () => currentUser;

export const setCurrentUser = async (user: any) => {
  currentUser = user;
  try {
    if (user) {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch (error) {
    console.warn('[Session] 持久化存储失败:', error);
  }
};

export const restoreSession = async (): Promise<any | null> => {
  try {
    const data = await SecureStore.getItemAsync(SESSION_KEY);
    if (data) {
      currentUser = JSON.parse(data);
      return currentUser;
    }
  } catch (error) {
    console.warn('[Session] 恢复会话失败:', error);
  }
  return null;
};

export const clearSession = async () => {
  currentUser = null;
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.warn('[Session] 清除会话失败:', error);
  }
};

let salaryLockEnabled = true;
export const isSalaryLockEnabled = () => salaryLockEnabled;
export const setSalaryLockEnabled = (val: boolean) => {
  salaryLockEnabled = val;
};
