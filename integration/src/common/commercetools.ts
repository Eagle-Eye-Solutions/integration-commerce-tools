export const extensions = [
  {
    key: 'connect-eagleeye-integration-cart',
    triggers: [{ resourceTypeId: 'cart', actions: ['Create', 'Update'] }],
  },
  {
    key: 'connect-eagleeye-integration-order',
    triggers: [{ resourceTypeId: 'order', actions: ['Create', 'Update'] }],
  },
];

export const subscriptions = [
  {
    resource: 'order',
    types: ['OrderPaymentStateChanged'],
    changes: ['order'],
    key: 'connect-eagleeye-integration-order',
  },
];
