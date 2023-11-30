import { TypeDraft } from '@commercetools/platform-sdk';

export const FIELD_EAGLEEYE_ACTION = 'eagleeye-action';
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
      name: 'eagleeye-basketStore',
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
      name: 'eagleeye-settledStatus',
      label: {
        en: 'eagleeye-settledStatus',
      },
      required: false,
      type: {
        name: 'String',
      },
      inputHint: 'SingleLine',
    },
  ],
};
