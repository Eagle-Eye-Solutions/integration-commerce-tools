import { Test, TestingModule } from '@nestjs/testing';
import { CustomTypeService } from './custom-type.service';
import { Commercetools } from '../commercetools.provider';
import { TypeDraft } from '@commercetools/platform-sdk';

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

    getExecuteMock.mockResolvedValue({ body: { results: [] } });
    postExecuteMock.mockResolvedValue({
      statusCode: 201,
      body: typeDefinition,
    });

    const result = await service.create(typeDefinition);

    expect(result).toEqual(typeDefinition);
    expect(getExecuteMock).toHaveBeenCalled();
    expect(postExecuteMock).toHaveBeenCalled();
  });

  it('should update all cart types when at least one already exists', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
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
    };

    getExecuteMock.mockResolvedValue({
      body: {
        results: [
          {
            key: 'cartType',
            version: 1,
            fieldDefinitions: [
              {
                name: 'eagleeye-fieldToBeRemoved',
              },
            ],
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

    const result = await service.create(typeDefinition);

    expect(result).toEqual([updatedTypeMock.body]);
    expect(getExecuteMock).toHaveBeenCalled();
    expect(postWithKeyExecuteMock).toHaveBeenCalled();
  });

  it('should throw error when cart type creation fails', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
      fieldDefinitions: [],
    };

    getExecuteMock.mockResolvedValue({ body: { results: [] } });
    postExecuteMock.mockResolvedValue({
      statusCode: 400,
      body: typeDefinition,
    });

    await expect(service.create(typeDefinition)).rejects.toThrow();
    expect(postExecuteMock).toHaveBeenCalled();
    expect(commercetools.getApiRoot).toHaveBeenCalled();
  });

  it('should throw error when cart type update fails', async () => {
    const typeDefinition: TypeDraft = {
      resourceTypeIds: [],
      key: 'cartType',
      name: { en: 'Cart Type' },
      description: { en: 'Description' },
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
    };

    getExecuteMock.mockResolvedValue({
      body: {
        results: [
          {
            key: 'cartType',
            version: 1,
            fieldDefinitions: [
              {
                name: 'eagleeye-fieldToBeRemoved',
              },
            ],
          },
        ],
      },
    });

    postWithKeyExecuteMock.mockResolvedValue({
      statusCode: 400,
      body: {},
    });

    await expect(service.create(typeDefinition)).rejects.toThrow();
    expect(postWithKeyExecuteMock).toHaveBeenCalled();
    expect(commercetools.getApiRoot).toHaveBeenCalled();
  });
});
