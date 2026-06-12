export const getRetryDelay = (retryCount: number) => {
  const delays = [5000, 15000, 30000, 60000, 300000];

  return delays[retryCount - 1] || 300000;
};