import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(PromotionService.name);
  constructor(
    private eagleEyeClient: EagleEyeApiClient,
    readonly circuitBreakerService: CircuitBreakerService,
    readonly cartToBasketMapper: CTCartToEEBasketMapper,
  ) {}

  async getDiscounts(cartReference: CartReference): Promise<{
    discounts: DirectDiscountDraft[];
    discountDescriptions: DiscountDescription[];
    errors: CustomFieldError[];
    enrichedBasket: any;
    voucherCodes: string[];
    potentialVoucherCodes: string[];
  }> {
    const discounts: DirectDiscountDraft[] = [];
    const discountDescriptions: DiscountDescription[] = [];
    const errors: CustomFieldError[] = [];

    let walletOpenResponse;
    let eeWalletOpenRequest;
    try {
      eeWalletOpenRequest =
        await this.cartToBasketMapper.mapCartToWalletOpenPayload(
          cartReference.obj,
          true,
        );
      this.logger.debug({
        message: 'Sending open request to EagleEye with body',
        eeWalletOpenRequest,
      });
      walletOpenResponse = await this.walletInvoke('open', eeWalletOpenRequest);
    } catch (error) {
      this.logger.warn('Error while opening the wallet', error);
      if (error.type === 'EE_IDENTITY_NOT_FOUND') {
        const errorMessage =
          cartReference.obj.custom?.fields['eagleeye-identityValue'] +
          ' - Customer identity not found';

        this.logger.warn(errorMessage);
        const unidentifiedCustomerError: CustomFieldError = {
          type: 'EE_API_CUSTOMER_NF',
          message: errorMessage,
          context: error,
        };
        errors.push(unidentifiedCustomerError);
        try {
          this.logger.warn(
            'Attempting to fetch open promotions without identity',
          );
          eeWalletOpenRequest =
            await this.cartToBasketMapper.mapCartToWalletOpenPayload(
              cartReference.obj,
              false,
            );
          this.logger.debug({
            message: 'Sending open request to EagleEye with body',
            eeWalletOpenRequest,
          });
          walletOpenResponse = await this.walletInvoke(
            'open',
            eeWalletOpenRequest,
          );
        } catch (error) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (walletOpenResponse.data?.analyseBasketResults?.basket) {
      const basketLevelDiscounts = await this.getBasketLevelDiscounts(
        walletOpenResponse.data.analyseBasketResults.basket,
        cartReference.obj,
      );
      const itemLevelDiscounts = await this.getItemLevelDiscounts(
        walletOpenResponse.data.analyseBasketResults.basket,
        cartReference.obj,
      );
      const shippingDiscounts = await this.getShippingDiscounts(
        walletOpenResponse.data.analyseBasketResults.basket,
        cartReference.obj,
      );
      discounts.push(
        ...basketLevelDiscounts,
        ...itemLevelDiscounts,
        ...shippingDiscounts,
      );
    }
    const examineTokenErrors =
      walletOpenResponse.data.examine
        ?.filter((entry) => entry.errorCode)
        .map((error) => {
          return {
            type: `EE_API_TOKEN_${error.errorCode}`,
            message: error.errorMessage,
            context: error,
          };
        }) || [];

    errors.push(...examineTokenErrors);

    const validTokens =
      walletOpenResponse.data.examine
        ?.filter((entry) => !entry.errorCode)
        .map((result) => result.value) || [];

    const invalidTokens =
      walletOpenResponse.data.examine
        ?.filter((entry) => entry.errorCode === 'PCEXNV')
        .map((result) => result.value) || [];

    if (walletOpenResponse.data?.analyseBasketResults?.discount?.length) {
      const descriptions =
        this.cartToBasketMapper.mapBasketDiscountsToDiscountDescriptions(
          walletOpenResponse.data?.analyseBasketResults?.discount,
        );
      discountDescriptions.push(...descriptions);
    }

    return {
      discounts,
      discountDescriptions,
      errors,
      enrichedBasket: walletOpenResponse.data?.analyseBasketResults?.basket,
      voucherCodes: validTokens,
      potentialVoucherCodes: invalidTokens,
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
