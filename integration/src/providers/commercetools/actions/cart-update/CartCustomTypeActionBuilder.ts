import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
  BaseResource,
  TypeReference,
} from '@commercetools/platform-sdk';
import { EEApiErrorType } from '../../../../common/exceptions/eagle-eye-api.exception';
import { PluginErrorType } from '../../../../common/exceptions/eagle-eye-plugin.exception';
import { BasketLocation } from '../../../../services/basket-store/basket-store.interface';

export type CustomFieldError = {
  type:
    | 'EE_API_GENERIC_ERROR'
    | 'EE_API_CIRCUIT_OPEN'
    | 'EE_PLUGIN_GENERIC_ERROR'
    | EEApiErrorType
    | PluginErrorType
    | 'EE_API_TOKEN_PCEXNF'
    | 'EE_API_TOKEN_PCEXNV'
    | 'EE_API_TOKEN_PCEXO';
  message: string;
  context?: Record<string, any>;
};

export type DiscountDescription = {
  description: string;
};

export class CartCustomTypeActionBuilder {
  static addCustomType = (
    errors: CustomFieldError[],
    appliedDiscounts: DiscountDescription[] = [],
    voucherCodes: string[] = [],
    basketLocation?: BasketLocation,
  ): OrderUpdateAction => ({
    action: 'setCustomType',
    type: {
      typeId: 'type',
      key: 'custom-cart-type',
    },
    fields: {
      'eagleeye-errors': errors.map((error) => JSON.stringify(error)),
      'eagleeye-appliedDiscounts': extractDescriptions(appliedDiscounts),
      'eagleeye-basketStore': basketLocation?.storeType,
      'eagleeye-basketUri': basketLocation?.uri,
      'eagleeye-voucherCodes': voucherCodes,
    },
  });

  static setCustomFields = (
    errors: CustomFieldError[],
    appliedDiscounts: DiscountDescription[] = [],
    voucherCodes: string[] = [],
    basketLocation?: BasketLocation,
  ): OrderUpdateAction[] => [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: errors.map((error) => JSON.stringify(error)),
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-appliedDiscounts',
      value: extractDescriptions(appliedDiscounts),
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketStore',
      value: basketLocation?.storeType ?? '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketUri',
      value: basketLocation?.uri ?? '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-voucherCodes',
      value: voucherCodes,
    },
  ];

  static removeCustomType = (): OrderSetCustomTypeAction => ({
    action: 'setCustomType',
  });

  static checkResourceCustomType = (
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
