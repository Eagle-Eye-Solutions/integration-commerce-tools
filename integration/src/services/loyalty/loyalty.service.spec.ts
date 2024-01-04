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
            mapAdjustedBasketToItemCredits: jest.fn(),
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
              contents: [{}],
            },
          },
        },
      };

      const result = await loyaltyService.getEarnAndCredits(walletOpenResponse);

      expect(result).toEqual({
        earn: {
          basket: {
            total: 0,
          },
        },
        credit: {
          basket: {
            total: 0,
            offers: [],
          },
          items: {
            total: 0,
            offers: [],
          },
        },
      });
    });

    it('should return the proper earn/credits if points are adjudicated', async () => {
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
        contents: [
          {
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
        ],
      };
      const walletOpenResponse = {
        data: {
          analyseBasketResults: {
            basket,
          },
          accounts: [
            {
              campaign: {
                campaignId: '1653843',
                campaignName: 'Test Campaign',
              },
            },
          ],
        },
      };

      const basketEarn = {
        total: 400,
      };
      jest
        .spyOn(cartToBasketMapper, 'mapAdjustedBasketToBasketEarn')
        .mockReturnValue(basketEarn);
      const basketCredits = {
        total: 400,
        offers: [
          {
            name: 'Test Campaign',
            amount: 400,
          },
        ],
      };
      jest
        .spyOn(cartToBasketMapper, 'mapAdjustedBasketToBasketCredits')
        .mockReturnValue(basketCredits);
      const itemCredits = {
        total: 400,
        offers: [
          {
            name: 'Test Campaign',
            amount: 400,
          },
        ],
      };
      jest
        .spyOn(cartToBasketMapper, 'mapAdjustedBasketToItemCredits')
        .mockReturnValue(itemCredits);

      const result = await loyaltyService.getEarnAndCredits(walletOpenResponse);

      expect(result).toEqual({
        earn: {
          basket: {
            total: 400,
          },
        },
        credit: {
          basket: {
            total: 400,
            offers: [
              {
                name: 'Test Campaign',
                amount: 400,
              },
            ],
          },
          items: {
            total: 400,
            offers: [
              {
                name: 'Test Campaign',
                amount: 400,
              },
            ],
          },
        },
      });
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
        total: 100,
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

      expect(result).toEqual({ total: 0 });
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
        total: 400,
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

      expect(result).toEqual({ total: 0, offers: [] });
    });
  });

  describe('getItemLevelCredits', () => {
    it('should return credits if present and adjudicationResults exist', () => {
      const basket = {
        contents: [
          {
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
        ],
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
        total: 400,
        offers: [
          {
            name: 'Test Campaign',
            amount: 400,
          },
        ],
      };
      jest
        .spyOn(cartToBasketMapper, 'mapAdjustedBasketToItemCredits')
        .mockReturnValue(credits);

      const result = loyaltyService.getItemLevelCredits(basket, accounts);

      expect(result).toEqual(credits);
    });

    it('should return default data if adjudicationResults do not exist', () => {
      const basket = {
        contents: [
          {
            adjudicationResults: [],
          },
        ],
      };
      const accounts = [];

      const result = loyaltyService.getItemLevelCredits(basket, accounts);

      expect(result).toEqual({ total: 0, offers: [] });
    });

    it('should return default data if there are no items in basket', () => {
      const basket = {
        contents: [],
      };
      const accounts = [];

      const result = loyaltyService.getItemLevelCredits(basket, accounts);

      expect(result).toEqual({ total: 0, offers: [] });
    });
  });
});
