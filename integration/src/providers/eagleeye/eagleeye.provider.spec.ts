import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Token, Wallet } from './eagleeye.provider';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { EagleEyeApiException } from '../../common/exceptions/eagle-eye-api.exception';

describe('Wallet', () => {
  let service: Wallet;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Wallet,
        { provide: HttpService, useValue: { request: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        Logger,
      ],
    }).compile();

    service = module.get<Wallet>(Wallet);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the API with correct parameters', async () => {
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
      url: 'https://pos.sandbox.uk.eagleeye.com/connect/wallet/open',
      method: 'POST',
      data: JSON.stringify({ test: 'test' }),
      headers: expect.any(Object),
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should return a correct hash', () => {
    const requestUrl = 'testUrl';
    const requestBody = { key: 'value' };

    const result = service.getAuthenticationHash(requestUrl, requestBody);
    const expectedHash =
      '08d6b7cb6efd8abaa6d8a77e72b86a35ef5cda53e08632cbaf20c2ce327250ca';

    expect(result).toEqual(expectedHash);
  });
});

describe('Token', () => {
  let service: Token;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Token,
        { provide: HttpService, useValue: { request: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        Logger,
      ],
    }).compile();

    service = module.get<Token>(Token);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the API with correct parameters', async () => {
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
    const result = await service.invoke('create', { test: 'test' });
    expect(httpService.request).toHaveBeenCalledWith({
      url: 'https://wallet.sandbox.uk.eagleeye.com/token/create',
      method: 'POST',
      data: JSON.stringify({ test: 'test' }),
      headers: expect.any(Object),
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should throw an error when the EE API request fails', async () => {
    jest
      .spyOn(httpService, 'request')
      .mockReturnValue(throwError(() => new Error()));
    await expect(service.invoke('create', { test: 'test' })).rejects.toThrow(
      EagleEyeApiException,
    );
  });
});
