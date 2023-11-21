import {
  Cart,
  LineItem,
  DirectDiscountDraft,
} from '@commercetools/platform-sdk';
import { DiscountDescription } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';

export class CTCartToEEBasketMapper {
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

  mapCartToWalletOpenPayload(cart: Cart) {
    // Get a default identity to open the wallet
    // TODO: make configurable on a per-merchant basis
    const identities = [];
    if (cart.customerEmail) {
      identities.push({
        type: 'CUSTOMER_ID',
        value: cart.customerEmail,
      });
    }

    return {
      reference: cart.id,
      identity: identities[0]
        ? {
            identityValue: identities[0].value,
          }
        : undefined,
      // TODO: check in which cases this may need to be true and if configuration is required.
      lock: false,
      // TODO: check if this needs to be customizable by the merchant.
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      // TODO: check if configuration to enable/disable open offers is needed.
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
        contents: this.mapCartLineItemsToBasketContent(cart.lineItems),
      },
    };
  }
}
