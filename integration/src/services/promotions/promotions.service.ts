import { Injectable } from '@nestjs/common';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import {
  Cart,
  CartReference,
  DirectDiscountDraft,
} from '@commercetools/platform-sdk';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import { CircuitBreakerIntercept } from '../../decorators/circuit-breaker-intercept/circuit-breaker-intercept.decorator';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';
import { DiscountDescription } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';

@Injectable()
export class PromotionsService {
  public cartToBasketMapper = new CTCartToEEBasketMapper();

  constructor(
    private eagleEyeClient: EagleEyeApiClient,
    readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  async getDiscounts(cartReference: CartReference): Promise<{
    discounts: DirectDiscountDraft[];
    discountDescriptions: DiscountDescription[];
  }> {
    let discounts: DirectDiscountDraft[] = [];
    let discountDescriptions: DiscountDescription[] = [];

    const walletOpenResponse = await this.walletInvoke(
      'open',
      this.cartToBasketMapper.mapCartToWalletOpenPayload(cartReference.obj),
    );

    if (walletOpenResponse?.analyseBasketResults?.basket) {
      const basketLevelDiscounts = await this.getBasketLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartReference.obj,
      );
      if (basketLevelDiscounts.length) {
        discounts = discounts.concat(basketLevelDiscounts);
      }

      const itemLevelDiscounts = await this.getItemLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartReference.obj,
      );
      if (itemLevelDiscounts.length) {
        discounts = discounts.concat(itemLevelDiscounts);
      }
    }

    if (walletOpenResponse?.analyseBasketResults?.discount?.length) {
      const descriptions =
        this.cartToBasketMapper.mapBasketDiscountsToDiscountDescriptions(
          walletOpenResponse?.analyseBasketResults?.discount,
        );
      discountDescriptions = discountDescriptions.concat(descriptions);
    }

    return {
      discounts,
      discountDescriptions,
    };
  }

  async getBasketDiscountDescriptions(
    discounts,
  ): Promise<DiscountDescription[]> {
    let discountDescriptions: DiscountDescription[] = [];
    if (discounts?.length) {
      const descriptions =
        this.cartToBasketMapper.mapBasketDiscountsToDiscountDescriptions(
          discounts,
        );
      discountDescriptions = discountDescriptions.concat(descriptions);
    }
    return discountDescriptions;
  }

  async getBasketLevelDiscounts(
    basket,
    cart: Cart,
  ): Promise<DirectDiscountDraft[]> {
    let discountDrafts: DirectDiscountDraft[] = [];

    if (
      basket.summary?.totalDiscountAmount.promotions &&
      basket.summary?.adjustmentResults?.length
    ) {
      const cartDiscounts =
        this.cartToBasketMapper.mapAdjustedBasketToCartDirectDiscounts(
          basket,
          cart,
        );
      if (cartDiscounts.length) {
        discountDrafts = discountDrafts.concat(cartDiscounts);
      }
    }

    return discountDrafts;
  }

  async getItemLevelDiscounts(
    basket,
    cart: Cart,
  ): Promise<DirectDiscountDraft[]> {
    let discountDrafts: DirectDiscountDraft[] = [];

    if (
      basket?.summary?.totalDiscountAmount?.promotions &&
      basket.contents?.length
    ) {
      const itemDiscounts =
        this.cartToBasketMapper.mapAdjustedBasketToItemDirectDiscounts(
          basket,
          cart,
        );
      if (itemDiscounts.length) {
        discountDrafts = discountDrafts.concat(itemDiscounts);
      }
    }

    return discountDrafts;
  }

  @CircuitBreakerIntercept()
  async walletInvoke(method, args) {
    return await this.eagleEyeClient.wallet.invoke(method, args);
  }
}
