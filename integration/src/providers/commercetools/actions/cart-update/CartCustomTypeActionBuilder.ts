import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/order';

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
      key: 'eagleEye',
    },
    fields: {
      errors: errors.map((error) => JSON.stringify(error)),
      appliedDiscounts: extractDescriptions(appliedDiscounts),
    },
  });

  static removeCustomType = (): OrderSetCustomTypeAction => ({
    action: 'setCustomType',
  });
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
