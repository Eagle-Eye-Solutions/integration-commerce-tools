import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyMapper } from './loyalty.mapper';

describe('LoyaltyMapper', () => {
  let service: LoyaltyMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyMapper],
    }).compile();

    service = module.get<LoyaltyMapper>(LoyaltyMapper);
    jest.resetAllMocks();
  });

  describe('mapAdjustedBasketToBasketEarn', () => {
    it('should return the mapped basket earn', () => {
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

      const basketContents = service.mapAdjustedBasketToBasketEarn(basket);

      expect(basketContents).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToBasketCredits', () => {
    it('should return the mapped basket credits', () => {
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

      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it("should return deduplicated results when there's more than one credit instance per campaign", () => {
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
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-2',
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

      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToItemCredits', () => {
    it('should return the mapped item credits', () => {
      const basket = {
        contents: [
          {
            upc: '123456',
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

      const basketContents = service.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it("should return deduplicated results when there's more than one credit instance per campaign", () => {
      const basket = {
        contents: [
          {
            upc: '123456',
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
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                instanceId: '1653843-2',
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

      const basketContents = service.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });
  });
});
