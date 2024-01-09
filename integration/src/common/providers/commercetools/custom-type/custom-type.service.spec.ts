import { Test, TestingModule } from '@nestjs/testing';
import { CustomTypeService } from './custom-type.service';
import { Commercetools } from '../commercetools.provider';
import { CartTypeDefinition } from './cart-type-definition';
import { ConfigService } from '@nestjs/config';

describe('CustomTypeService', () => {
  let service: CustomTypeService;
  let commercetools: jest.Mocked<Commercetools>;
  let postExecuteMock: jest.Mock;
  let getExecuteMock: jest.Mock;
  let postWithKeyExecuteMock: jest.Mock;
  let getWithKeyExecuteMock: jest.Mock;

  beforeEach(async () => {
    getExecuteMock = jest.fn();
    postExecuteMock = jest.fn();
    getWithKeyExecuteMock = jest.fn();
    postWithKeyExecuteMock = jest.fn();

    const mockCommercetools = {
      getApiRoot: jest.fn().mockReturnThis(),
      types: () => ({
        get: () => ({
          execute: getExecuteMock,
        }),
        withKey: () => ({
          get: () => ({
            execute: getWithKeyExecuteMock,
          }),
          post: () => ({
            execute: postWithKeyExecuteMock,
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
        { provide: Commercetools, useValue: mockCommercetools },
        CartTypeDefinition,
        {
          provide: 'TypeDefinitions',
          useFactory: (cartTypeDefinition) => [cartTypeDefinition],
          inject: [CartTypeDefinition],
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<CustomTypeService>(CustomTypeService);
    commercetools = module.get<Commercetools>(
      Commercetools,
    ) as jest.Mocked<Commercetools>;
  });

  it('should create cart type when not found', async () => {
    getWithKeyExecuteMock.mockRejectedValue({ statusCode: 201, body: {} });
    postExecuteMock.mockResolvedValue({
      statusCode: 201,
      body: {},
    });

    const result = await service.createUpdateAllTypes();

    expect(result).toEqual(undefined);
    expect(getWithKeyExecuteMock).toHaveBeenCalled();
    expect(postExecuteMock).toHaveBeenCalled();
  });

  it('should throw error when cart type is not found and fails to be created', async () => {
    getWithKeyExecuteMock.mockRejectedValue({ statusCode: 201, body: {} });
    postExecuteMock.mockResolvedValue({
      statusCode: 400,
      body: {},
    });

    await expect(service.createUpdateAllTypes()).rejects.toThrow();
    expect(getWithKeyExecuteMock).toHaveBeenCalled();
    expect(postExecuteMock).toHaveBeenCalled();
  });

  it('should update all cart types when at least one already exists', async () => {
    getWithKeyExecuteMock.mockResolvedValue({
      body: {
        key: 'cartType',
        version: 1,
        fieldDefinitions: [
          {
            name: 'eagleeye-fieldToBeRemoved',
          },
        ],
      },
    });

    const updatedTypeMock = {
      statusCode: 200,
      body: {
        key: 'cartType',
        fieldDefinitions: [
          {
            name: 'eagleeye-fieldToBeAdded',
            label: {
              en: 'eagleeye-fieldToBeAdded',
            },
            type: {
              name: 'Set',
              elementType: { name: 'String' },
            },
            required: false,
          },
        ],
      },
    };
    postWithKeyExecuteMock.mockResolvedValue(updatedTypeMock);

    const result = await service.createUpdateAllTypes();

    expect(result).toEqual(undefined);
    expect(getWithKeyExecuteMock).toHaveBeenCalled();
    expect(postWithKeyExecuteMock).toHaveBeenCalled();
  });

  it('should throw error when cart type creation fails', async () => {
    getWithKeyExecuteMock.mockResolvedValue({
      body: {
        key: 'cartType',
        version: 1,
        fieldDefinitions: [
          {
            name: 'eagleeye-fieldToBeRemoved',
          },
        ],
      },
    });
    postWithKeyExecuteMock.mockResolvedValue({
      statusCode: 400,
      body: {},
    });

    await expect(service.createUpdateAllTypes()).rejects.toThrow();
    expect(postWithKeyExecuteMock).toHaveBeenCalled();
    expect(commercetools.getApiRoot).toHaveBeenCalled();
  });

  it('should throw error when cart type update fails', async () => {
    getWithKeyExecuteMock.mockResolvedValue({
      body: {
        key: 'cartType',
        version: 1,
        fieldDefinitions: [
          {
            name: 'eagleeye-fieldToBeRemoved',
          },
        ],
      },
    });

    postWithKeyExecuteMock.mockResolvedValue({
      statusCode: 400,
      body: {},
    });

    await expect(service.createUpdateAllTypes()).rejects.toThrow();
    expect(postWithKeyExecuteMock).toHaveBeenCalled();
    expect(commercetools.getApiRoot).toHaveBeenCalled();
  });
});
