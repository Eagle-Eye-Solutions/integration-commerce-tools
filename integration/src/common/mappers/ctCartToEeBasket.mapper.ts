import { Injectable } from '@nestjs/common';
import {
  Cart,
  LineItem,
  DirectDiscountDraft,
  ShippingInfo,
} from '@commercetools/platform-sdk';
import { DiscountDescription } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { ConfigService } from '@nestjs/config';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';

@Injectable()
export class CTCartToEEBasketMapper {
  constructor(
    readonly configService: ConfigService,
    readonly commercetools: Commercetools,
  ) {}

  mapCartLineItemsToBasketContent(lineItems: LineItem[]) {
    let basketContents = [];
    const mappedLineItems = lineItems.map((item) => {
      return this.mapLineItemToBasketItem(item);
    });
    basketContents = basketContents.concat(mappedLineItems);
    return basketContents;
  }

  mapLineItemToBasketItem(lineItem: LineItem) {
    return {
      upc: lineItem.variant.sku,
      itemUnitCost: lineItem.price.value.centAmount,
      totalUnitCostAfterDiscount: lineItem.totalPrice.centAmount,
      totalUnitCost: lineItem.totalPrice.centAmount,
      description: lineItem.name[Object.keys(lineItem.name)[0]], // TODO: handle locales
      itemUnitMetric: 'EACH',
      itemUnitCount: lineItem.quantity,
      salesKey: 'SALE',
    };
  }

  mapAdjustedBasketToCartDirectDiscounts(
    basket,
    cart: Cart,
  ): DirectDiscountDraft[] {
    return basket.summary.adjustmentResults.map((discount) => {
      return {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: discount.value,
              currencyCode: cart.totalPrice.currencyCode,
              type: cart.totalPrice.type,
              fractionDigits: cart.totalPrice.fractionDigits,
            },
          ],
        },
        target: {
          type: 'totalPrice' as any, // Casting to skip checks, totalPrice is a BETA feature
        },
      };
    });
  }

  mapBasketDiscountsToDiscountDescriptions(discounts): DiscountDescription[] {
    return discounts.map((discount) => {
      return {
        description: discount.campaignName,
      };
    });
  }

  mapAdjustedBasketToItemDirectDiscounts(
    basket,
    cart: Cart,
  ): DirectDiscountDraft[] {
    return basket.contents
      .map((item) => {
        const cartLineItem = cart.lineItems.find(
          (lineItem) => lineItem.variant.sku === item.upc,
        );
        if (cartLineItem) {
          return item.adjustmentResults?.map((adjustment) => {
            return {
              value: {
                type: 'absolute',
                money: [
                  {
                    centAmount: adjustment.totalDiscountAmount,
                    currencyCode: cartLineItem.totalPrice.currencyCode,
                    type: cartLineItem.totalPrice.type,
                    fractionDigits: cartLineItem.totalPrice.fractionDigits,
                  },
                ],
              },
              target: {
                type: 'lineItems',
                predicate: `sku="${item.upc}"`,
              },
            };
          });
        }
      })
      .flat()
      .filter((discount) => discount !== undefined);
  }

  mapAdjustedBasketToShippingDirectDiscounts(
    basket,
    cart: Cart,
  ): DirectDiscountDraft[] {
    const shippingMethodMap = this.configService.get(
      'eagleEye.shippingMethodMap',
    );

    return basket.contents
      .map((item) => {
        const matchingMethod = shippingMethodMap.find(
          (method) => method.upc === item.upc,
        );
        if (matchingMethod) {
          return item.adjustmentResults?.map((adjustment) => {
            return {
              value: {
                type: 'absolute',
                money: [
                  {
                    centAmount: adjustment.totalDiscountAmount,
                    currencyCode: cart.totalPrice.currencyCode,
                    type: cart.totalPrice.type,
                    fractionDigits: cart.totalPrice.fractionDigits,
                  },
                ],
              },
              target: {
                type: 'shipping',
              },
            };
          });
        }
      })
      .flat()
      .filter((discount) => discount !== undefined);
  }

  async mapShippingMethodSkusToBasketItems(
    shippingInfo: ShippingInfo,
  ): Promise<Record<string, any>> {
    const shippingMethodMap = this.configService.get(
      'eagleEye.shippingMethodMap',
    );
    if (shippingMethodMap.length && shippingInfo?.shippingMethod) {
      // In case multi-shipping method needs to be supported
      const shippingIds = [shippingInfo?.shippingMethod.id];
      const shippingMethod = await this.commercetools.getShippingMethods({
        queryArgs: {
          where: `id in ("${shippingIds.join('","')}")`,
        },
      });
      const matchingMethod = shippingMethodMap.find(
        (method) => method.key === shippingMethod[0].key,
      );
      if (matchingMethod) {
        return {
          upc: matchingMethod.upc,
          itemUnitCost: shippingInfo.price.centAmount,
          totalUnitCostAfterDiscount: shippingInfo.price.centAmount,
          totalUnitCost: shippingInfo.price.centAmount,
          description: shippingInfo.shippingMethodName, // TODO: handle locales, shippingMethod.localizedName
          itemUnitMetric: 'EACH',
          itemUnitCount: 1,
          salesKey: 'SALE',
        };
      }
    }
    return {};
  }

  mapVoucherCodesToCampaignTokens(
    voucherCodes: string[],
  ): { type: 'TOKEN'; value: string }[] {
    return voucherCodes.map((code) => {
      return {
        type: 'TOKEN',
        value: code,
      };
    });
  }

  async mapCartToWalletOpenPayload(cart: Cart) {
    // Get a default identity to open the wallet
    // TODO: make configurable on a per-merchant basis
    const identities = [];
    // if (cart.customerEmail) {
    //   identities.push({
    //     type: 'CUSTOMER_ID',
    //     value: cart.customerEmail,
    //   });
    // }

    const basketContents = [
      ...this.mapCartLineItemsToBasketContent(cart.lineItems),
    ];
    const shippingDiscountItem = await this.mapShippingMethodSkusToBasketItems(
      cart.shippingInfo,
    );
    if (shippingDiscountItem.upc) {
      basketContents.push(shippingDiscountItem);
    }
    const incomingIdentifier = this.configService.get(
      'eagleEye.incomingIdentifier',
    );
    const parentIncomingIdentifier = this.configService.get(
      'eagleEye.parentIncomingIdentifier',
    );

    const voucherCodes: string[] = cart.custom?.fields['eagleeye-voucherCodes'];

    return {
      reference: cart.id,
      identity: identities[0]
        ? {
            identityValue: identities[0].value,
          }
        : undefined,
      lock: true,
      location: {
        incomingIdentifier,
        ...(parentIncomingIdentifier && { parentIncomingIdentifier }),
      },
      examine: voucherCodes?.length
        ? this.mapVoucherCodesToCampaignTokens(voucherCodes)
        : undefined,
      options: {
        adjustBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
        analyseBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
      },
      basket: {
        type: 'STANDARD',
        summary: {
          redemptionChannel: 'Online',
          totalDiscountAmount: {
            general: null,
            staff: null,
            promotions: 0,
          },
          totalItems: cart.lineItems.length,
          totalBasketValue: cart.totalPrice.centAmount,
        },
        contents: basketContents,
      },
    };
  }
}
