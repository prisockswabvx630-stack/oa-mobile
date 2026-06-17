export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: number;
  onRetry?: (error: any, attempt: number) => void;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(backoff, attempt);

        if (onRetry) {
          onRetry(error, attempt + 1);
        }

        console.warn(`请求失败，${waitTime}ms后进行第${attempt + 1}次重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

export const withRetryAndTimeout = async <T>(
  fn: () => Promise<T>,
  timeout: number = 10000,
  retryOptions: RetryOptions = {}
): Promise<T> => {
  const withTimeout = (promise: Promise<T>): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('请求超时')), timeout)
      )
    ]);
  };

  return withRetry(() => withTimeout(fn()), retryOptions);
};
