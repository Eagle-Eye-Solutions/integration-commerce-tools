import { Test, TestingModule } from '@nestjs/testing';
import {
  LOYALTY_CREDIT_CATEGORY,
  LOYALTY_CREDIT_TYPE,
} from '../../../adjudication/types/loyalty-earn-credits.type';
import { QuestCampaignHandler } from './quest.campaign.handler';

describe('QuestCampaignHandler', () => {
  let handler: QuestCampaignHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestCampaignHandler],
    }).compile();

    handler = module.get<QuestCampaignHandler>(QuestCampaignHandler);
    jest.resetAllMocks();
  });

  it('should generate quest campaign account names correctly', () => {
    const campaignNameMap = { 200: 'My Campaign' };
    const questCampaignAccount = {
      campaign: {
        relationships: {
          OBJECTIVE: {
            CAMPAIGN: [
              {
                campaignId: 200,
              },
            ],
          },
        },
      },
    };

    const names = (handler as any).getQuestCampaignAccountNames(
      questCampaignAccount,
      campaignNameMap,
    );

    expect(names).toEqual([{ campaignId: 200, campaignName: 'My Campaign' }]);
  });

  it('should create quest credit offer correctly', () => {
    const result = {
      balances: { current: 100 },
      sku: 'test_sku',
      resourceId: 200,
    };
    const questAccount = {
      accountId: 1,
      campaignId: 200,
      campaign: {
        campaignId: 200,
        campaignName: 'Quest 1',
        relationships: {
          OBJECTIVE: {
            CAMPAIGN: [
              {
                campaignId: 'T1',
              },
            ],
          },
        },
      },
    };
    const T1Account = {
      campaignId: 'T1',
      campaign: {
        campaignId: 'T1',
        campaignName: 'Task 1',
        relationships: {
          OBJECTIVE_OF: {
            CAMPAIGN: [
              {
                campaignId: '200',
              },
            ],
          },
        },
      },
    };
    const accounts = [questAccount, T1Account];

    const offer = handler.createQuestCreditOffer(
      result,
      accounts,
      questAccount,
    );

    expect(offer).toEqual({
      amount: 100,
      category: LOYALTY_CREDIT_CATEGORY.QUEST,
      name: 'Quest 1',
      objectivesMet: [{ campaignId: 'T1', campaignName: 'Task 1' }],
      sku: 'test_sku',
      totalObjectives: [{ campaignId: 'T1', campaignName: 'Task 1' }],
      type: LOYALTY_CREDIT_TYPE.COMPLETING,
    });
  });

  it('should calculate quest campaign progress correctly', () => {
    const creditResults = [
      {
        resourceType: 'CAMPAIGN',
        resourceId: '1762399',
        instanceId: '1762399-1',
        type: 'redeem',
        balances: null,
        relatedAccountIds: ['2853561875'],
        targetedAccountId: '2853561875',
        targetedWalletId: '172454304',
      },
    ];

    const accounts = [
      {
        accountId: '2853561874',
        campaignId: '1762406',
        campaign: {
          campaignId: 1762406,
          campaignName: 'Travel Quest',
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
      },
      {
        accountId: '2853561875',
        walletId: '172454304',
        campaignId: '1762399',
        campaign: {
          campaignId: 1762399,
          campaignName: 'Quest: Car Hire (UPC: 245882)',
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
      },
      {
        accountId: '2853561876',
        walletId: '172454304',
        campaignId: '1762401',
        campaign: {
          campaignId: 1762401,
          campaignName: 'Quest: Buy eScooter (UPC: 245902)',
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
      },
      {
        accountId: '2853561877',
        walletId: '172454304',
        campaignId: '1762402',
        campaign: {
          campaignId: 1762402,
          campaignName: 'Quest: Buy eBike (UPC: 245903)',
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
      },
    ];
    const breakdown = handler.calculateQuestCampaignProgress(
      creditResults,
      accounts,
    );

    expect(breakdown).toEqual([
      {
        amount: 0,
        category: LOYALTY_CREDIT_CATEGORY.QUEST,
        name: 'Travel Quest',
        objectivesMet: [
          {
            campaignId: '1762399',
            campaignName: 'Quest: Car Hire (UPC: 245882)',
          },
        ],
        totalObjectives: [
          {
            campaignId: '1762399',
            campaignName: 'Quest: Car Hire (UPC: 245882)',
          },
          {
            campaignId: '1762401',
            campaignName: 'Quest: Buy eScooter (UPC: 245902)',
          },
          {
            campaignId: '1762402',
            campaignName: 'Quest: Buy eBike (UPC: 245903)',
          },
        ],
        type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
      },
    ]);
  });
});
