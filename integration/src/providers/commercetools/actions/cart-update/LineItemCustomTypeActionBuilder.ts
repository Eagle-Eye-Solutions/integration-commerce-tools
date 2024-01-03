import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
  BaseResource,
  TypeReference,
  LineItem,
} from '@commercetools/platform-sdk';
import { LoyaltyBreakdownObject } from '../../../../types/loyalty-earn-credits.type';

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
          customFields['eagleeye-loyaltyCredits'] = JSON.stringify({
            total: lineItemCreditTotal,
            offers: lineItemCreditOffers,
          });
        }
      } else {
        customFields['eagleeye-loyaltyCredits'] = '';
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
            name: 'eagleeye-loyaltyCredits',
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
          name: 'eagleeye-loyaltyCredits',
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
