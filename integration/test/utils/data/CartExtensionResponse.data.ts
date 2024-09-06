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
        JSON.stringify({
          type: 'EE_API_TOKEN_PCEXNV',
          message:
            'Voucher invalid: identity required for points based offering',
          context: {
            value: 'invalid-code',
            resourceType: null,
            resourceId: null,
            errorCode: 'PCEXNV',
            errorMessage:
              'Voucher invalid: identity required for points based offering',
          },
        }),
      ],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-appliedDiscounts',
      value: ['Basket 20% Discount'],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketStore',
      value: 'CUSTOM_TYPE',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketUri',
      value: 'custom-objects/eagleeye-cart/{cart-id}',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-voucherCodes',
      value: ['valid-code'],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-potentialVoucherCodes',
      value: ['invalid-code'],
    },
    { action: 'setCustomField', name: 'eagleeye-action', value: '' },
    {
      action: 'setCustomField',
      name: 'eagleeye-settledStatus',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-loyaltyEarnAndCredits',
      value:
        '{"earn":{"basket":{"total":0}},"credit":{"basket":{"total":0,"offers":[]}}}',
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': ['Product discount for buying 245865'],
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': [],
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

export const LOYALTY_SUCCESS_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [],
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
      value: 'custom-objects/eagleeye-cart/{cart-id}',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-voucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-potentialVoucherCodes',
      value: [],
    },
    { action: 'setCustomField', name: 'eagleeye-action', value: '' },
    {
      action: 'setCustomField',
      name: 'eagleeye-settledStatus',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-loyaltyEarnAndCredits',
      value:
        '{"earn":{"basket":{"total":400,"offers":[]}},"credit":{"basket":{"total":400,"offers":[{"name":"100pts for every £1 spent on the basket","amount":400,"timesRedeemed":1}]}}}',
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': [],
        'eagleeye-loyaltyCredits':
          '{"total":100,"offers":[{"name":"Retail Points","amount":100,"sku":"245865","timesRedeemed":1}]}',
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': [],
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

export const MIN_SPEND_ON_ITEM_CONTINUITY_LOYALTY_CAMPAIGN_INPROGRESS_RESPONSE =
  {
    actions: [
      {
        action: 'setCustomField',
        name: 'eagleeye-errors',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-appliedDiscounts',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketStore',
        value: 'CUSTOM_TYPE',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketUri',
        value: 'custom-objects/eagleeye-cart/{cart-id}',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-voucherCodes',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-potentialVoucherCodes',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-action',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-settledStatus',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-loyaltyEarnAndCredits',
        value:
          '{"earn":{"basket":{"total":400,"offers":[]}},"credit":{"basket":{"total":0,"offers":[]}}}',
      },
      {
        action: 'setLineItemCustomField',
        lineItemId: '4d02b4ab-8063-4f36-8bbf-790656d2e564',
        name: 'eagleeye-loyaltyCredits',
        value:
          '{"total":0,"offers":[{"name":"500 points for spending £10 on bears (UPC: 245896)","amount":0,"sku":"245896","category":"CONTINUITY","totalSpend":400,"totalTransactionSpend":1000,"type":"IN_PROGRESS","timesRedeemed":1}]}',
      },
      {
        action: 'setLineItemCustomField',
        lineItemId: '4d02b4ab-8063-4f36-8bbf-790656d2e564',
        name: 'eagleeye-appliedDiscounts',
        value: [],
      },
      {
        action: 'setDirectDiscounts',
        discounts: [],
      },
    ],
  };

export const MIN_SPEND_ON_ITEM_CONTINUITY_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE =
  {
    actions: [
      {
        action: 'setCustomField',
        name: 'eagleeye-errors',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-appliedDiscounts',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketStore',
        value: 'CUSTOM_TYPE',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketUri',
        value: 'custom-objects/eagleeye-cart/{cart-id}',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-voucherCodes',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-potentialVoucherCodes',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-action',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-settledStatus',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-loyaltyEarnAndCredits',
        value:
          '{"earn":{"basket":{"total":3374,"offers":[]}},"credit":{"basket":{"total":0,"offers":[]}}}',
      },
      {
        action: 'setLineItemCustomField',
        lineItemId: '4d02b4ab-8063-4f36-8bbf-790656d2e564',
        name: 'eagleeye-loyaltyCredits',
        value:
          '{"total":500,"offers":[{"name":"500 points for spending £10 on bears (UPC: 245896)","amount":500,"sku":"245896","category":"CONTINUITY","totalSpend":3374,"totalTransactionSpend":1000,"type":"COMPLETING","timesRedeemed":1}]}',
      },
      {
        action: 'setLineItemCustomField',
        lineItemId: '4d02b4ab-8063-4f36-8bbf-790656d2e564',
        name: 'eagleeye-appliedDiscounts',
        value: [],
      },
      {
        action: 'setDirectDiscounts',
        discounts: [],
      },
    ],
  };

export const MIN_SPEND_CONTINUITY_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-appliedDiscounts',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketStore',
      value: 'CUSTOM_TYPE',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketUri',
      value: 'custom-objects/eagleeye-cart/{cart-id}',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-voucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-potentialVoucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-action',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-settledStatus',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-loyaltyEarnAndCredits',
      value:
        '{"earn":{"basket":{"total":6000,"offers":[]}},"credit":{"basket":{"total":500,"offers":[{"name":"500 points for spending £50 or more across one or more transactions","amount":500,"category":"CONTINUITY","totalSpend":6000,"totalTransactionSpend":5000,"type":"COMPLETING","timesRedeemed":1}]}}}',
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': [],
        'eagleeye-loyaltyCredits': '',
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': [],
        'eagleeye-loyaltyCredits': '',
      },
    },
    {
      action: 'setDirectDiscounts',
      discounts: [],
    },
  ],
};

