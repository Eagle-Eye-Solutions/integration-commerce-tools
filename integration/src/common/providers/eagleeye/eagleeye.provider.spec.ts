import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EagleEyeApiClient, Wallet } from './eagleeye.provider';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { EagleEyeApiException } from '../../exceptions/eagle-eye-api.exception';

describe('EagleEyeApiClient', () => {
  let eagleEyeApiClient: EagleEyeApiClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EagleEyeApiClient,
        Logger,
        ConfigService,
        { provide: HttpService, useValue: {} },
      ],
    }).compile();

    eagleEyeApiClient = module.get<EagleEyeApiClient>(EagleEyeApiClient);
  });

  it('should create an instance of EagleEyeApiClient', () => {
    expect(eagleEyeApiClient).toBeDefined();
    expect(eagleEyeApiClient.wallet).toBeDefined();
  });
});

describe('Wallet', () => {
  let service: Wallet;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Wallet,
        { provide: HttpService, useValue: { request: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<Wallet>(Wallet);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the /wallet/open with correct parameters', async () => {
    const mockResponse: AxiosResponse = {
      config: undefined,
      data: 'test',
      status: 200,
      statusText: 'OK',
      headers: {},
    };
    jest
      .spyOn(httpService, 'request')
      .mockImplementationOnce(() => of(mockResponse));
    const result = await service.invoke('open', { test: 'test' });
    expect(httpService.request).toHaveBeenCalledWith({
      url: expect.any(String),
      method: 'POST',
      data: JSON.stringify({ test: 'test' }),
      headers: expect.any(Object),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should throw EagleEyeApiException (EE_API_UNAVAILABLE) for unhandled error codes', async () => {
    const error = {
      request: { headers: {}, body: {} },
      response: { headers: {}, status: 500 },
    };
    jest.spyOn(httpService, 'request').mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.invoke('open', { test: 'test' })).rejects.toThrow(
      new EagleEyeApiException(
        'EE_API_UNAVAILABLE',
        'The request failed to be processed by the EE AIR Platform due to an unexpected error.',
      ),
    );
  });

  it('should throw EagleEyeApiException (EE_IDENTITY_NOT_FOUND) for 404 errors', async () => {
    const error = {
      request: { headers: {}, body: {} },
      response: { headers: {}, status: 404 },
    };
    jest.spyOn(httpService, 'request').mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.invoke('open', { test: 'test' })).rejects.toThrow(
      new EagleEyeApiException(
        'EE_IDENTITY_NOT_FOUND',
        "The customer identity doesn't exist in EE AIR Platform.",
      ),
    );
  });

  it('should throw EagleEyeApiException (EE_BAD_REQUEST) for 400 errors', async () => {
    const error = {
      request: { headers: {}, body: {} },
      response: { headers: {}, status: 400 },
    };
    jest.spyOn(httpService, 'request').mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.invoke('open', { test: 'test' })).rejects.toThrow(
      new EagleEyeApiException(
        'EE_BAD_REQUEST',
        'The request could not be processed by the EE AIR Platform.',
      ),
    );
  });

  it('should throw EagleEyeApiException (AXIOS_NO_RESPONSE_ERROR) for errors with no response', async () => {
    const error = {
      request: { headers: {}, body: {} },
    };
    jest.spyOn(httpService, 'request').mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.invoke('open', { test: 'test' })).rejects.toThrow(
      new EagleEyeApiException(
        'AXIOS_NO_RESPONSE_ERROR',
        'The request to EE AIR Platform failed but Axios did not include a response.',
      ),
    );
  });

  it('should throw EagleEyeApiException (EE_API_UNAVAILABLE) for other unknown errors', async () => {
    const error = {};
    jest.spyOn(httpService, 'request').mockImplementationOnce(() => {
      throw error;
    });

    await expect(service.invoke('open', { test: 'test' })).rejects.toThrow(
      new EagleEyeApiException(
        'EE_API_UNAVAILABLE',
        'The EE API is unavailable, the cart promotions and loyalty points are NOT updated.',
      ),
    );
  });

  it('should call the /wallet/settle with correct parameters', async () => {
    const mockResponse: AxiosResponse = {
      config: undefined,
      data: 'test',
      status: 200,
      statusText: 'OK',
      headers: {},
    };
    jest
      .spyOn(httpService, 'request')
      .mockImplementationOnce(() => of(mockResponse));
    const result = await service.invoke('settle', { test: 'test' });
    expect(httpService.request).toHaveBeenCalledWith({
      url: expect.any(String),
      method: 'POST',
      data: JSON.stringify({ test: 'test' }),
      headers: expect.any(Object),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should return a correct hash', () => {
    const requestUrl = 'testUrl';
    const requestBody = { key: 'value' };

    const result = service.getAuthenticationHash(requestUrl, requestBody);
    const expectedHash =
      '08d6b7cb6efd8abaa6d8a77e72b86a35ef5cda53e08632cbaf20c2ce327250ca';

    expect(result).toEqual(expectedHash);
  });

  describe('invoke', () => {
    it('should invoke a method', async () => {
      const methodName = 'getAuthenticationHash';
      const args = [1, 2, 3];

      const methodSpy = jest.spyOn(service, 'getAuthenticationHash');
      methodSpy.mockImplementationOnce(() => 'exampleReturnValue');

      const result = await service.invoke(methodName, ...args);

      expect(methodSpy).toHaveBeenCalledWith(...args);
      expect(result).toBe('exampleReturnValue');
    });

    it('should handle non-existent methods', async () => {
      const methodName = 'nonExistentMethod';
      const args = [1, 2, 3];

      let error;
      try {
        await service.invoke(methodName, ...args);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });
});
