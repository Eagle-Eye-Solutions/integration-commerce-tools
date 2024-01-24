import { Injectable } from '@nestjs/common';
import {
  LOYALTY_CREDIT_CATEGORY,
  LOYALTY_CREDIT_TYPE,
  LookupMaps,
  LoyaltyOfferBreakdown,
  QuestCampaign,
  QuestCreditOffer,
} from '../../../adjudication/types/loyalty-earn-credits.type';

@Injectable()
export class QuestCampaignHandler {
  constructor() {}

  private createLookupMaps(accounts: any): LookupMaps {
    const accountMap: Record<string, any> = {};
    const campaignToAccountMap: Record<string, string> = {};
    const campaignNameMap: Record<string, string> = {};

    accounts.map((account) => {
      accountMap[account.accountId] = account;
      campaignToAccountMap[account.campaignId] = account.accountId;
      campaignNameMap[account.campaignId] = account.campaign.campaignName;
    });

    return { accountMap, campaignToAccountMap, campaignNameMap };
  }

  private getQuestCampaignObjectives(
    campaigns: any,
    campaignNameMap: Record<string, string>,
    accountMap: Record<string, any>,
    campaignToAccountMap: Record<string, string>,
    result: any,
    offer: LoyaltyOfferBreakdown,
  ): QuestCampaign[] {
    return campaigns
      .filter(
        (campaign) =>
          accountMap[campaignToAccountMap[campaign.campaignId]] &&
          result?.targetedAccountId !=
            campaignToAccountMap[campaign.campaignId] &&
          !offer?.currentObjectives?.find(
            (objective) => objective.campaignId === campaign.campaignId,
          ),
      )
      .map((campaign) => {
        return {
          campaignId: campaign.campaignId,
          campaignName: campaignNameMap[campaign.campaignId],
        };
      });
  }

  private constructQuestCampaignOffer(questCreditOffer: QuestCreditOffer) {
    return {
      type: questCreditOffer.creditOfferType,
      name: questCreditOffer.questAccount.campaign.campaignName,
      amount: questCreditOffer.result.balances?.current || 0,
      ...(questCreditOffer.result.sku
        ? { sku: questCreditOffer.result.sku }
        : {}),
      category: LOYALTY_CREDIT_CATEGORY.QUEST,
      totalObjectives: questCreditOffer.totalObjectives,
      totalObjectivesMet: questCreditOffer.totalObjectivesMet,
      currentObjectives: questCreditOffer.currentObjectives,
      objectivesToMeet: questCreditOffer.objectivesToMeet,
    };
  }

  // Creates a credit offer for a quest campaign that is in progress
  // and when the objectives are fulfilled over multiple transactions
  calculateQuestCampaignProgress(
    creditResults: any,
    accounts: any,
  ): LoyaltyOfferBreakdown[] {
    const { accountMap, campaignToAccountMap, campaignNameMap } =
      this.createLookupMaps(accounts);

    // multiple objectives could be redeemed in a transaction, so holding them against the quest campaign id
    const questCampaignToOfferMap: Record<number, LoyaltyOfferBreakdown> = {};

    // Processing only those "redeem" type adjudicating results that are part of a quest campaign
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

        const objectivesToMeet = this.getQuestCampaignObjectives(
          questCampaignAccount.campaign?.relationships?.OBJECTIVE?.CAMPAIGN,
          campaignNameMap,
          accountMap,
          campaignToAccountMap,
          result,
          questCampaignToOfferMap[questCampaignAccountId],
        );
        const totalObjectives =
          questCampaignAccount.campaign?.relationships?.OBJECTIVE?.CAMPAIGN
            .length;
        const totalObjectivesMet = questCampaignAccount.balances?.objectivesMet
          ? questCampaignAccount.balances?.objectivesMet + 1
          : 1;

        const currentObjective = {
          campaignId: result.resourceId,
          campaignName: campaignNameMap[result.resourceId],
        };

        if (questCampaignToOfferMap.hasOwnProperty(questCampaignAccountId)) {
          const campaignOffer = questCampaignToOfferMap[questCampaignAccountId];
          campaignOffer.currentObjectives.push(currentObjective);
          campaignOffer.objectivesToMeet = objectivesToMeet;
          campaignOffer.totalObjectivesMet =
            campaignOffer.totalObjectivesMet + totalObjectivesMet;
          if (totalObjectivesMet === totalObjectives) {
            campaignOffer.type = LOYALTY_CREDIT_TYPE.COMPLETING;
          }
          questCampaignToOfferMap[questCampaignAccountId] = campaignOffer;
        } else {
          const currentObjectives = [currentObjective];
          questCampaignToOfferMap[questCampaignAccountId] =
            this.constructQuestCampaignOffer({
              questAccount: questCampaignAccount,
              result: result,
              creditOfferType:
                totalObjectives === totalObjectivesMet
                  ? LOYALTY_CREDIT_TYPE.COMPLETING
                  : LOYALTY_CREDIT_TYPE.IN_PROGRESS,
              totalObjectives: totalObjectives,
              currentObjectives: currentObjectives,
              totalObjectivesMet: totalObjectivesMet,
              objectivesToMeet: objectivesToMeet,
            });
        }
      });
    return Object.values(questCampaignToOfferMap);
  }

  // Creates a credit offer when all objectives are met in single transaction
  createQuestCreditOffer(result: any, accounts: any, questAccount: any) {
    const { campaignNameMap } = this.createLookupMaps(accounts);

    const questCampaigns =
      questAccount.campaign?.relationships?.OBJECTIVE?.CAMPAIGN;
    const totalObjectives = questCampaigns.length;
    const creditOfferType = LOYALTY_CREDIT_TYPE.COMPLETING;
    const currentObjectives = questCampaigns.map((campaign) => {
      return {
        campaignId: campaign.campaignId,
        campaignName: campaignNameMap[campaign.campaignId],
      };
    });
    return this.constructQuestCampaignOffer({
      questAccount: questAccount,
      result: result,
      creditOfferType: creditOfferType,
      totalObjectives: totalObjectives,
      currentObjectives: currentObjectives,
      totalObjectivesMet: totalObjectives,
      objectivesToMeet: [],
    });
  }
}
