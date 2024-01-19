import { Test, TestingModule } from '@nestjs/testing';
import { AdjudicationMapper } from '../../mappers/adjudication.mapper';
import { CampaignNameService } from './campaign-name.service';
import { ConfigService } from '@nestjs/config';

describe('CampaignNameService', () => {
  let service: CampaignNameService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignNameService,
        ConfigService,
        {
          provide: AdjudicationMapper,
          useValue: {
            mapBasketDiscountsToDiscountDescription: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CampaignNameService>(CampaignNameService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('getBasketCampaignNames', () => {
    it('should return an empty array if no resourceIds are found', () => {
      const result = service.getBasketCampaignNames({});
      expect(result).toEqual([]);
    });

    it('should return mapped discounts if resourceIds are found and remove duplicated campaign names', () => {
      const walletOpenResponse = {
        data: {
          analyseBasketResults: {
            basket: {
              summary: {
                adjustmentResults: [{ resourceId: '1' }, { resourceId: '2' }],
              },
            },
            discount: [
              { campaignId: '1', campaignName: 'Discount 1' },
              { campaignId: '2', campaignName: 'Discount 2' },
              { campaignId: '3', campaignName: 'Discount 3' },
              { campaignId: '4', campaignName: 'Discount 3' },
            ],
          },
        },
      };
      const result = service.getBasketCampaignNames(walletOpenResponse);
      expect(result).toEqual([
        { description: 'Discount 1' },
        { description: 'Discount 2' },
      ]);
    });

    it('should return shipping campaign name when present and not remove duplicated shipping campaign names', () => {
      const walletOpenResponse = {
        data: {
          analyseBasketResults: {
            basket: {
              summary: {
                adjustmentResults: [{ resourceId: 'basket-campaign' }],
              },
              contents: [
                {
                  upc: 'shipping-upc',
                  adjustmentResults: [{ resourceId: 'shipping-campaign' }],
                },
                {
                  upc: 'shipping-premium-upc',
                  adjustmentResults: [
                    { resourceId: 'shipping-premium-campaign' },
                  ],
                },
                {
                  upc: 'shipping-premium-duplicated-upc',
                  adjustmentResults: [
                    { resourceId: 'shipping-premium-duplicated-campaign' },
                  ],
                },
                {
                  upc: 'product2',
                  adjustmentResults: [{ resourceId: 'product2-campaign' }],
                },
              ],
            },
            discount: [
              {
                campaignId: 'shipping-campaign',
                campaignName: 'Shipping discount',
              },
              {
                campaignId: 'basket-campaign',
                campaignName: 'Basket discount',
              },
              {
                campaignId: 'product2-campaign',
                campaignName: 'product2 discount',
              },
              {
                campaignId: 'shipping-premium-campaign',
                campaignName: 'Premium shipping discount',
              },
              {
                campaignId: 'shipping-premium-duplicated-campaign',
                campaignName: 'Premium shipping discount',
              },
            ],
          },
        },
      };
      jest.spyOn(configService, 'get').mockReturnValue([
        {
          key: 'standard-key',
          upc: 'shipping-upc',
        },
        {
          key: 'premium-key',
          upc: 'shipping-premium-upc',
        },
        {
          key: 'premium-duplicated-key',
          upc: 'shipping-premium-duplicated-upc',
        },
      ]);
      const result = service.getBasketCampaignNames(walletOpenResponse);
      expect(result).toEqual([
        { description: 'Basket discount' },
        { description: 'Shipping discount' },
        { description: 'Premium shipping discount' },
        { description: 'Premium shipping discount' },
      ]);
    });
  });

  describe('getLineItemsCampaignNames', () => {
    it('should return an empty map if no contents are found', () => {
      const result = service.getLineItemsCampaignNames({});
      expect(result).toEqual(new Map());
    });

    it('should return a map of productIds to campaign names if contents are found', () => {
      const walletOpenResponse = {
        data: {
          analyseBasketResults: {
            basket: {
              contents: [
                {
                  upc: 'product1',
                  adjustmentResults: [{ resourceId: '1' }],
                },
                {
                  upc: 'product2',
                  adjustmentResults: [{ resourceId: '2' }],
                },
              ],
            },
            discount: [
              { campaignId: '1', campaignName: 'Discount 1' },
              { campaignId: '2', campaignName: 'Discount 2' },
              { campaignId: '3', campaignName: 'Discount 3' },
            ],
          },
        },
      };
      const result = service.getLineItemsCampaignNames(walletOpenResponse);
      expect(result).toEqual(
        new Map([
          ['product1', ['Discount 1']],
          ['product2', ['Discount 2']],
        ]),
      );
    });
  });
});
