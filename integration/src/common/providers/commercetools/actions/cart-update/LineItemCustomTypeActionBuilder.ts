import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
  BaseResource,
  TypeReference,
  LineItem,
} from '@commercetools/platform-sdk';
import { LoyaltyBreakdownObject } from '../../../../../adjudication/types/loyalty-earn-credits.type';
import { FIELD_EAGLEEYE_LOYALTY_CREDITS } from '../../custom-type/line-item-type-definition';

interface CustomFieldsObject {
  loyaltyCredits?: LoyaltyBreakdownObject;
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

      if (customFieldsObject.loyaltyCredits?.total) {
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
      if (customFieldsObject.loyaltyCredits?.total) {
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
    });

    return actions;
  };

  static removeCustomType = (): OrderSetCustomTypeAction => ({
    action: 'setCustomType',
  });

  static checkResourceCustomType = (
    resource: BaseResource,
  ): TypeReference | undefined => {
    return (resource as any).custom?.type;
  };
}
