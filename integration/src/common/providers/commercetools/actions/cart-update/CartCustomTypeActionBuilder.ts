import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
  BaseResource,
  TypeReference,
} from '@commercetools/platform-sdk';
import { EEApiErrorType } from '../../../../exceptions/eagle-eye-api.exception';
import { PluginErrorType } from '../../../../exceptions/eagle-eye-plugin.exception';
import { BasketLocation } from '../../../../services/basket-store/basket-store.interface';
import { LoyaltyEarnAndCredits } from '../../../../../adjudication/types/loyalty-earn-credits.type';

export type CustomFieldError = {
  type:
    | 'EE_API_GENERIC_ERROR'
    | 'EE_API_CIRCUIT_OPEN'
    | 'EE_PLUGIN_GENERIC_ERROR'
    | EEApiErrorType
    | PluginErrorType
    | 'EE_API_TOKEN_PCEXNF'
    | 'EE_API_TOKEN_PCEXNV'
    | 'EE_API_TOKEN_PCEXO'
    | 'EE_API_CUSTOMER_NF';
  message: string;
  context?: Record<string, any>;
};

export type DiscountDescription = {
  description: string;
};

interface CustomFieldsObject {
  errors: CustomFieldError[];
  discountDescriptions?: DiscountDescription[];
  voucherCodes?: string[];
  potentialVoucherCodes?: string[];
  basketLocation?: BasketLocation;
  action?: string;
  settledStatus?: string;
  loyaltyEarnAndCredits?: LoyaltyEarnAndCredits;
  incomingIdentifier?: string;
  parentIncomingIdentifier?: string;
}

export class CartCustomTypeActionBuilder {
  static readonly addCustomType = (
    customFieldsObject: CustomFieldsObject,
    cartTypeKey: string,
  ): OrderUpdateAction => {
    const customFields = {
      'eagleeye-errors': customFieldsObject.errors.map((error) =>
        JSON.stringify(error),
      ),
      'eagleeye-appliedDiscounts': extractDescriptions(
        customFieldsObject.discountDescriptions || [],
      ),
      'eagleeye-basketStore': customFieldsObject.basketLocation?.storeType,
      'eagleeye-basketUri': customFieldsObject.basketLocation?.uri,
      'eagleeye-voucherCodes': customFieldsObject.voucherCodes || [],
      'eagleeye-potentialVoucherCodes':
        customFieldsObject.potentialVoucherCodes || [],
      'eagleeye-action': customFieldsObject.action || '',
      'eagleeye-settledStatus': customFieldsObject.settledStatus || '',
      'eagleeye-loyaltyEarnAndCredits':
        JSON.stringify(customFieldsObject.loyaltyEarnAndCredits) || '',
    };
    // If an identity was not found, it should be removed.
    // Otherwise it will be used when calling settle.
    if (
      customFieldsObject.errors.find((err) => err.type === 'EE_API_CUSTOMER_NF')
    ) {
      customFields['eagleeye-identityValue'] = '';
    }

    return {
      action: 'setCustomType',
      type: {
        typeId: 'type',
        key: cartTypeKey,
      },
      fields: customFields,
    };
  };

  static readonly setCustomFields = (
    customFieldsObject: CustomFieldsObject,
  ): OrderUpdateAction[] => {
    const actions: OrderUpdateAction[] = [
      {
        action: 'setCustomField',
        name: 'eagleeye-errors',
        value: customFieldsObject.errors.map((error) => JSON.stringify(error)),
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-appliedDiscounts',
        value: extractDescriptions(
          customFieldsObject.discountDescriptions || [],
        ),
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketStore',
        value: customFieldsObject.basketLocation?.storeType ?? '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketUri',
        value: customFieldsObject.basketLocation?.uri ?? '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-voucherCodes',
        value: customFieldsObject.voucherCodes || [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-potentialVoucherCodes',
        value: customFieldsObject.potentialVoucherCodes || [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-action',
        value: customFieldsObject.action || '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-settledStatus',
        value: customFieldsObject.settledStatus || '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-loyaltyEarnAndCredits',
        value: JSON.stringify(customFieldsObject.loyaltyEarnAndCredits) || '',
      },
    ];
    // If an identity was not found, it should be removed.
    // Otherwise it will be used when calling settle.
    if (
      customFieldsObject.errors.find((err) => err.type === 'EE_API_CUSTOMER_NF')
    ) {
      actions.push({
        action: 'setCustomField',
        name: 'eagleeye-identityValue',
        value: '',
      });
    }
    return actions;
  };

  static readonly removeCustomType = (): OrderSetCustomTypeAction => ({
    action: 'setCustomType',
  });

  static readonly checkResourceCustomType = (
    resource: BaseResource,
  ): TypeReference | undefined => {
    return (resource as any).custom?.type;
  };
}

function extractDescriptions(arr: DiscountDescription[]): string[] {
  const descriptionCounts: { [key: string]: number } = {};

  arr.forEach((item) => {
    const { description } = item;
    descriptionCounts[description] = (descriptionCounts[description] || 0) + 1;
  });

  return Array.from(
    new Set(
      arr.map((item) => {
        const { description } = item;
        const count = descriptionCounts[description];

        if (count > 1) {
          return `${description} (x${count})`;
        } else {
          return description;
        }
      }),
    ),
  );
}
