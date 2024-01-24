import { Test, TestingModule } from '@nestjs/testing';
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
    expect(offer).toMatchSnapshot();
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
      {
        resourceType: 'CAMPAIGN',
        resourceId: '1762401',
        instanceId: '1762401-1',
        type: 'redeem',
        balances: null,
        relatedAccountIds: ['2853561876'],
        targetedAccountId: '2853561876',
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
    expect(breakdown).toMatchSnapshot();
  });
});
