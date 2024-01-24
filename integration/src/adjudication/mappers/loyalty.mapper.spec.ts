import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyMapper } from './loyalty.mapper';
import { QuestCampaignHandler } from './handlers/quest.campaign.handler';
import {
  LOYALTY_CREDIT_CATEGORY,
  LOYALTY_CREDIT_TYPE,
} from '../types/loyalty-earn-credits.type';

describe('LoyaltyMapper', () => {
  let service: LoyaltyMapper;
  let questCampaignHandler: QuestCampaignHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyMapper,
        {
          provide: QuestCampaignHandler,
          useValue: {
            calculateQuestCampaignProgress: jest.fn(),
            createQuestCreditOffer: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoyaltyMapper>(LoyaltyMapper);
    questCampaignHandler =
      module.get<QuestCampaignHandler>(QuestCampaignHandler);
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

    it('should process the quest campaign fulfilled results and update the mapped basket credits', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762399',
              instanceId: '1762399-1',
              type: 'redeem',
              value: 0,
              balances: null,
              relatedAccountIds: ['2853561875'],
              targetedAccountId: '2853561875',
              targetedWalletId: '172454304',
            },
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762401',
              instanceId: '1762401-1',
              type: 'redeem',
              value: 0,
              balances: null,
              relatedAccountIds: ['2853561876'],
              targetedAccountId: '2853561876',
              targetedWalletId: '172454304',
            },
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762402',
              instanceId: '1762402-1',
              type: 'redeem',
              value: 0,
              balances: null,
              relatedAccountIds: ['2853561877'],
              targetedAccountId: '2853561877',
              targetedWalletId: '172454304',
            },
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762406',
              instanceId: '1762406-1',
              type: 'redeem',
              value: 2000,
              balances: null,
              relatedAccountIds: ['2853561874'],
              targetedAccountId: '2853561874',
              targetedWalletId: '172454304',
            },
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762406',
              instanceId: '1762406-1',
              success: null,
              type: 'credit',
              value: null,
              balances: { current: 2000 },
              relatedAccountIds: ['2853561874'],
              targetedAccountId: '2853561878',
              targetedWalletId: '172454304',
            },
          ],
        },
      };
      const accounts = [
        {
          accountId: '2853561874',
          walletId: '172454304',
          campaignId: '1762406',
          campaign: {
            campaignId: 1762406,
            campaignTypeId: 57,
            campaignMode: 'RESTRICTED',
            campaignName: 'Travel Quest',
            accountTypeId: 12,
            status: 'ACTIVE',
            sequenceKey: null,
            reference: '001762406',
            relationships: {
              OBJECTIVE: {
                CAMPAIGN: [
                  {
                    campaignId: '1762399',
                    dateCreated: '2023-12-11T12:43:06+00:00',
                  },
                  {
                    campaignId: '1762401',
                    dateCreated: '2023-12-11T12:43:06+00:00',
                  },
                  {
                    campaignId: '1762402',
                    dateCreated: '2023-12-11T12:43:06+00:00',
                  },
                ],
              },
            },
          },
          type: 'QUEST',
          overrides: [],
          balances: { objectivesMet: 0 },
          relationships: null,
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Travel Quest',
            campaignReference: '001762406',
          },
        },
        {
          accountId: '2853561875',
          walletId: '172454304',
          campaignId: '1762399',
          campaign: {
            campaignId: 1762399,
            campaignTypeId: 58,
            campaignMode: 'RESTRICTED',
            campaignName: 'Quest: Car Hire (UPC: 245882)',
            accountTypeId: 1,
            status: 'ACTIVE',
            sequenceKey: null,
            reference: '001762399',
            relationships: {
              OBJECTIVE_OF: {
                CAMPAIGN: [
                  {
                    campaignId: '1762406',
                    dateCreated: '2023-12-11T12:39:59+00:00',
                  },
                ],
              },
            },
          },
          type: 'ECOUPON',
          overrides: [],
          balances: { available: 0, refundable: 0 },
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Quest: Car Hire (UPC: 245882)',
            campaignReference: '001762399',
          },
        },
        {
          accountId: '2853561876',
          walletId: '172454304',
          campaignId: '1762401',
          campaign: {
            campaignId: 1762401,
            campaignTypeId: 58,
            campaignMode: 'RESTRICTED',
            campaignName: 'Quest: Buy eScooter (UPC: 245902)',
            accountTypeId: 1,
            status: 'ACTIVE',
            sequenceKey: null,
            reference: '001762401',
            relationships: {
              OBJECTIVE_OF: {
                CAMPAIGN: [
                  {
                    campaignId: '1762406',
                    dateCreated: '2023-12-11T12:41:13+00:00',
                  },
                ],
              },
            },
          },
          type: 'ECOUPON',
          overrides: [],
          balances: { available: 0, refundable: 0 },
          relationships: null,
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Quest: Buy eScooter (UPC: 245902)',
            campaignReference: '001762401',
          },
        },
        {
          accountId: '2853561877',
          walletId: '172454304',
          campaignId: '1762402',
          campaign: {
            campaignId: 1762402,
            campaignTypeId: 58,
            campaignMode: 'RESTRICTED',
            campaignName: 'Quest: Buy eBike (UPC: 245903)',
            accountTypeId: 1,
            reference: '001762402',
            relationships: {
              OBJECTIVE_OF: {
                CAMPAIGN: [
                  {
                    campaignId: '1762406',
                    dateCreated: '2023-12-11T12:42:07+00:00',
                  },
                ],
              },
            },
          },
          type: 'ECOUPON',
          balances: { available: 0, refundable: 0 },
          relationships: null,
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Quest: Buy eBike (UPC: 245903)',
            campaignReference: '001762402',
          },
        },
      ];
      jest
        .spyOn(questCampaignHandler, 'createQuestCreditOffer')
        .mockReturnValue({
          type: LOYALTY_CREDIT_TYPE.COMPLETING,
          name: 'Travel Quest',
          amount: 2000,
          category: LOYALTY_CREDIT_CATEGORY.QUEST,
          totalObjectives: 3,
          totalObjectivesMet: 3,
          objectivesToMeet: [],
          currentObjectives: [
            {
              campaignId: '1762402',
              campaignName: 'Quest: Buy eBike (UPC: 245903)',
            },
            {
              campaignId: '1762401',
              campaignName: 'Quest: Buy eScooter (UPC: 245902)',
            },
            {
              campaignId: '1762399',
              campaignName: 'Quest: Car Hire (UPC: 245882)',
            },
          ],
        });
      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it('should process the quest campaign in progress results and update the mapped basket credits', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762399',
              instanceId: '1762399-1',
              type: 'redeem',
              value: 0,
              balances: null,
              relatedAccountIds: ['2853561875'],
              targetedAccountId: '2853561875',
              targetedWalletId: '172454304',
            },
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762401',
              instanceId: '1762401-1',
              type: 'redeem',
              value: 0,
              balances: null,
              relatedAccountIds: ['2853561876'],
              targetedAccountId: '2853561876',
              targetedWalletId: '172454304',
            },
          ],
        },
      };
      const accounts = [
        {
          accountId: '2853561874',
          walletId: '172454304',
          campaignId: '1762406',
          campaign: {
            campaignId: 1762406,
            campaignTypeId: 57,
            campaignMode: 'RESTRICTED',
            campaignName: 'Travel Quest',
            accountTypeId: 12,
            status: 'ACTIVE',
            sequenceKey: null,
            reference: '001762406',
            relationships: {
              OBJECTIVE: {
                CAMPAIGN: [
                  {
                    campaignId: '1762399',
                    dateCreated: '2023-12-11T12:43:06+00:00',
                  },
                  {
                    campaignId: '1762401',
                    dateCreated: '2023-12-11T12:43:06+00:00',
                  },
                  {
                    campaignId: '1762402',
                    dateCreated: '2023-12-11T12:43:06+00:00',
                  },
                ],
              },
            },
          },
          type: 'QUEST',
          overrides: [],
          balances: { objectivesMet: 0 },
          relationships: null,
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Travel Quest',
            campaignReference: '001762406',
          },
        },
        {
          accountId: '2853561875',
          walletId: '172454304',
          campaignId: '1762399',
          campaign: {
            campaignId: 1762399,
            campaignTypeId: 58,
            campaignMode: 'RESTRICTED',
            campaignName: 'Quest: Car Hire (UPC: 245882)',
            accountTypeId: 1,
            status: 'ACTIVE',
            sequenceKey: null,
            reference: '001762399',
            relationships: {
              OBJECTIVE_OF: {
                CAMPAIGN: [
                  {
                    campaignId: '1762406',
                    dateCreated: '2023-12-11T12:39:59+00:00',
                  },
                ],
              },
            },
          },
          type: 'ECOUPON',
          overrides: [],
          balances: { available: 0, refundable: 0 },
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Quest: Car Hire (UPC: 245882)',
            campaignReference: '001762399',
          },
        },
        {
          accountId: '2853561876',
          walletId: '172454304',
          campaignId: '1762401',
          campaign: {
            campaignId: 1762401,
            campaignTypeId: 58,
            campaignMode: 'RESTRICTED',
            campaignName: 'Quest: Buy eScooter (UPC: 245902)',
            accountTypeId: 1,
            status: 'ACTIVE',
            sequenceKey: null,
            reference: '001762401',
            relationships: {
              OBJECTIVE_OF: {
                CAMPAIGN: [
                  {
                    campaignId: '1762406',
                    dateCreated: '2023-12-11T12:41:13+00:00',
                  },
                ],
              },
            },
          },
          type: 'ECOUPON',
          overrides: [],
          balances: { available: 0, refundable: 0 },
          relationships: null,
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Quest: Buy eScooter (UPC: 245902)',
            campaignReference: '001762401',
          },
        },
        {
          accountId: '2853561877',
          walletId: '172454304',
          campaignId: '1762402',
          campaign: {
            campaignId: 1762402,
            campaignTypeId: 58,
            campaignMode: 'RESTRICTED',
            campaignName: 'Quest: Buy eBike (UPC: 245903)',
            accountTypeId: 1,
            reference: '001762402',
            relationships: {
              OBJECTIVE_OF: {
                CAMPAIGN: [
                  {
                    campaignId: '1762406',
                    dateCreated: '2023-12-11T12:42:07+00:00',
                  },
                ],
              },
            },
          },
          type: 'ECOUPON',
          balances: { available: 0, refundable: 0 },
          relationships: null,
          enriched: {
            enrichmentType: 'COUPON',
            campaignName: 'Quest: Buy eBike (UPC: 245903)',
            campaignReference: '001762402',
          },
        },
      ];
      jest
        .spyOn(questCampaignHandler, 'calculateQuestCampaignProgress')
        .mockReturnValue([
          {
            type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
            name: 'Travel Quest',
            amount: 0,
            category: LOYALTY_CREDIT_CATEGORY.QUEST,
            totalObjectives: 3,
            totalObjectivesMet: 2,
            currentObjectives: [
              {
                campaignId: '1762401',
                campaignName: 'Quest: Buy eScooter (UPC: 245902)',
              },
              {
                campaignId: '1762399',
                campaignName: 'Quest: Car Hire (UPC: 245882)',
              },
            ],
            objectivesToMeet: [
              {
                campaignId: '1762402',
                campaignName: 'Quest: Buy eBike (UPC: 245903)',
              },
            ],
            timesRedeemed: 1,
          },
        ]);
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
