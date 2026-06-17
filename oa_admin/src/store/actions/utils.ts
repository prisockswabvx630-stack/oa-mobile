import { store } from '../index';
import { Loading } from '../loading';
import { errorHandler } from '../../utils/errorHandler';

export const logActivity = (text: string) => {
  store.activities.unshift({
    id: Date.now(),
    text,
    time: "刚刚"
  });
  if (store.activities.length > 10) {
    store.activities.pop();
  }
};

export const formatDate = (d: string | Date | null | undefined): string => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (d: string | Date | null | undefined): string => {
  if (!d) return '--:--';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toTimeString().slice(0, 5);
};

export const withLoading = async <T>(
  fn: () => Promise<T>,
  loadingKey: string = 'global'
): Promise<T> => {
  return Loading.wrap(fn(), loadingKey);
};

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

export const withLoadingAndError = async <T>(
  fn: () => Promise<T>,
  loadingKey: string = 'global',
  errorContext?: string
): Promise<T | null> => {
  return withLoading(
    () => withErrorHandling(fn, errorContext),
    loadingKey
  );
};
