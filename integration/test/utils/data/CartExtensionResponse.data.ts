export const SUCCESS_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [
        JSON.stringify({
          type: 'EE_API_TOKEN_PCEXNF',
          message: 'Voucher invalid: Failed to load token',
          context: {
            value: '123456',
            resourceType: null,
            resourceId: null,
            errorCode: 'PCEXNF',
            errorMessage: 'Voucher invalid: Failed to load token',
          },
        }),
      ],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-appliedDiscounts',
      value: ['Example Discount'],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketStore',
      value: 'CUSTOM_TYPE',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketUri',
      value:
        'custom-objects/eagleeye-cart/8be07418-04a0-49ba-b56f-2aa35d1027a4',
    },
    {
      action: 'setDirectDiscounts',
      discounts: [
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 200,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'totalPrice',
          },
        },
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 500,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'totalPrice',
          },
        },
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 100,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'lineItems',
            predicate: 'sku="245865"',
          },
        },
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 250,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'shipping',
          },
        },
      ],
    },
  ],
};

export const ERROR_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [
        '{"type":"EE_API_UNAVAILABLE","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
      ],
    },
    { action: 'setCustomField', name: 'eagleeye-appliedDiscounts', value: [] },
    { action: 'setCustomField', name: 'eagleeye-basketStore', value: '' },
    { action: 'setCustomField', name: 'eagleeye-basketUri', value: '' },
    { action: 'setDirectDiscounts', discounts: [] },
  ],
};

export const CUSTOMER_NOT_FOUND_FETCHED_OPEN_PROMOTIONS_RESPONSE = {
  actions: [
    {
      action: 'setCustomType',
      type: {
        typeId: 'type',
        key: 'custom-cart-type',
      },
      fields: {
        'eagleeye-errors': [
          '{"type":"EE_API_CUSTOMER_NF","message":"123456 - Customer identity not found","context":{"type":"EE_IDENTITY_NOT_FOUND"}}',
        ],
        'eagleeye-appliedDiscounts': ['Example Discount'],
        'eagleeye-basketStore': 'CUSTOM_TYPE',
        'eagleeye-basketUri':
          'custom-objects/eagleeye-cart/8be07418-04a0-49ba-b56f-2aa35d1027a4',
      },
    },
    {
      action: 'setDirectDiscounts',
      discounts: [
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 200,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'totalPrice',
          },
        },
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 500,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'totalPrice',
          },
        },
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 100,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'lineItems',
            predicate: 'sku="245865"',
          },
        },
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 250,
                currencyCode: 'GBP',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'shipping',
          },
        },
      ],
    },
  ],
};
