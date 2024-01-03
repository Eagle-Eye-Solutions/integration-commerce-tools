import { Injectable, Inject } from '@nestjs/common';
import {
  Cart,
  LineItem,
  DirectDiscountDraft,
  ShippingInfo,
  Order,
} from '@commercetools/platform-sdk';
import { DiscountDescription } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { ConfigService } from '@nestjs/config';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { BasketStoreService } from '../../services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from '../../services/basket-store/basket-store.provider';
import {
  LoyaltyBreakdownObject,
  LoyaltyTotalObject,
} from '../../types/loyalty-earn-credits.type';

export type BasketItem = {
  itemUnitCost: number;
  totalUnitCostAfterDiscount: number;
  totalUnitCost: number;
  description: string;
  itemUnitMetric: string;
  itemUnitCount: number;
  salesKey: string;
  sku?: string;
  upc?: string;
};

@Injectable()
export class CTCartToEEBasketMapper {
  constructor(
    readonly configService: ConfigService,
    readonly commercetools: Commercetools,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
  ) {}

  mapCartLineItemsToBasketContent(lineItems: LineItem[]) {
    let basketContents = [];
    const mappedLineItems = lineItems?.map((item) => {
      return this.mapLineItemToBasketItem(item);
    });
    basketContents = basketContents.concat(mappedLineItems);
    return basketContents;
  }

  mapLineItemToBasketItem(lineItem: LineItem) {
    const basketItem: BasketItem = {
      itemUnitCost: lineItem.price.value.centAmount,
      totalUnitCostAfterDiscount:
        lineItem.price.value.centAmount * lineItem.quantity,
      totalUnitCost: lineItem.price.value.centAmount * lineItem.quantity,
      description: lineItem.name[Object.keys(lineItem.name)[0]],
      itemUnitMetric: 'EACH',
      itemUnitCount: lineItem.quantity,
      salesKey: 'SALE',
    };
    if (this.configService.get<boolean>('eagleEye.useItemSku')) {
      basketItem.sku = lineItem.variant.sku;
    } else {
      basketItem.upc = lineItem.variant.sku;
    }
    return basketItem;
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
          type: 'totalPrice' as any,
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
        const matchingMethod = shippingMethodMap?.find(
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
    if (shippingMethodMap?.length && shippingInfo?.shippingMethod) {
      const shippingIds = [shippingInfo.shippingMethod.id];
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
          description: shippingInfo.shippingMethodName,
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
    return voucherCodes
      .filter((v) => v)
      .map((code) => {
        return {
          type: 'TOKEN',
          value: code,
        };
      });
  }

  async mapCartToWalletOpenPayload(cart: Cart, includeIdentity: boolean) {
    let identity;
    if (includeIdentity) {
      identity = cart.custom?.fields
        ? cart.custom?.fields['eagleeye-identityValue']
        : undefined;
    }

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

    const voucherCodes: string[] = cart.custom?.fields
      ? cart.custom?.fields['eagleeye-voucherCodes'] || []
      : [];
    const potentialVoucherCodes: string[] = cart.custom?.fields
      ? cart.custom?.fields['eagleeye-potentialVoucherCodes'] || []
      : [];
    const examineTokens = this.mapVoucherCodesToCampaignTokens([
      ...new Set([...voucherCodes, ...potentialVoucherCodes]),
    ]);
    const excludeUnidentifiedCustomers = this.configService.get<boolean>(
      'eagleEye.excludeUnidentifiedCustomers',
    );
    return {
      reference: cart.id,
      ...(identity ? { identity: { identityValue: identity } } : {}),
      lock: true,
      location: {
        incomingIdentifier,
        ...(parentIncomingIdentifier && { parentIncomingIdentifier }),
      },
      examine: examineTokens?.length ? examineTokens : undefined,
      options: {
        adjustBasket: {
          includeOpenOffers: !excludeUnidentifiedCustomers,
          enabled: true,
        },
        analyseBasket: {
          includeOpenOffers: !excludeUnidentifiedCustomers,
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
          totalItems: cart.lineItems?.reduce(
            (acc, lineItem) => lineItem.quantity + acc,
            0,
          ),
          totalBasketValue:
            cart.lineItems?.reduce(
              (acc, lineItem) =>
                lineItem.price.value.centAmount * lineItem.quantity + acc,
              0,
            ) + (cart.shippingInfo?.price?.centAmount ?? 0),
        },
        contents: basketContents,
      },
    };
  }

  async mapOrderToWalletSettlePayload(order: Order) {
    const incomingIdentifier = this.configService.get(
      'eagleEye.incomingIdentifier',
    );
    const parentIncomingIdentifier = this.configService.get(
      'eagleEye.parentIncomingIdentifier',
    );

    const identity = order.custom?.fields['eagleeye-identityValue'];

    const enrichedBasket = (await this.basketStoreService.get(order.cart.id))
      .enrichedBasket;

    return {
      mode: 'ACTIVE',
      reference: order.cart.id,
      ...(identity ? { identity: { identityValue: identity } } : {}),
      location: {
        incomingIdentifier,
        ...(parentIncomingIdentifier && { parentIncomingIdentifier }),
      },
      basket: enrichedBasket,
    };
  }

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
