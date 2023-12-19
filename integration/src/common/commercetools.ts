export const extensions = [
  {
    key: 'connect-eagleeye-integration-cart',
    triggers: [{ resourceTypeId: 'cart', actions: ['Create', 'Update'] }],
  },
];

export const subscriptions = [
  {
    resource: 'order',
    types: ['OrderPaymentStateChanged', 'OrderCreated'],
    changes: ['order'],
    key: 'connect-eagleeye-integration-order',
  },
];
