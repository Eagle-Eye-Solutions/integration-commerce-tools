import {
  OrderSetCustomTypeAction,
  OrderUpdateAction,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/order';

export type CustomFieldError = {
  type: string;
  message: string;
};

export class CartCustomTypeActionBuilder {
  static addCustomType = (errors: CustomFieldError[]): OrderUpdateAction => ({
    action: 'setCustomType',
    type: {
      typeId: 'type',
      key: 'eagleEye',
    },
    fields: {
      errors: errors.map((error) => JSON.stringify(error)),
    },
  });

  static removeCustomType = (): OrderSetCustomTypeAction => ({
    action: 'setCustomType',
  });
}
