import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
  BaseResource,
  TypeReference,
  LineItem,
} from '@commercetools/platform-sdk';
import {
  LOYALTY_CREDIT_TYPE,
  LoyaltyBreakdownObject,
  LoyaltyOfferBreakdown,
} from '../../../../../adjudication/types/loyalty-earn-credits.type';
import { LineItemPromotions } from '../../../../../adjudication/types/promotions';
import { FIELD_EAGLEEYE_LOYALTY_CREDITS } from '../../custom-type/line-item-type-definition';
import { FIELD_EAGLEEYE_APPLIED_DISCOUNTS } from '../../custom-type/cart-type-definition';

export interface CustomFieldsObject {
  loyaltyCredits?: LoyaltyBreakdownObject;
  promotions?: LineItemPromotions;
}

export class LineItemCustomTypeActionBuilder {
  static addCustomType = (
    customFieldsObject: CustomFieldsObject,
    lineItems: LineItem[],
    lineItemTypeKey: string,
  ): OrderUpdateAction[] => {
    const actions: OrderUpdateAction[] = [];
    lineItems.forEach((lineItem) => {
      const customFields = {};

      this.addCustomTypeLoyaltyFields(
        customFieldsObject,
        lineItem,
        customFields,
      );

      this.addCustomTypePromotionFields(
        customFieldsObject,
        lineItem,
        customFields,
      );

      actions.push({
        action: 'setLineItemCustomType',
        lineItemId: lineItem.id,
        type: {
          typeId: 'type',
          key: lineItemTypeKey,
        },
        fields: customFields,
      });
    });

    return actions;
  };

  static setCustomFields = (
    customFieldsObject: CustomFieldsObject,
    lineItems: LineItem[],
  ): OrderUpdateAction[] => {
    const actions: OrderUpdateAction[] = [];
    lineItems.forEach((lineItem) => {
      this.addLoyaltyFields(customFieldsObject, lineItem, actions);
      this.addPromotionFields(customFieldsObject, lineItem, actions);
    });

    return actions;
  };

  private static addCustomTypeLoyaltyFields(
    customFieldsObject: CustomFieldsObject,
    lineItem: LineItem,
    customFields,
  ) {
    if (
      customFieldsObject.loyaltyCredits?.total ||
      isOfferInProgress(customFieldsObject)
    ) {
      const lineItemCreditOffers =
        customFieldsObject.loyaltyCredits.offers.filter(
          (offer) => offer.sku === lineItem.variant.sku,
        );
      if (lineItemCreditOffers.length) {
        const lineItemCreditTotal = lineItemCreditOffers.reduce(
          (acc, offer) => offer.amount * offer.timesRedeemed + acc,
          0,
        );
        customFields[FIELD_EAGLEEYE_LOYALTY_CREDITS] = JSON.stringify({
          total: lineItemCreditTotal,
          offers: lineItemCreditOffers,
        });
      }
    } else {
      customFields[FIELD_EAGLEEYE_LOYALTY_CREDITS] = '';
    }
  }

  private static addCustomTypePromotionFields(
    customFieldsObject: CustomFieldsObject,
    lineItem: LineItem,
    customFields,
  ) {
    if (
      customFieldsObject.promotions?.appliedDiscounts?.has(lineItem.variant.sku)
    ) {
      customFields[FIELD_EAGLEEYE_APPLIED_DISCOUNTS] =
        customFieldsObject.promotions.appliedDiscounts.get(
          lineItem.variant.sku,
        );
    } else {
      customFields[FIELD_EAGLEEYE_APPLIED_DISCOUNTS] = '';
    }
  }

  private static addPromotionFields(
    customFieldsObject: CustomFieldsObject,
    lineItem: LineItem,
    actions: OrderUpdateAction[],
  ) {
    console.log('promo fields', customFieldsObject.promotions);
    if (
      customFieldsObject.promotions?.appliedDiscounts?.has(lineItem.variant.sku)
    ) {
      actions.push({
        action: 'setLineItemCustomField',
        lineItemId: lineItem.id,
        name: FIELD_EAGLEEYE_APPLIED_DISCOUNTS,
        value: customFieldsObject.promotions.appliedDiscounts.get(
          lineItem.variant.sku,
        ),
      });
    } else {
      actions.push({
        action: 'setLineItemCustomField',
        lineItemId: lineItem.id,
        name: FIELD_EAGLEEYE_APPLIED_DISCOUNTS,
        value: '',
      });
    }
  }

  private static addLoyaltyFields(
    customFieldsObject: CustomFieldsObject,
    lineItem: LineItem,
    actions: OrderUpdateAction[],
  ) {
    if (
      customFieldsObject.loyaltyCredits?.total ||
      isOfferInProgress(customFieldsObject)
    ) {
      const lineItemCreditOffers =
        customFieldsObject.loyaltyCredits.offers.filter(
          (offer) => offer.sku === lineItem.variant.sku,
        );
      if (lineItemCreditOffers.length) {
        const lineItemCreditTotal = lineItemCreditOffers.reduce(
          (acc, offer) => offer.amount * offer.timesRedeemed + acc,
          0,
        );
        actions.push({
          action: 'setLineItemCustomField',
          lineItemId: lineItem.id,
          name: FIELD_EAGLEEYE_LOYALTY_CREDITS,
          value: JSON.stringify({
            total: lineItemCreditTotal,
            offers: lineItemCreditOffers,
          }),
        });
      }
    } else {
      actions.push({
        action: 'setLineItemCustomField',
        lineItemId: lineItem.id,
        name: FIELD_EAGLEEYE_LOYALTY_CREDITS,
        value: '',
      });
    }
  }

  static removeCustomType = (): OrderSetCustomTypeAction => ({
    action: 'setCustomType',
  });

  static checkResourceCustomType = (
    resource: BaseResource,
  ): TypeReference | undefined => {
    return (resource as any).custom?.type;
  };
}

function isOfferInProgress(
  customFieldsObject: CustomFieldsObject,
): LoyaltyOfferBreakdown {
  return customFieldsObject.loyaltyCredits?.offers.find(
    (offer) => offer.type === LOYALTY_CREDIT_TYPE.IN_PROGRESS,
  );
}
