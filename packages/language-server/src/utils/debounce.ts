export interface AsyncDebounce {
  (): void;
  cancel(): void;
}

export function createAsyncDebounce(
  callback: () => Promise<void>,
  timeout: number,
): AsyncDebounce {
  let id: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => clearTimeout(id);

  let scheduled = false;
  let result = Promise.resolve();

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;

    result.then(() => {
      setTimeout(() => {
        scheduled = false;
        result = callback();
      }, timeout);
    });
  };

  return Object.assign(schedule, { cancel });
}
