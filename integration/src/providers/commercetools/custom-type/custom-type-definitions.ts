import { TypeDraft } from '@commercetools/platform-sdk';

export const ORDER_CUSTOM_FIELDS: TypeDraft = {
  key: 'eagleEye',
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
      name: 'eagleeye-action',
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
