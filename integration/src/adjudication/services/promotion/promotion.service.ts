import { Injectable } from '@nestjs/common';
import {
  Cart,
  CartReference,
  DirectDiscountDraft,
} from '@commercetools/platform-sdk';
import { AdjudicationMapper } from '../../mappers/adjudication.mapper';
import {
  CustomFieldError,
  DiscountDescription,
} from '../../../common/providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { CampaignNameService } from './campaign-name.service';

@Injectable()
export class PromotionService {
  constructor(
    readonly adjudicationMapper: AdjudicationMapper,
    private readonly campaignNameService: CampaignNameService,
  ) {}

  async getDiscounts(
    walletOpenResponse: any,
    cartReference: CartReference,
  ): Promise<{
    discounts: DirectDiscountDraft[];
    basketDiscountDescriptions: DiscountDescription[];
    lineItemsDiscountDescriptions: Map<string, string[]>; //product id to campaign names
    errors: CustomFieldError[];
    enrichedBasket: any;
    voucherCodes: string[];
    potentialVoucherCodes: string[];
  }> {
    const discounts: DirectDiscountDraft[] = [];
    const errors: CustomFieldError[] = [];

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
    const basketDiscountDescriptions: DiscountDescription[] =
      this.campaignNameService.getBasketCampaignNames(walletOpenResponse);
    const lineItemsDiscountDescriptions =
      this.campaignNameService.getLineItemsCampaignNames(walletOpenResponse);

    return {
      discounts,
      basketDiscountDescriptions,
      lineItemsDiscountDescriptions,
      errors,
      enrichedBasket: walletOpenResponse.data?.analyseBasketResults?.basket,
      voucherCodes: validTokens,
      potentialVoucherCodes: invalidTokens,
    };
  }

  async getBasketLevelDiscounts(
    basket,
    cart: Cart,
  ): Promise<DirectDiscountDraft[]> {
    if (
      basket.summary?.totalDiscountAmount.promotions &&
      basket.summary?.adjustmentResults?.length
    ) {
      return this.adjudicationMapper.mapAdjustedBasketToCartDirectDiscounts(
        basket,
        cart,
      );
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
      return this.adjudicationMapper.mapAdjustedBasketToItemDirectDiscounts(
        basket,
        cart,
      );
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
      return this.adjudicationMapper.mapAdjustedBasketToShippingDirectDiscounts(
        basket,
        cart,
      );
    }

    return [];
  }
}
