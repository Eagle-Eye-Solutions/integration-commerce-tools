import { CartSetDirectDiscountsAction } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';

export class CartDiscountActionBuilder {
  static addDiscount(): CartSetDirectDiscountsAction {
    return {
      action: 'setDirectDiscounts',
      discounts: [
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 100,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'lineItems',
            predicate: '1=1',
          },
        },
      ],
    };
  }

  static removeDiscounts(): CartSetDirectDiscountsAction {
    return {
      action: 'setDirectDiscounts',
      discounts: [],
    };
  }
}
