export const extensions = [
  {
    key: 'connect-eagleeye-integration-cart',
    triggers: [{ resourceTypeId: 'cart', actions: ['Create', 'Update'] }],
  },
];

export const subscriptions = [
  {
    resource: 'order',
    types: [
      'OrderPaymentStateChanged',
      'OrderCreated',
      'OrderCustomFieldAdded',
      'OrderCustomFieldChanged',
    ],
    changes: ['order'],
    key: 'connect-eagleeye-integration-order',
  },
];
