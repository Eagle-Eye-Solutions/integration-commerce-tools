import { Test } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';

describe('LoyaltyService', () => {
  let loyaltyService: LoyaltyService;
  let cartToBasketMapper: CTCartToEEBasketMapper;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: CTCartToEEBasketMapper,
          useValue: {
            mapAdjustedBasketToBasketEarn: jest.fn(),
            mapAdjustedBasketToBasketCredits: jest.fn(),
          },
        },
      ],
    }).compile();

    loyaltyService = moduleRef.get<LoyaltyService>(LoyaltyService);
    cartToBasketMapper = moduleRef.get<CTCartToEEBasketMapper>(
      CTCartToEEBasketMapper,
    );
  });

  describe('getEarnAndCredits', () => {
    it('should return default earnAndCredits object if no points are adjudicated', async () => {
      const walletOpenResponse = {
        data: {
          analyseBasketResults: {
            basket: {
              summary: {
                adjudicationResults: [],
              },
            },
          },
        },
      };

      const result = await loyaltyService.getEarnAndCredits(walletOpenResponse);

      expect(result).toEqual({
        earn: {
          basket: {
            balance: 0,
            offers: [],
          },
        },
        credit: {
          basket: {
            balance: 0,
            offers: [],
          },
          items: {
            balance: 0,
            offers: [],
          },
        },
      });
    });

    it('should return the proper earn if points are adjudicated', async () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-1',
              success: null,
              type: 'earn',
              value: null,
              balances: {
                current: 400,
              },
            },
          ],
        },
      };
      const walletOpenResponse = {
        data: {
          analyseBasketResults: {
            basket,
          },
        },
      };

      const getBasketLevelEarnSpy = jest.spyOn(
        loyaltyService,
        'getBasketLevelEarn',
      );

      await loyaltyService.getEarnAndCredits(walletOpenResponse);

      expect(getBasketLevelEarnSpy).toHaveBeenCalledWith(basket);
    });
  });

  describe('getBasketLevelEarn', () => {
    it('should return baseEarn if adjudicationResults exist', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-1',
              success: null,
              type: 'earn',
              value: null,
              balances: {
                current: 400,
              },
            },
          ],
        },
      };

      const baseEarn = {
        balance: 100,
        offers: [],
      };
      jest
        .spyOn(cartToBasketMapper, 'mapAdjustedBasketToBasketEarn')
        .mockReturnValue(baseEarn);

      const result = loyaltyService.getBasketLevelEarn(basket);

      expect(result).toEqual(baseEarn);
    });

    it('should return default data if adjudicationResults do not exist', () => {
      const basket = {
        summary: {
          adjudicationResults: [],
        },
      };

      const result = loyaltyService.getBasketLevelEarn(basket);

      expect(result).toEqual({ balance: 0, offers: [] });
    });
  });

  describe('getBasketLevelCredits', () => {
    it('should return credits if present and adjudicationResults exist', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                current: 400,
              },
            },
          ],
        },
      };
      const accounts = [
        {
          campaign: {
            campaignId: '1653843',
            campaignName: 'Test Campaign',
          },
        },
      ];

      const credits = {
        balance: 400,
        offers: [
          {
            name: 'Test Campaign',
            amount: 400,
          },
        ],
      };
      jest
        .spyOn(cartToBasketMapper, 'mapAdjustedBasketToBasketCredits')
        .mockReturnValue(credits);

      const result = loyaltyService.getBasketLevelCredits(basket, accounts);

      expect(result).toEqual(credits);
    });

    it('should return default data if adjudicationResults do not exist', () => {
      const basket = {
        summary: {
          adjudicationResults: [],
        },
      };
      const accounts = [];

      const result = loyaltyService.getBasketLevelCredits(basket, accounts);

      expect(result).toEqual({ balance: 0, offers: [] });
    });
  });
});
