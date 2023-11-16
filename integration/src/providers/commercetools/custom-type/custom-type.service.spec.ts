import { Test, TestingModule } from '@nestjs/testing';
import { CustomTypeService } from './custom-type.service';
import { Commercetools } from '../commercetools.provider';
import { TypeDraft } from '@commercetools/platform-sdk';

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
