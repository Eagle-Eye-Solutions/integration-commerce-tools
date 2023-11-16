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
      name: 'errors',
      label: {
        en: 'errors',
      },
      required: false,
      type: {
        name: 'Set',
        elementType: { name: 'String' },
      },
      inputHint: 'SingleLine',
    },
    {
      name: 'appliedDiscounts',
      label: {
        en: 'appliedDiscounts',
      },
      required: false,
      type: {
        name: 'Set',
        elementType: { name: 'String' },
      },
      inputHint: 'SingleLine',
    },
  ],
};
