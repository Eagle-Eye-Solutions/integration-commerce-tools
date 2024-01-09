import {
  CartSetDirectDiscountsAction,
  DirectDiscountDraft,
} from '@commercetools/platform-sdk';

export class CartDiscountActionBuilder {
  static addDiscount(
    discounts: DirectDiscountDraft[],
  ): CartSetDirectDiscountsAction {
    return {
      action: 'setDirectDiscounts',
      discounts,
    };
  }

  static removeDiscounts(): CartSetDirectDiscountsAction {
    return {
      action: 'setDirectDiscounts',
      discounts: [],
    };
  }
}
