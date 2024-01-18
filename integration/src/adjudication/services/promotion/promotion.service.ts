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

@Injectable()
export class PromotionService {
  constructor(readonly adjudicationMapper: AdjudicationMapper) {}

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
      this.getBasketCampaignNames(walletOpenResponse);
    const lineItemsDiscountDescriptions =
      this.getLineItemsCampaignNames(walletOpenResponse);

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

  private getBasketCampaignNames(
    walletOpenResponse: any,
  ): DiscountDescription[] {
    const resourceIds =
      walletOpenResponse.data?.analyseBasketResults?.basket?.summary?.adjustmentResults?.map(
        (result) => result.resourceId,
      );
    if (resourceIds?.length) {
      return walletOpenResponse.data?.analyseBasketResults?.discount
        ?.filter((discount) => resourceIds.includes(discount.campaignId))
        .map((discount) =>
          this.adjudicationMapper.mapBasketDiscountsToDiscountDescription(
            discount,
          ),
        );
    }
    return [];
  }

  private getLineItemsCampaignNames(
    walletOpenResponse: any,
  ): Map<string, string[]> {
    const productIdToCampaignNamesMap: Map<string, string[]> = new Map();

    const resourceIdToProductIdMaps = new Map<string, string>();
    console.log(
      'walletOpenResponse.data?.analyseBasketResults?.contents',
      walletOpenResponse.data?.analyseBasketResults?.basket?.contents,
    );
    walletOpenResponse.data?.analyseBasketResults?.basket?.contents?.forEach(
      (content) => {
        content.adjustmentResults?.forEach((result) => {
          resourceIdToProductIdMaps.set(result.resourceId, content.upc); //todo check if upc is correct, maybe need to use sku based on property, add util class to do this logic
        });
      },
    );

    if (resourceIdToProductIdMaps.size) {
      walletOpenResponse.data?.analyseBasketResults?.discount?.forEach(
        (discount) => {
          if (resourceIdToProductIdMaps.has(discount.campaignId)) {
            if (
              productIdToCampaignNamesMap.has(
                resourceIdToProductIdMaps.get(discount.campaignId),
              )
            ) {
              productIdToCampaignNamesMap.set(
                resourceIdToProductIdMaps.get(discount.campaignId),
                [
                  ...productIdToCampaignNamesMap.get(
                    resourceIdToProductIdMaps.get(discount.campaignId),
                  ),
                  discount.campaignName,
                ],
              );
            } else {
              productIdToCampaignNamesMap.set(
                resourceIdToProductIdMaps.get(discount.campaignId),
                [discount.campaignName],
              );
            }
          }
        },
      );
    }
    return productIdToCampaignNamesMap;
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
