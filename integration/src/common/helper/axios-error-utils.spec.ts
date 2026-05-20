import axios, { AxiosError, AxiosHeaders } from 'axios';
import { getAxiosHttpStatus } from './axios-error-utils';

describe('getAxiosHttpStatus', () => {
  it('returns response.status for AxiosError with response', () => {
    const err = new AxiosError(
      'msg',
      'ERR',
      {} as any,
      {},
      {
        status: 404,
        data: {},
        statusText: 'Not Found',
        headers: new AxiosHeaders(),
        config: {} as any,
      },
    );
    expect(axios.isAxiosError(err)).toBe(true);
    expect(getAxiosHttpStatus(err)).toBe(404);
  });

  it('returns err.status when response is absent (Axios 1.15+)', () => {
    const err = new AxiosError();
    err.status = 404;
    err.response = undefined;
    expect(axios.isAxiosError(err)).toBe(true);
    expect(getAxiosHttpStatus(err)).toBe(404);
  });

  it('prefers response.status over err.status on AxiosError', () => {
    const err = new AxiosError();
    err.status = 500;
    err.response = {
      status: 404,
      data: {},
      statusText: '',
      headers: new AxiosHeaders(),
      config: {} as any,
    };
    expect(getAxiosHttpStatus(err)).toBe(404);
  });

  it('returns status from non-Axios { response: { status } }', () => {
    expect(getAxiosHttpStatus({ response: { status: 400 } })).toBe(400);
  });

  it('returns top-level status from non-Axios when response has no status', () => {
    expect(
      getAxiosHttpStatus({ response: undefined, status: 502 } as any),
    ).toBe(502);
  });

  it('returns undefined when no status is available', () => {
    expect(getAxiosHttpStatus(new Error('x'))).toBeUndefined();
  });
});
