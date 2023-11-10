import { Test, TestingModule } from '@nestjs/testing';
import { EagleEye } from './eagleeye.provider';

describe('EagleEye', () => {
  let eagleEye: EagleEye;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EagleEye],
    }).compile();

    eagleEye = module.get<EagleEye>(EagleEye);
    fetchMock.doMock();
  });

  it('should make EagleEye request', async () => {
    const url = 'https://example.com';
    const method = 'POST';
    const body = { data: 'example' };
    const options = { headers: { 'Content-Type': 'application/json' } };

    const loggerSpy = jest.spyOn(eagleEye['logger'], 'log');
    fetchMock.mockResponseOnce(JSON.stringify({ result: 'success' }));

    await eagleEye.makeEagleEyeRequest(url, method, body, options);

    expect(fetchMock).toHaveBeenCalledWith(url, {
      method,
      body: JSON.stringify(body),
      options,
      retryDelay: expect.any(Function),
      retryOn: [429, 503],
    });
    expect(loggerSpy).toHaveBeenCalledWith({ result: 'success' });
  });

  it('should handle error when making EagleEye request', async () => {
    const url = 'https://example.com';
    const method = 'POST';
    const body = { data: 'example' };
    const options = { headers: { 'Content-Type': 'application/json' } };

    const loggerSpy = jest.spyOn(eagleEye['logger'], 'error');
    fetchMock.mockImplementation(() => {
      throw 'Error';
    });

    await eagleEye.makeEagleEyeRequest(url, method, body, options);

    expect(fetchMock).toHaveBeenCalledWith(url, {
      method,
      body: JSON.stringify(body),
      options,
      retryDelay: expect.any(Function),
      retryOn: [429, 503],
    });
    expect(loggerSpy).toHaveBeenCalledWith('Error');
  });
});
