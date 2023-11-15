import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EagleEyeApiClient, Wallet, Token } from './eagleeye.provider';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { EagleEyeApiException } from '../../common/exceptions/eagle-eye-api.exception';

describe('Wallet', () => {
  let service: Wallet;
  let httpService: HttpService;
  let configService: ConfigService;

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
    configService = module.get<ConfigService>(ConfigService);
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
    const result = await service.callApi({ test: 'test' });
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
    // jest.spyOn(configService, 'get').mockImplementation((property) => {
    //   return property;
    // });

    const result = service.getAuthenticationHash(requestUrl, requestBody);
    const expectedHash =
      '08d6b7cb6efd8abaa6d8a77e72b86a35ef5cda53e08632cbaf20c2ce327250ca'; // replace with the expected hash

    expect(result).toEqual(expectedHash);
  });
});

describe('Token', () => {
  let service: Token;
  let httpService: HttpService;
  let configService: ConfigService;

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
    configService = module.get<ConfigService>(ConfigService);
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
    const result = await service.callApi({ test: 'test' });
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
    await expect(service.callApi({ test: 'test' })).rejects.toThrow(
      EagleEyeApiException,
    );
  });
});
