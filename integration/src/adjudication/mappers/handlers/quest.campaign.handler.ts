import { Injectable } from '@nestjs/common';
import {
  LOYALTY_CREDIT_CATEGORY,
  LOYALTY_CREDIT_TYPE,
  LoyaltyOfferBreakdown,
  QuestCampaign,
} from '../../../adjudication/types/loyalty-earn-credits.type';

@Injectable()
export class QuestCampaignHandler {
  constructor() {}

  private createLookupMaps(accounts: any): {
    accountMap: Record<number, any>;
    campaignToAccountMap: Record<number, number>;
    campaignNameMap: Record<number, string>;
  } {
    const accountMap: Record<number, any> = {};
    const campaignToAccountMap: Record<number, number> = {};
    const campaignNameMap: Record<number, string> = {};

    accounts.map((account) => {
      accountMap[account.accountId] = account;
      campaignToAccountMap[account.campaignId] = account.accountId;
      campaignNameMap[account.campaignId] = account.campaign.campaignName;
    });

    return { accountMap, campaignToAccountMap, campaignNameMap };
  }

  private createOffer(
    questCampaignAccount: any,
    campaignNameMap: Record<number, string>,
    result: any,
    type: LOYALTY_CREDIT_TYPE,
  ): LoyaltyOfferBreakdown {
    const totalObjectives = this.getQuestCampaignAccountNames(
      questCampaignAccount,
      campaignNameMap,
    );

    return {
      type: type,
      name: questCampaignAccount.campaign.campaignName,
      amount: result.balances?.current || 0,
      sku: result.sku,
      category: LOYALTY_CREDIT_CATEGORY.QUEST,
      totalObjectives: totalObjectives,
      objectivesMet:
        type === LOYALTY_CREDIT_TYPE.IN_PROGRESS
          ? [
              {
                campaignId: result.resourceId,
                campaignName: campaignNameMap[result.resourceId],
              },
            ]
          : totalObjectives,
    };
  }

  calculateQuestCampaignProgress(
    creditResults: any,
    accounts: any,
  ): LoyaltyOfferBreakdown[] {
    const { accountMap, campaignToAccountMap, campaignNameMap } =
      this.createLookupMaps(accounts);
    const questCampaignToOfferMap: Record<number, LoyaltyOfferBreakdown> = {};

    creditResults
      .filter(
        (result) =>
          accountMap[result.targetedAccountId]?.campaign?.relationships
            ?.OBJECTIVE_OF,
      )
      .map((result) => {
        const targetedAccount = accountMap[result.targetedAccountId];
        const questCampaignId =
          targetedAccount?.campaign?.relationships?.OBJECTIVE_OF?.CAMPAIGN[0]
            ?.campaignId;
        const questCampaignAccountId = campaignToAccountMap[questCampaignId];
        const questCampaignAccount = accountMap[questCampaignAccountId];

        if (questCampaignToOfferMap.hasOwnProperty(questCampaignAccountId)) {
          questCampaignToOfferMap[questCampaignAccountId].objectivesMet.push({
            campaignId: result.resourceId,
            campaignName: campaignNameMap[result.resourceId],
          });
        } else {
          questCampaignToOfferMap[questCampaignAccountId] = this.createOffer(
            questCampaignAccount,
            campaignNameMap,
            result,
            LOYALTY_CREDIT_TYPE.IN_PROGRESS,
          );
        }
      });
    return Object.values(questCampaignToOfferMap);
  }

  private getQuestCampaignAccountNames(
    questCampaignAccount: any,
    campaignNameMap: Record<number, string>,
  ): QuestCampaign[] {
    return (
      questCampaignAccount.campaign?.relationships?.OBJECTIVE?.CAMPAIGN?.map(
        (campaign) => ({
          campaignId: campaign.campaignId,
          campaignName: campaignNameMap[campaign.campaignId],
        }),
      ) || []
    );
  }

  createQuestCreditOffer(result: any, accounts: any, questAccount: any) {
    const { campaignNameMap } = this.createLookupMaps(accounts);

    return this.createOffer(
      questAccount,
      campaignNameMap,
      result,
      LOYALTY_CREDIT_TYPE.COMPLETING,
    );
  }
}
