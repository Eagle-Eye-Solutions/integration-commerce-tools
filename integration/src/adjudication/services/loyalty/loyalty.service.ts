import { Injectable } from '@nestjs/common';
import { LoyaltyMapper } from '../../mappers/loyalty.mapper';
import {
  LoyaltyBreakdownObject,
  LoyaltyEarnAndCredits,
  LoyaltyTotalObject,
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
    if (basket.summary.adjudicationResults?.length) {
      return this.loyaltyMapper.mapAdjustedBasketToBasketEarn(basket);
    }

    return { total: 0 };
  }

  getBasketLevelCredits(basket, accounts): LoyaltyBreakdownObject {
    if (basket.summary.adjudicationResults?.length) {
      return this.loyaltyMapper.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );
    }

    return { total: 0, offers: [] };
  }

  getItemLevelCredits(basket, accounts): LoyaltyBreakdownObject {
    const anyItemCredits = basket.contents.find(
      (item) => item.adjudicationResults,
    )?.adjudicationResults;
    if (anyItemCredits?.length) {
      return this.loyaltyMapper.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );
    }

    return { total: 0, offers: [] };
  }
}
