import { Injectable } from '@nestjs/common';
import { LoyaltyMapper } from '../../mappers/loyalty.mapper';
import {
  LoyaltyBreakdownObject,
  LoyaltyTotalObject,
  LoyaltyEarnAndCredits,
} from '../../types/loyalty-earn-credits.type';

@Injectable()
export class LoyaltyService {
  constructor(readonly loyaltyMapper: LoyaltyMapper) {}

  async getEarnAndCredits(
    walletOpenResponse: any,
  ): Promise<LoyaltyEarnAndCredits> {
    const earnAndCredits = {
      earn: {
        basket: {
          total: 0,
        },
      },
      credit: {
        basket: {
          total: 0,
          offers: [],
        },
        items: {
          total: 0,
          offers: [],
        },
      },
    };
    if (
      walletOpenResponse.data?.analyseBasketResults?.basket?.summary
        .adjudicationResults
    ) {
      earnAndCredits.earn.basket = this.getBasketLevelEarn(
        walletOpenResponse.data.analyseBasketResults.basket,
      );
      earnAndCredits.credit.basket = this.getBasketLevelCredits(
        walletOpenResponse.data.analyseBasketResults.basket,
        walletOpenResponse.data.accounts,
      );
    }
    if (
      walletOpenResponse.data?.analyseBasketResults?.basket?.contents?.find(
        (item) => item.adjudicationResults,
      )
    ) {
      earnAndCredits.credit.items = this.getItemLevelCredits(
        walletOpenResponse.data.analyseBasketResults.basket,
        walletOpenResponse.data.accounts,
      );
    }
    return earnAndCredits;
  }

  getBasketLevelEarn(basket): LoyaltyTotalObject {
    if (
      basket.summary.adjudicationResults &&
      basket.summary.adjudicationResults.length
    ) {
      const baseEarn = this.loyaltyMapper.mapAdjustedBasketToBasketEarn(basket);
      return baseEarn;
    }

    return { total: 0 };
  }

  getBasketLevelCredits(basket, accounts): LoyaltyBreakdownObject {
    if (
      basket.summary.adjudicationResults &&
      basket.summary.adjudicationResults.length
    ) {
      const basketCredits = this.loyaltyMapper.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );
      return basketCredits;
    }

    return { total: 0, offers: [] };
  }

  getItemLevelCredits(basket, accounts): LoyaltyBreakdownObject {
    const anyItemCredits = basket.contents.find(
      (item) => item.adjudicationResults,
    )?.adjudicationResults;
    if (anyItemCredits && anyItemCredits.length) {
      const itemCredits = this.loyaltyMapper.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );
      return itemCredits;
    }

    return { total: 0, offers: [] };
  }
}
