import { TypeDraft } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { TypeDefinitionInterface } from './type-definition.interface';

export const FIELD_EAGLEEYE_ERRORS = 'eagleeye-errors';
export const FIELD_EAGLEEYE_ACTION = 'eagleeye-action';
export const FIELD_EAGLEEYE_BASKET_STORE = 'eagleeye-basketStore';
export const FIELD_EAGLEEYE_BASKET_URI = 'eagleeye-basketUri';
export const FIELD_EAGLEEYE_SETTLED_STATUS = 'eagleeye-settledStatus';
export const FIELD_EAGLEEYE_APPLIED_DISCOUNTS = 'eagleeye-appliedDiscounts';
export const FIELD_EAGLEEYE_LOYALTY_EARN_CREDITS =
  'eagleeye-loyaltyEarnAndCredits';
export const TYPE_CART = 'custom-cart-type';

@Injectable()
export class CartTypeDefinition implements TypeDefinitionInterface {
  constructor(private readonly configService: ConfigService) {}

  getTypeKey(): string {
    return (
      this.configService.get<string>('commercetools.cartTypeKey') || TYPE_CART
    );
  }

  getTypeDraft(): TypeDraft {
    return {
      key: this.getTypeKey(),
      name: {
        en: 'Eagle Eye',
      },
      description: {
        en: 'Eagle Eye custom type',
      },
      resourceTypeIds: ['order'],
      fieldDefinitions: [
        {
          name: FIELD_EAGLEEYE_ERRORS,
          label: {
            en: 'eagleeye-errors',
          },
          required: false,
          type: {
            name: 'Set',
            elementType: { name: 'String' },
          },
          inputHint: 'SingleLine',
        },
        {
          name: FIELD_EAGLEEYE_APPLIED_DISCOUNTS,
          label: {
            en: 'eagleeye-appliedDiscounts',
          },
          required: false,
          type: {
            name: 'Set',
            elementType: { name: 'String' },
          },
          inputHint: 'SingleLine',
        },
        {
          name: 'eagleeye-voucherCodes',
          label: {
            en: 'eagleeye-voucherCodes',
          },
          required: false,
          type: {
            name: 'Set',
            elementType: { name: 'String' },
          },
          inputHint: 'SingleLine',
        },
        {
          name: FIELD_EAGLEEYE_ACTION,
          label: {
            en: 'eagleeye-action',
          },
          required: false,
          type: {
            name: 'String',
          },
          inputHint: 'SingleLine',
        },
        {
          name: FIELD_EAGLEEYE_BASKET_STORE,
          label: {
            en: 'eagleeye-basketStore',
          },
          required: false,
          type: {
            name: 'String',
          },
          inputHint: 'SingleLine',
        },
        {
          name: 'eagleeye-basketUri',
          label: {
            en: 'eagleeye-basketUri',
          },
          required: false,
          type: {
            name: 'String',
          },
          inputHint: 'SingleLine',
        },
        {
          name: FIELD_EAGLEEYE_SETTLED_STATUS,
          label: {
            en: 'eagleeye-settledStatus',
          },
          required: false,
          type: {
            name: 'String',
          },
          inputHint: 'SingleLine',
        },
        {
          name: 'eagleeye-identityValue',
          label: {
            en: 'eagleeye-identityValue',
          },
          required: false,
          type: {
            name: 'String',
          },
          inputHint: 'SingleLine',
        },
        {
          name: 'eagleeye-potentialVoucherCodes',
          label: {
            en: 'eagleeye-potentialVoucherCodes',
          },
          required: false,
          type: {
            name: 'Set',
            elementType: { name: 'String' },
          },
          inputHint: 'SingleLine',
        },
        {
          name: FIELD_EAGLEEYE_LOYALTY_EARN_CREDITS,
          label: {
            en: 'eagleeye-loyaltyEarnAndCredits',
          },
          required: false,
          type: {
            name: 'String',
          },
          inputHint: 'SingleLine',
        },
      ],
    };
  }
}
