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
import {
  CustomFieldError,
  DiscountDescription,
} from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';

@Injectable()
export class PromotionService {
  constructor(
    private eagleEyeClient: EagleEyeApiClient,
    readonly circuitBreakerService: CircuitBreakerService,
    readonly cartToBasketMapper: CTCartToEEBasketMapper,
  ) {}

  async getDiscounts(cartReference: CartReference): Promise<{
    discounts: DirectDiscountDraft[];
    discountDescriptions: DiscountDescription[];
    errors: CustomFieldError[];
  }> {
    const discounts: DirectDiscountDraft[] = [];
    const discountDescriptions: DiscountDescription[] = [];
    const errors: CustomFieldError[] = [];

    const walletOpenResponse = await this.walletInvoke(
      'open',
      await this.cartToBasketMapper.mapCartToWalletOpenPayload(
        cartReference.obj,
      ),
    );

    if (walletOpenResponse?.analyseBasketResults?.basket) {
      const basketLevelDiscounts = await this.getBasketLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartReference.obj,
      );
      const itemLevelDiscounts = await this.getItemLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartReference.obj,
      );
      const shippingDiscounts = await this.getShippingDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartReference.obj,
      );
      discounts.push(
        ...basketLevelDiscounts,
        ...itemLevelDiscounts,
        ...shippingDiscounts,
      );
    }

    const examineTokenErrors =
      walletOpenResponse.examine
        ?.filter((entry) => entry.errorCode)
        .map((error) => {
          return {
            type: `EE_API_TOKEN_${error.errorCode}`,
            message: error.errorMessage,
            context: error,
          };
        }) || [];

    errors.push(...examineTokenErrors);

    if (walletOpenResponse?.analyseBasketResults?.discount?.length) {
      const descriptions =
        this.cartToBasketMapper.mapBasketDiscountsToDiscountDescriptions(
          walletOpenResponse?.analyseBasketResults?.discount,
        );
      discountDescriptions.push(...descriptions);
    }

    return {
      discounts,
      discountDescriptions,
      errors,
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
    if (
      basket.summary?.totalDiscountAmount.promotions &&
      basket.summary?.adjustmentResults?.length
    ) {
      const cartDiscounts =
        this.cartToBasketMapper.mapAdjustedBasketToCartDirectDiscounts(
          basket,
          cart,
        );
      return cartDiscounts;
    }

    return [];
  }

  async getItemLevelDiscounts(
    basket,
    cart: Cart,
  ): Promise<DirectDiscountDraft[]> {
    if (
      basket?.summary?.totalDiscountAmount?.promotions &&
      basket.contents?.length
    ) {
      const itemDiscounts =
        this.cartToBasketMapper.mapAdjustedBasketToItemDirectDiscounts(
          basket,
          cart,
        );
      return itemDiscounts;
    }

    return [];
  }

  async getShippingDiscounts(
    basket,
    cart: Cart,
  ): Promise<DirectDiscountDraft[]> {
    if (
      basket?.summary?.totalDiscountAmount?.promotions &&
      basket.contents?.length
    ) {
      const shippingDiscounts =
        this.cartToBasketMapper.mapAdjustedBasketToShippingDirectDiscounts(
          basket,
          cart,
        );
      return shippingDiscounts;
    }

    return [];
  }

  @CircuitBreakerIntercept()
  async walletInvoke(method, args) {
    return await this.eagleEyeClient.wallet.invoke(method, args);
  }
}
