import { Test, TestingModule } from '@nestjs/testing';
import { CustomTypeService } from './custom-type.service';
import { Commercetools } from '../commercetools.provider';
import { TypeDraft } from '@commercetools/platform-sdk';
import { MockLogger } from '../../../../test/utils/mocks/MockLogger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('CustomTypeService', () => {
  let service: CustomTypeService;
  let commercetools: jest.Mocked<Commercetools>;
  let postExecuteMock: jest.Mock;
  let getExecuteMock: jest.Mock;

  beforeEach(async () => {
    getExecuteMock = jest.fn();
    postExecuteMock = jest.fn();

    const mockCommercetools = {
      getApiRoot: jest.fn().mockReturnThis(),
      types: () => ({
        withKey: () => ({
          get: () => ({
            execute: getExecuteMock,
          }),
        }),
        post: () => ({
          execute: postExecuteMock,
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomTypeService,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: new MockLogger() },
        { provide: Commercetools, useValue: mockCommercetools },
      ],
    }).compile();

    service = module.get<CustomTypeService>(CustomTypeService);
    commercetools = module.get<Commercetools>(
      Commercetools,
    ) as jest.Mocked<Commercetools>;
  });

  it('should create cart type', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
      fieldDefinitions: [],
    };

    getExecuteMock.mockResolvedValue({});
    postExecuteMock.mockResolvedValue({
      statusCode: 201,
      body: typeDefinition,
    });

    const result = await service.create(typeDefinition);

    expect(result).toEqual(typeDefinition);
    expect(getExecuteMock).toHaveBeenCalled();
    expect(postExecuteMock).toHaveBeenCalled();
  });

  it('should create cart type when get type throws error with 404 response code', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
      fieldDefinitions: [],
    };

    getExecuteMock.mockRejectedValue({ code: 404 });
    postExecuteMock.mockResolvedValue({
      statusCode: 201,
      body: typeDefinition,
    });

    const result = await service.create(typeDefinition);

    expect(result).toEqual(typeDefinition);
    expect(getExecuteMock).toHaveBeenCalled();
    expect(postExecuteMock).toHaveBeenCalled();
  });

  it('should throw error and not create any type when get type fails with non-404 error', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
      fieldDefinitions: [],
    };

    getExecuteMock.mockRejectedValue({ code: 401 });
    postExecuteMock.mockResolvedValue({
      statusCode: 201,
      body: typeDefinition,
    });

    await expect(service.create(typeDefinition)).rejects.toEqual({ code: 401 });

    expect(getExecuteMock).toHaveBeenCalled();
    expect(postExecuteMock).not.toHaveBeenCalled();
  });

  it('should not create cart type when already exists', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
      fieldDefinitions: [],
    };

    getExecuteMock.mockResolvedValue({
      body: {
        key: 'cartType',
      },
    });

    const result = await service.create(typeDefinition);

    expect(result).toEqual(undefined);
    expect(getExecuteMock).toHaveBeenCalled();
    expect(postExecuteMock).toHaveBeenCalledTimes(0);
  });

  it('should throw error when cart type creation fails', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
      fieldDefinitions: [],
    };

    postExecuteMock.mockResolvedValue({
      statusCode: 400,
      body: typeDefinition,
    });

    await expect(service.create(typeDefinition)).rejects.toThrow();
    expect(postExecuteMock).toHaveBeenCalled();
    expect(commercetools.getApiRoot).toHaveBeenCalled();
  });
});
