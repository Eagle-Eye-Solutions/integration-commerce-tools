import { sleep } from './timeout';

jest.useFakeTimers();

describe('sleep', () => {
  it('should resolve after the specified time', () => {
    const promise = sleep(200);

    jest.advanceTimersByTime(200);

    return expect(promise).resolves.toBeUndefined();
  });
});
