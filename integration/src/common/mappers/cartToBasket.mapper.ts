import {
  Cart,
  LineItem,
  DirectDiscountDraft,
} from '@commercetools/platform-sdk';
import { DiscountDescription } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';

export class CartToBasketMapper {
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
    };
  }

  mapAdjustedBasketToCartDirectDiscount(
    basket,
    cart: Cart,
  ): DirectDiscountDraft {
    return {
      value: {
        type: 'absolute',
        money: [
          {
            centAmount: basket.summary.totalDiscountAmount.promotions,
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
    return basket.summary.adjustmentResults
      .map((item) => {
        const cartLineItem = cart.lineItems.find(
          (lineItem) => lineItem.variant.sku === item.upc,
        );
        if (cartLineItem) {
          return item.adjustmentResults.map((adjustment) => {
            return {
              value: {
                type: 'absolute',
                money: [
                  {
                    centAmount: adjustment.discountAmount,
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
}
