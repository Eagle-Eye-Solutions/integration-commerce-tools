import { Test, TestingModule } from '@nestjs/testing';
import { BasketCleanupService } from './basket-cleanup.service';
import { CustomObjectService } from '../../../common/providers/commercetools/custom-object/custom-object.service';
import { ConfigService } from '@nestjs/config';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../../../common/constants/constants';

class CustomObjectServiceMock {
  queryCustomObjects = jest.fn();
  deleteCustomObject = jest.fn();
}

describe('BasketCleanupService', () => {
  let service: BasketCleanupService;
  let customObjectService: CustomObjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasketCleanupService,
        { provide: CustomObjectService, useClass: CustomObjectServiceMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((Key: string, DefaultValue: string) => {
              switch (Key) {
                case 'storedBasketCleanup.objectQueryLimit':
                  return 10;
                  break;
                case 'storedBasketCleanup.olderThanValue':
                  return 7;
                  break;
                case 'storedBasketCleanup.olderThanUnit':
                  return 'days';
                  break;
                default:
                  return DefaultValue;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BasketCleanupService>(BasketCleanupService);
    customObjectService = module.get<CustomObjectService>(CustomObjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should clear old baskets', async () => {
    const customObjectServiceMock =
      customObjectService as jest.Mocked<CustomObjectService>;

    const customObjects = {
      body: {
        count: 5,
        results: [
          { key: 'basket1', lastModifiedAt: '2022-01-01' },
          { key: 'basket2', lastModifiedAt: '2022-01-02' },
          { key: 'basket3', lastModifiedAt: '2022-01-03' },
          { key: 'basket4', lastModifiedAt: '2022-01-04' },
          { key: 'basket5', lastModifiedAt: '2022-01-05' },
        ],
      },
    };
    customObjectServiceMock.queryCustomObjects.mockResolvedValueOnce(
      customObjects as any,
    );

    await service.clearOldBaskets();

    expect(customObjectServiceMock.queryCustomObjects).toHaveBeenCalledWith({
      queryArgs: {
        withTotal: false,
        limit: 10,
        container: CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        offset: 0,
        where: expect.any(String),
        sort: ['lastModifiedAt asc'],
      },
    });
    expect(customObjectServiceMock.deleteCustomObject).toHaveBeenCalledTimes(5);
    expect(customObjectServiceMock.deleteCustomObject).toHaveBeenLastCalledWith(
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      'basket5',
    );
  });
});
