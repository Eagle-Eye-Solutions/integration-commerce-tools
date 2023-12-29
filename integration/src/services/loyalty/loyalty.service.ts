import { Injectable } from '@nestjs/common';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import {
  LoyaltyBalanceObject,
  LoyaltyEarnAndCredits,
} from '../../types/loyalty-earn-credits.type';

@Injectable()
export class LoyaltyService {
  constructor(readonly cartToBasketMapper: CTCartToEEBasketMapper) {}

  async getEarnAndCredits(
    walletOpenResponse: any,
  ): Promise<LoyaltyEarnAndCredits> {
    const earnAndCredits = {
      earn: {
        basket: {
          balance: 0,
          offers: [],
        },
      },
      credit: {
        basket: {
          balance: 0,
          offers: [],
        },
        items: {
          balance: 0,
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
    return earnAndCredits;
  }

  getBasketLevelEarn(basket): LoyaltyBalanceObject {
    if (
      basket.summary.adjudicationResults &&
      basket.summary.adjudicationResults.length
    ) {
      const baseEarn =
        this.cartToBasketMapper.mapAdjustedBasketToBasketEarn(basket);
      return baseEarn;
    }

    return { balance: 0, offers: [] };
  }

  getBasketLevelCredits(basket, accounts): LoyaltyBalanceObject {
    if (
      basket.summary.adjudicationResults &&
      basket.summary.adjudicationResults.length
    ) {
      const basketCredits =
        this.cartToBasketMapper.mapAdjustedBasketToBasketCredits(
          basket,
          accounts,
        );
      return basketCredits;
    }

    return { balance: 0, offers: [] };
  }
}
