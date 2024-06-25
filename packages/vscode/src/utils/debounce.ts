import Deferred from "./deferred.js";

export function createDebounceAsync<T>(
  callback: () => Promise<T>,
  wait: number,
): () => Promise<T> {
  let isRunning = false;
  let timeout: NodeJS.Timeout | undefined;
  let deferred = new Deferred<T>();

  const procrastinate = () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      isRunning = true;
      try {
        const value = await callback();
        deferred.resolve(value);
      } catch (reason) {
        deferred.reject(reason);
      } finally {
        isRunning = false;
        deferred = new Deferred();
      }
    }, wait);
  };

  return () => {
    if (!isRunning) {
      procrastinate();
    }
    return deferred.promise;
  };
}
