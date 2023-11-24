import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
  BaseResource,
  TypeReference,
} from '@commercetools/platform-sdk';

export type CustomFieldError = {
  type: string;
  message: string;
};

export type DiscountDescription = {
  description: string;
};

export class CartCustomTypeActionBuilder {
  static addCustomType = (
    errors: CustomFieldError[],
    appliedDiscounts: DiscountDescription[] = [],
  ): OrderUpdateAction => ({
    action: 'setCustomType',
    type: {
      typeId: 'type',
      key: 'custom-cart-type',
    },
    fields: {
      'eagleeye-errors': errors.map((error) => JSON.stringify(error)),
      'eagleeye-appliedDiscounts': extractDescriptions(appliedDiscounts),
    },
  });

  static setCustomFields = (
    errors: CustomFieldError[],
    appliedDiscounts: DiscountDescription[] = [],
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
