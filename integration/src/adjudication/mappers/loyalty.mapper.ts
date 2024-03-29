import { Injectable } from '@nestjs/common';
import {
  LOYALTY_CREDIT_CATEGORY,
  LOYALTY_CREDIT_TYPE,
  LoyaltyBreakdownObject,
  LoyaltyOfferBreakdown,
  LoyaltyTotalObject,
  ProcessedCreditOffers,
} from '../types/loyalty-earn-credits.type';
import { QuestCampaignHandler } from './handlers/quest.campaign.handler';

@Injectable()
export class LoyaltyMapper {
  constructor(readonly questCampaignHandler: QuestCampaignHandler) {}

  mapAdjustedBasketToBasketEarn(basket): LoyaltyTotalObject {
    const basketEarn = { total: 0, offers: [] };
    const basketEarnResult = basket.summary.adjudicationResults.find(
      (result) => result.type === 'earn',
    );
    if (basketEarnResult) {
      basketEarn.total = basketEarnResult.balances.current;
    }
    return basketEarn;
  }

  mapAdjustedBasketToBasketCredits(basket, accounts): LoyaltyBreakdownObject {
    const basketCredits = { total: 0, offers: [] };
    let processedCreditOffers: ProcessedCreditOffers = {
      isProcessRedeemResults: true,
      offers: [],
    };
    const basketCreditResults = basket.summary.adjudicationResults.filter(
      (result) => result.type === 'credit',
    );
    if (basketCreditResults.length) {
      basketCredits.total = basketCreditResults.reduce(
        (acc, result) =>
          result.balances.current ? result.balances.current + acc : acc,
        0,
      );
      processedCreditOffers = this.getCreditOffers(
        basketCreditResults,
        accounts,
      );
      basketCredits.offers = processedCreditOffers.offers;
    }

    const isQuestAccountPresent = accounts.find(
      (account) => account.type === LOYALTY_CREDIT_CATEGORY.QUEST,
    );

    if (processedCreditOffers.isProcessRedeemResults && isQuestAccountPresent) {
      const basketRedeemResults = basket.summary.adjudicationResults.filter(
        (result) => result.type === 'redeem',
      );
      basketCredits.offers.push(
        ...this.questCampaignHandler.calculateQuestCampaignProgress(
          basketRedeemResults,
          accounts,
        ),
      );
    }

    return basketCredits;
  }

  mapAdjustedBasketToItemCredits(basket, accounts): LoyaltyBreakdownObject {
    const itemCredits = { total: 0, offers: [] };
    const itemCreditResults = basket.contents
      .filter((item) => item.adjudicationResults)
      .map((item) =>
        item.adjudicationResults.map((result) => ({
          ...result,
          sku: item.upc || item.sku,
        })),
      )
      .flat()
      .filter((result) => result.type === 'credit');
    if (itemCreditResults.length) {
      itemCredits.total = itemCreditResults.reduce(
        (acc, result) =>
          result.balances.current ? result.balances.current + acc : acc,
        0,
      );
      const processedCreditOffers = this.getCreditOffers(
        itemCreditResults,
        accounts,
      );
      itemCredits.offers = processedCreditOffers.offers;
    }
    return itemCredits;
  }

  private getCreditOffers(creditResults, accounts): ProcessedCreditOffers {
    // when a continuity account is adjudicated, AIR returns two credit results
    // one with the points awarded (result.balances.current)
    // and the other with contributing purchase (totalTransactionUnits | totalTransactionUnits | transactionCount)
    // And both the credit offers would have the same instance_id
    // So storing the offer to process both the points awarded and the contributing purchase information against the offer
    // createOffer() would create the offer the store in this map and updateOffer() would take care of the contributing purchase information
    const offerMap: Record<string, LoyaltyOfferBreakdown> = {};
    let questOffer: boolean = false;

    creditResults
      .filter((result) => this.questAndContinuityCampaignStatusChecker(result))
      .map((result) => {
        const account = accounts.find(
          (account) =>
            String(account.campaign.campaignId) === String(result.resourceId),
        );
        if (account.type === 'QUEST') {
          questOffer = true;
        }
        if (offerMap.hasOwnProperty(result.instanceId)) {
          offerMap[result.instanceId] = this.updateOffer(
            offerMap[result.instanceId],
            result,
            account,
          );
        } else {
          offerMap[result.instanceId] = questOffer
            ? this.questCampaignHandler.createQuestCreditOffer(
                result,
                accounts,
                account,
              )
            : this.createOffer(result, account);
        }
      });

    return {
      isProcessRedeemResults: !questOffer,
      offers: this.deduplicateCreditOffers(Object.values(offerMap)),
    };
  }

