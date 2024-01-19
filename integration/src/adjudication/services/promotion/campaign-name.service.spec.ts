import { Test, TestingModule } from '@nestjs/testing';
import { AdjudicationMapper } from '../../mappers/adjudication.mapper';
import { CampaignNameService } from './campaign-name.service';

describe('CampaignNameService', () => {
  let service: CampaignNameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignNameService,
        {
          provide: AdjudicationMapper,
          useValue: {
            mapBasketDiscountsToDiscountDescription: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CampaignNameService>(CampaignNameService);
  });

  describe('getBasketCampaignNames', () => {
    it('should return an empty array if no resourceIds are found', () => {
      const result = service.getBasketCampaignNames({});
      expect(result).toEqual([]);
    });

    it('should return mapped discounts if resourceIds are found', () => {
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
