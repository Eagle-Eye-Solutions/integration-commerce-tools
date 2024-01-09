import { Injectable } from '@nestjs/common';
import {
  LoyaltyBreakdownObject,
  LoyaltyTotalObject,
} from '../../adjudication/types/loyalty-earn-credits.type';

@Injectable()
export class LoyaltyMapper {
  constructor() {}

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
    const basketCreditsResult = basket.summary.adjudicationResults.filter(
      (result) => result.type === 'credit',
    );
    if (basketCreditsResult.length) {
      basketCredits.total = basketCreditsResult.reduce(
        (acc, result) => result.balances.current + acc,
        0,
      );
      basketCredits.offers = this.getCreditOffers(
        basketCreditsResult,
        accounts,
      );
    }
    return basketCredits;
  }

  mapAdjustedBasketToItemCredits(basket, accounts): LoyaltyBreakdownObject {
    const itemCredits = { total: 0, offers: [] };
    const itemCreditsResult = basket.contents
      .filter((item) => item.adjudicationResults)
      .map((item) =>
        item.adjudicationResults.map((result) => ({
          ...result,
          sku: item.upc || item.sku,
        })),
      )
      .flat()
      .filter((result) => result.type === 'credit');
    if (itemCreditsResult.length) {
      itemCredits.total = itemCreditsResult.reduce(
        (acc, result) => result.balances.current + acc,
        0,
      );
      itemCredits.offers = this.getCreditOffers(itemCreditsResult, accounts);
    }
    return itemCredits;
  }

  private getCreditOffers(creditsResult, accounts): any[] {
    return this.deduplicateCreditOffers(
      creditsResult
        .filter((result) => result.balances.current)
        .map((result) => {
          return {
            name: accounts.find(
              (account) =>
                String(account.campaign.campaignId) ===
                String(result.resourceId),
            ).campaign.campaignName,
            amount: result.balances.current,
            sku: result.sku,
          };
        }),
    );
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
}
