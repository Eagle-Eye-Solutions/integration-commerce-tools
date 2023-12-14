export const isRejected = (
  input: PromiseSettledResult<unknown>,
): input is PromiseRejectedResult => input?.status === 'rejected';

export const isFulfilled = <T>(
  input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> => input?.status === 'fulfilled';

export const isRateLimited = (
  input: PromiseSettledResult<unknown>,
): input is PromiseRejectedResult =>
  input?.status === 'rejected' && input?.reason?.response?.status === 429;