  private deduplicateCreditOffers(offers: any[]) {
    const offerCount: { [key: string]: number } = {};
    offers.forEach((offer) => {
      offerCount[offer.name] = (offerCount[offer.name] || 0) + 1;
    });

    return Array.from(
      new Set(
        offers.map((offer) => {
          const count = offerCount[offer.name];

          if (count > 1) {
            return JSON.stringify({
              name: `${offer.name} (x${count})`,
              amount: offer.amount,
              sku: offer.sku,
              timesRedeemed: count,
            });
          } else {
            return JSON.stringify({ ...offer, timesRedeemed: 1 });
          }
        }),
      ),
    ).map((offer) => JSON.parse(offer));
  }

  private questAndContinuityCampaignStatusChecker(result: any) {
    return (
      result.balances.current ||
      result.balances.transaction_count ||
      result.balances.total_spend ||
      result.balances.total_units
    );
  }

  private createOffer(result: any, account: any) {
    return {
      name: account.campaign.campaignName,
      amount: result.balances.current || 0,
      sku: result.sku,
      ...(account.type === LOYALTY_CREDIT_CATEGORY.CONTINUITY
        ? {
            category: LOYALTY_CREDIT_CATEGORY.CONTINUITY,
            transactionCount: this.getBalanceValue(
              result,
              account,
              'transactionCount',
              'transaction_count',
            ),
            totalTransactionCount: this.getQualifierValue(
              account,
              'totalTransactionCount',
            ),
            totalSpend: this.getBalanceValue(
              result,
              account,
              'totalSpend',
              'total_spend',
            ),
            totalTransactionSpend: this.getQualifierValue(
              account,
              'totalTransactionSpend',
            ),
            totalUnits: this.getBalanceValue(
              result,
              account,
              'totalUnits',
              'total_units',
            ),
            totalTransactionUnits: this.getQualifierValue(
              account,
              'totalTransactionUnits',
            ),
            type: result.balances.current
              ? LOYALTY_CREDIT_TYPE.COMPLETING
              : LOYALTY_CREDIT_TYPE.IN_PROGRESS,
          }
        : {}),
    };
  }

  private updateOffer(
    existingOffer: LoyaltyOfferBreakdown,
    result: any,
    account: any,
  ) {
    if (result.balances?.transaction_count) {
      existingOffer.transactionCount =
        account.balances.transactionCount + result.balances.transaction_count;
    }
    if (result.balances?.total_spend) {
      existingOffer.totalSpend =
        account.balances.totalSpend + result.balances.total_spend;
    }
    if (result.balances?.total_units) {
      existingOffer.totalUnits =
        account.balances.totalUnits + result.balances.total_units;
    }
    if (
      result.balances?.current &&
      existingOffer.type === LOYALTY_CREDIT_TYPE.IN_PROGRESS
    ) {
      existingOffer.type = LOYALTY_CREDIT_TYPE.COMPLETING;
      existingOffer.amount = result.balances.current;
    }
    return existingOffer;
  }

  private getBalanceValue(
    result: any,
    account: any,
    accountProp: string,
    resultProp: string,
  ) {
    const balance = result.balances[resultProp]
      ? account.balances[accountProp] + result.balances[resultProp]
      : undefined;
    return balance;
  }

  private getQualifierValue(account: any, accountProp: string) {
    return account.enriched.qualifier.continuity[accountProp]
      ? account.enriched.qualifier.continuity[accountProp]
      : undefined;
  }
}
