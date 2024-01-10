import { Test, TestingModule } from '@nestjs/testing';
import { SettleMapper } from './settle.mapper';
import { ConfigService } from '@nestjs/config';
import { BASKET_STORE_SERVICE } from '../../common/services/basket-store/basket-store.provider';
import { BasketStoreService } from '../../common/services/basket-store/basket-store.interface';

describe('CTCartToEEBasketMapper', () => {
  let service: SettleMapper;
  let configService: ConfigService;
  let basketStoreService: jest.Mocked<BasketStoreService>;

  const shippingMethodMapMock = [{ key: 'standard-key', upc: '245879' }];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettleMapper,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: BASKET_STORE_SERVICE,
          useValue: {
            save: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            isEnabled: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SettleMapper>(SettleMapper);
    configService = module.get<ConfigService>(ConfigService);
    basketStoreService = module.get(BASKET_STORE_SERVICE);
    jest.spyOn(configService, 'get').mockReturnValueOnce(shippingMethodMapMock);
    jest.resetAllMocks();
  });

  describe('mapOrderToWalletSettlePayload', () => {
    it('should return the payload for /wallet/settle', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      jest.spyOn(basketStoreService, 'get').mockResolvedValueOnce({
        enrichedBasket: {
          contents: [],
        },
      });

      const payload = await service.mapOrderToWalletSettlePayload({
        id: '123456',
        cart: {
          typeId: 'cart',
          id: '12345678',
        },
        custom: {
          fields: {},
        },
      } as any);

      expect(payload).toMatchSnapshot();
    });

    it('should include eagleeye-identityValue for /wallet/settle when available', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      jest.spyOn(basketStoreService, 'get').mockResolvedValueOnce({
        enrichedBasket: {
          contents: [],
        },
      });

      const payload = await service.mapOrderToWalletSettlePayload({
        id: '123456',
        cart: {
          typeId: 'cart',
          id: '12345678',
        },
        custom: {
          fields: {
            'eagleeye-identityValue': 'some-identity',
          },
        },
      } as any);

      expect(payload).toMatchSnapshot();
    });
  });
});
