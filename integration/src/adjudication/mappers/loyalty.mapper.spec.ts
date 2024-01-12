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

    it('should process the continuity campaign fulfilled results and update the mapped basket credits', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762358',
              instanceId: '1762358-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                transaction_count: 1,
              },
              isRefundable: true,
              isUnredeemable: false,
              relatedAccountIds: ['2819096223'],
              targetedAccountId: '2819096223',
              targetedWalletId: '170627492',
              totalMatchingUnits: null,
              playOrderPosition: 2,
            },
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762358',
              instanceId: '1762358-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                current: 500,
              },
              isRefundable: true,
              isUnredeemable: false,
              relatedAccountIds: ['2819096223'],
              targetedAccountId: '2819096224',
              targetedWalletId: '170627492',
              totalMatchingUnits: null,
              playOrderPosition: 2,
            },
          ],
        },
      };
      const accounts = [
        {
          accountId: '2819096223',
          walletId: '170627492',
          campaignId: '1762358',
          campaign: {
            campaignId: 1762358,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName:
              '500 points for spending over £10 in three transactions',
            accountTypeId: 8,
            status: 'ACTIVE',
            reference: '001762358',
          },
          type: 'CONTINUITY',
          clientType: 'OFFER',
          status: 'ACTIVE',
          state: 'LOADED',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 2,
            currentTransactions: 2,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: 3,
                totalTransactionSpend: null,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName:
              '500 points for spending over £10 in three transactions',
            campaignReference: '001762358',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it('should process the continuity campaign in_progress results and update the mapped basket credits', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762358',
              instanceId: '1762358-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                transaction_count: 1,
              },
              isRefundable: true,
              isUnredeemable: false,
              relatedAccountIds: ['2819096223'],
              targetedAccountId: '2819096223',
              targetedWalletId: '170627492',
              totalMatchingUnits: null,
              playOrderPosition: 2,
            },
          ],
        },
      };
      const accounts = [
        {
          accountId: '2819096223',
          walletId: '170627492',
          campaignId: '1762358',
          campaign: {
            campaignId: 1762358,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName:
              '500 points for spending over £10 in three transactions',
            accountTypeId: 8,
            status: 'ACTIVE',
            reference: '001762358',
          },
          type: 'CONTINUITY',
          clientType: 'OFFER',
          status: 'ACTIVE',
          state: 'LOADED',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 1,
            currentTransactions: 1,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: 3,
                totalTransactionSpend: null,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName:
              '500 points for spending over £10 in three transactions',
            campaignReference: '001762358',
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

    it('should process the continuity campaign fulfilled results and update the mapped item credits', () => {
      const basket = {
        contents: [
          {
            upc: '245896',
            itemUnitCost: 1000,
            salesKey: 'SALE',
            totalUnitCostAfterDiscount: 1000,
            totalUnitCost: 1000,
            description: 'Bears',
            itemUnitMetric: 'EACH',
            itemUnitCount: 1,
            contributionResults: [
              {
                instanceId: '1653843-1',
                value: 1000,
              },
            ],
            adjudicationResults: [
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  total_spend: 1000,
                },
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614658',
                targetedWalletId: '170774858',
                totalMatchingUnits: null,
                playOrderPosition: 2,
              },
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'redeem',
                value: 500,
                balances: null,
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614658',
                targetedWalletId: '170774858',
                totalMatchingUnits: 1,
                playOrderPosition: 2,
              },
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  current: 500,
                },
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614661',
                targetedWalletId: '170774858',
                totalMatchingUnits: null,
                playOrderPosition: 2,
              },
            ],
          },
        ],
      };
      const accounts = [
        {
          accountId: '2827614658',
          walletId: '170774858',
          campaignId: '1801571',
          campaign: {
            campaignId: 1801571,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            reference: '001801571',
          },
          type: 'CONTINUITY',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 0,
            currentTransactions: 0,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: null,
                totalTransactionSpend: 1000,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            campaignReference: '001801571',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it('should process the continuity campaign in_progress results and update the mapped item credits', () => {
      const basket = {
        contents: [
          {
            upc: '245896',
            itemUnitCost: 400,
            salesKey: 'SALE',
            totalUnitCostAfterDiscount: 800,
            totalUnitCost: 800,
            description: 'Bears',
            itemUnitMetric: 'EACH',
            itemUnitCount: 2,
            adjudicationResults: [
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  total_spend: 800,
                },
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614658',
                targetedWalletId: '170774858',
                totalMatchingUnits: null,
                playOrderPosition: 2,
              },
            ],
          },
        ],
      };
      const accounts = [
        {
          accountId: '2827614658',
          walletId: '170774858',
          campaignId: '1801571',
          campaign: {
            campaignId: 1801571,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            reference: '001801571',
          },
          type: 'CONTINUITY',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 0,
            currentTransactions: 0,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: null,
                totalTransactionSpend: 1000,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            campaignReference: '001801571',
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
