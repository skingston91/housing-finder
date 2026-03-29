/** Limits how many async tasks run at once (simple queue; no deps). */
export type AsyncLimiter = <T>(fn: () => Promise<T>) => Promise<T>;

export const createAsyncLimiter = (concurrency: number): AsyncLimiter => {
  if (concurrency < 1 || !Number.isFinite(concurrency)) {
    throw new Error('concurrency must be a finite number >= 1');
  }
  let active = 0;
  const queue: (() => void)[] = [];

  const pump = (): void => {
    while (active < concurrency && queue.length > 0) {
      const run = queue.shift();
      if (run) {
        run();
      }
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = (): void => {
        active++;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            pump();
          });
      };
      if (active < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
};
