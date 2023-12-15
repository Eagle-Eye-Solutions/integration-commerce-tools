import { TypeDraft } from '@commercetools/platform-sdk';

export const FIELD_EAGLEEYE_ACTION = 'eagleeye-action';
export const FIELD_EAGLEEYE_BASKET_STORE = 'eagleeye-basketStore';
export const FIELD_EAGLEEYE_BASKET_URI = 'eagleeye-basketUri';
export const FIELD_EAGLEEYE_SETTLED_STATUS = 'eagleeye-settledStatus';
export const FIELD_EAGLEEYE_APPLIED_DISCOUNTS = 'eagleeye-appliedDiscounts';
export const ORDER_CUSTOM_FIELDS: TypeDraft = {
  key: 'custom-cart-type',
  name: {
    en: 'Eagle Eye',
  },
  description: {
    en: 'Eagle Eye custom type',
  },
  resourceTypeIds: ['order'],
  fieldDefinitions: [
    {
      name: 'eagleeye-errors',
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
      name: 'eagleeye-appliedDiscounts',
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
  ],
};