export const MIN_SPEND_CONTINUITY_LOYALTY_CAMPAIGN_IN_PROGRESS_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-appliedDiscounts',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketStore',
      value: 'CUSTOM_TYPE',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketUri',
      value: 'custom-objects/eagleeye-cart/{cart-id}',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-voucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-potentialVoucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-action',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-settledStatus',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-loyaltyEarnAndCredits',
      value:
        '{"earn":{"basket":{"total":4000,"offers":[]}},"credit":{"basket":{"total":0,"offers":[{"name":"500 points for spending £50 or more across one or more transactions","amount":0,"category":"CONTINUITY","totalSpend":4000,"totalTransactionSpend":5000,"type":"IN_PROGRESS","timesRedeemed":1}]}}}',
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': [],
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': [],
      },
    },
    {
      action: 'setDirectDiscounts',
      discounts: [],
    },
  ],
};

export const QUEST_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-appliedDiscounts',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketStore',
      value: 'CUSTOM_TYPE',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketUri',
      value: 'custom-objects/eagleeye-cart/{cart-id}',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-voucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-potentialVoucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-action',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-settledStatus',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-loyaltyEarnAndCredits',
      value:
        '{"earn":{"basket":{"total":8993,"offers":[]}},"credit":{"basket":{"total":2000,"offers":[{"type":"COMPLETING","name":"Travel Quest","amount":2000,"category":"QUEST","totalObjectives":3,"totalObjectivesMet":3,"currentObjectives":[{"campaignId":"1762399","campaignName":"Quest: Car Hire (UPC: 245882)"},{"campaignId":"1762401","campaignName":"Quest: Buy eScooter (UPC: 245902)"},{"campaignId":"1762402","campaignName":"Quest: Buy eBike (UPC: 245903)"}],"objectivesToMeet":[],"timesRedeemed":1}]}}}',
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': [],
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': [],
      },
    },
    {
      action: 'setDirectDiscounts',
      discounts: [],
    },
  ],
};

export const QUEST_LOYALTY_CAMPAIGN_INPROGRESS_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-appliedDiscounts',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketStore',
      value: 'CUSTOM_TYPE',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-basketUri',
      value: 'custom-objects/eagleeye-cart/{cart-id}',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-voucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-potentialVoucherCodes',
      value: [],
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-action',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-settledStatus',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-loyaltyEarnAndCredits',
      value:
        '{"earn":{"basket":{"total":4954,"offers":[]}},"credit":{"basket":{"total":0,"offers":[{"type":"IN_PROGRESS","name":"Travel Quest","amount":0,"category":"QUEST","totalObjectives":3,"totalObjectivesMet":2,"currentObjectives":[{"campaignId":"1762399","campaignName":"Quest: Car Hire (UPC: 245882)"},{"campaignId":"1762402","campaignName":"Quest: Buy eBike (UPC: 245903)"}],"objectivesToMeet":[{"campaignId":"1762401","campaignName":"Quest: Buy eScooter (UPC: 245902)"}]}]}}}',
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': [],
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-loyaltyCredits': '',
        'eagleeye-appliedDiscounts': [],
      },
    },
    {
      action: 'setDirectDiscounts',
      discounts: [],
    },
  ],
};

export const ERROR_RESPONSE = {
  actions: [
    {
      action: 'setCustomField',
      name: 'eagleeye-errors',
      value: [
        '{"type":"EE_UNEXPECTED_ERROR","message":"The request failed to be processed by the EE AIR Platform due to an unexpected error."}',
      ],
    },
    { action: 'setCustomField', name: 'eagleeye-appliedDiscounts', value: [] },
    { action: 'setCustomField', name: 'eagleeye-basketStore', value: '' },
    { action: 'setCustomField', name: 'eagleeye-basketUri', value: '' },
    { action: 'setCustomField', name: 'eagleeye-voucherCodes', value: [] },
    {
      action: 'setCustomField',
      name: 'eagleeye-potentialVoucherCodes',
      value: [],
    },
    { action: 'setCustomField', name: 'eagleeye-action', value: '' },
    {
      action: 'setCustomField',
      name: 'eagleeye-settledStatus',
      value: '',
    },
    {
      action: 'setCustomField',
      name: 'eagleeye-loyaltyEarnAndCredits',
      value: '',
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': [],
        'eagleeye-loyaltyCredits': '',
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': [],
        'eagleeye-loyaltyCredits': '',
      },
    },
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
        'eagleeye-appliedDiscounts': ['Basket 20% Discount'],
        'eagleeye-basketStore': 'CUSTOM_TYPE',
        'eagleeye-basketUri': 'custom-objects/eagleeye-cart/{cart-id}',
        'eagleeye-voucherCodes': [],
        'eagleeye-potentialVoucherCodes': [],
        'eagleeye-action': '',
        'eagleeye-settledStatus': '',
        'eagleeye-loyaltyEarnAndCredits':
          '{"earn":{"basket":{"total":0}},"credit":{"basket":{"total":0,"offers":[]}}}',
        'eagleeye-identityValue': '',
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': ['Product discount for buying 245865'],
        'eagleeye-loyaltyCredits': '',
      },
    },
    {
      action: 'setLineItemCustomType',
      lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
      type: {
        typeId: 'type',
        key: 'custom-line-item-type',
      },
      fields: {
        'eagleeye-appliedDiscounts': [],
        'eagleeye-loyaltyCredits': '',
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
