import * as nock from 'nock';
import { AdjudicationMapper } from '../../../src/common/mappers/adjudication.mapper';
import { Commercetools } from '../../../src/common/providers/commercetools/commercetools.provider';
import { ScriptConfigService } from '../../../src/common/config/configuration';
import { CtBasketStoreService } from '../../../src/common/services/basket-store/ct-basket-store.service';
import { CustomObjectService } from '../../../src/common/providers/commercetools/custom-object/custom-object.service';

export const nockWalletOpen = async (
  cart,
  times = 1,
  responseCode = 200,
  delayConnection = 0,
) => {
  const configService = new ScriptConfigService();
  const commercetools = new Commercetools(configService as any);
  const customObjectService = new CustomObjectService(commercetools);
  const basketStoreService = new CtBasketStoreService(
    customObjectService,
    configService as any,
  );
  const adjudicationMapper = new AdjudicationMapper(
    configService as any,
    commercetools,
    basketStoreService,
  );
  const basketContents = [
    ...adjudicationMapper.mapCartLineItemsToBasketContent(cart.lineItems),
  ];
  const shippingDiscountItem =
    await adjudicationMapper.mapShippingMethodSkusToBasketItems(
      cart.shippingInfo,
    );
  if (shippingDiscountItem.upc) {
    basketContents.push(shippingDiscountItem);
  }
  return nock('https://pos.sandbox.uk.eagleeye.com:443', {
    encodedQueryParams: true,
  })
    .post('/connect/wallet/open', {
      reference: cart.id,
      lock: true,
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      examine: [
        {
          type: 'TOKEN',
          value: '123456',
        },
        {
          type: 'TOKEN',
          value: 'valid-code',
        },
        {
          type: 'TOKEN',
          value: 'invalid-code',
        },
      ],
      options: {
        adjustBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
        analyseBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
      },
      basket: {
        type: 'STANDARD',
        summary: {
          redemptionChannel: 'Online',
          totalDiscountAmount: {
            general: null,
            staff: null,
            promotions: 0,
          },
          totalItems: getTotalItemCount(cart),
          totalBasketValue: getTotalBasketValue(cart),
        },
        contents: basketContents,
      },
    })
    .times(times)
    .delayConnection(delayConnection)
    .reply(
      responseCode,
      {
        wallet: null,
        identity: null,
        accounts: [],
        additionalEntities: null,
        walletTransactions: [],
        accountTransactions: [],
        analyseBasketResults: {
          basket: {
            type: 'STANDARD',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: {
                general: null,
                staff: null,
                promotions: 300,
              },
              totalItems: getTotalItemCount(cart),
              totalBasketValue: getTotalBasketValue(cart),
              adjustmentResults: [
                { value: 200 },
                { value: 500 }, // Voucher code "123456", 5 pounds off 50 (Basket)
              ],
            },
            contents: [
              {
                upc: '245865',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 100,
                  },
                ],
              },
              {
                upc: '245879',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 250,
                  },
                ],
              },
            ],
          },
          discount: [
            {
              campaignName: 'Example Discount',
            },
          ],
        },
        basketAdjudicationResult: null,
        spendAdjudicationResults: null,
        examine: [
          {
            value: '123456',
            resourceType: null,
            resourceId: null,
            errorCode: 'PCEXNF',
            errorMessage: 'Voucher invalid: Failed to load token',
          },
          {
            value: 'valid-code',
            resourceType: null,
            resourceId: null,
            errorCode: null,
            errorMessage: null,
          },
          {
            value: 'invalid-code',
            resourceType: null,
            resourceId: null,
            errorCode: 'PCEXNV',
            errorMessage:
              'Voucher invalid: identity required for points based offering',
          },
        ],
      },
      [],
    );
};

export const nockWalletOpenWithLoyalty = async (
  cart,
  times = 1,
  responseCode = 200,
  delayConnection = 0,
) => {
  const configService = new ScriptConfigService();
  const commercetools = new Commercetools(configService as any);
  const customObjectService = new CustomObjectService(commercetools);
  const basketStoreService = new CtBasketStoreService(
    customObjectService,
    configService as any,
  );
  const adjudicationMapper = new AdjudicationMapper(
    configService as any,
    commercetools,
    basketStoreService,
  );
  const basketContents = [
    ...adjudicationMapper.mapCartLineItemsToBasketContent(cart.lineItems),
  ];
  const shippingDiscountItem =
    await adjudicationMapper.mapShippingMethodSkusToBasketItems(
      cart.shippingInfo,
    );
  if (shippingDiscountItem.upc) {
    basketContents.push(shippingDiscountItem);
  }
  return nock('https://pos.sandbox.uk.eagleeye.com:443', {
    encodedQueryParams: true,
  })
    .post('/connect/wallet/open', {
      reference: cart.id,
      lock: true,
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      examine: [
        {
          type: 'TOKEN',
          value: '123456',
        },
        {
          type: 'TOKEN',
          value: 'valid-code',
        },
        {
          type: 'TOKEN',
          value: 'invalid-code',
        },
      ],
      options: {
        adjustBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
        analyseBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
      },
      basket: {
        type: 'STANDARD',
        summary: {
          redemptionChannel: 'Online',
          totalDiscountAmount: {
            general: null,
            staff: null,
            promotions: 0,
          },
          totalItems: getTotalItemCount(cart),
          totalBasketValue: getTotalBasketValue(cart),
        },
        contents: basketContents,
      },
    })
    .times(times)
    .delayConnection(delayConnection)
    .reply(
      responseCode,
      {
        wallet: null,
        identity: null,
        accounts: [
          {
            accountId: '2817854971',
            walletId: '170189945',
            campaignId: '1762318',
            campaign: {
              campaignId: 1762318,
              campaignTypeId: 111,
              campaignMode: 'RESTRICTED',
              campaignName: '100pts for every £1 spent on the basket',
              accountTypeId: 1,
              startDate: '2023-12-11T00:00:00+00:00',
              endDate: '2030-12-31T23:59:00+00:00',
              status: 'ACTIVE',
              sequenceKey: null,
              reference: '001762318',
              relationships: [],
              dateCreated: '2023-12-11T09:28:55+00:00',
              lastUpdated: '2023-12-11T09:28:55+00:00',
            },
          },
          {
            accountId: '2817854972',
            walletId: '170189945',
            campaignId: '1653843',
            campaign: {
              campaignId: 1653843,
              campaignTypeId: 7,
              campaignMode: 'OPEN',
              campaignName: 'Retail Points',
              accountTypeId: 7,
              startDate: '2023-01-01T00:00:00+00:00',
              endDate: '9999-12-30T23:59:00+00:00',
              status: 'ACTIVE',
              sequenceKey: null,
              reference: 'RETAILPOINTS',
              relationships: [],
              dateCreated: '2023-09-04T08:20:31+00:00',
              lastUpdated: '2023-10-04T16:13:35+00:00',
            },
          },
        ],
        additionalEntities: null,
        walletTransactions: [],
        accountTransactions: [],
        analyseBasketResults: {
          basket: {
            type: 'STANDARD',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: {
                general: null,
                staff: null,
                promotions: 300,
              },
              totalItems: getTotalItemCount(cart),
              totalBasketValue: getTotalBasketValue(cart),
              adjustmentResults: [{ value: 200 }],
              adjudicationResults: [
                {
                  resourceType: 'SCHEME',
                  resourceId: '1653843',
                  instanceId: '1653843-1',
                  success: null,
                  type: 'earn',
                  value: null,
                  balances: {
                    current: 400,
                  },
                  isRefundable: true,
                  isUnredeemable: false,
                  relatedAccountIds: [],
                  targetedAccountId: '2817854972',
                  targetedWalletId: '170189945',
                  totalMatchingUnits: null,
                  playOrderPosition: 3,
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762318',
                  instanceId: '1762318-1',
                  success: null,
                  type: 'redeem',
                  value: 400,
                  balances: null,
                  isRefundable: true,
                  isUnredeemable: false,
                  relatedAccountIds: ['2817854971'],
                  targetedAccountId: '2817854971',
                  targetedWalletId: '170189945',
                  totalMatchingUnits: null,
                  playOrderPosition: 4,
                  totalRewardUnits: 1,
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762318',
                  instanceId: '1762318-1',
                  success: null,
                  type: 'credit',
                  value: null,
                  balances: {
                    current: 400,
                  },
                  isRefundable: true,
                  isUnredeemable: false,
                  relatedAccountIds: ['2817854971'],
                  targetedAccountId: '2817854972',
                  targetedWalletId: '170189945',
                  totalMatchingUnits: null,
                  playOrderPosition: 4,
                },
              ],
            },
            contents: [
              {
                upc: '245865',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 100,
                  },
                ],
                adjudicationResults: [
                  {
                    type: 'credit',
                    resourceId: '1653843',
                    balances: {
                      current: 100,
                    },
                  },
                ],
              },
              {
                upc: '245879',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 250,
                  },
                ],
              },
            ],
          },
          discount: [
            {
              campaignName: 'Example Discount',
            },
          ],
        },
        basketAdjudicationResult: null,
        spendAdjudicationResults: null,
      },
      [],
    );
};

export const nockWalletSettle = async (
  cart,
  times = 1,
  responseCode = 200,
  delayConnection = 0,
) => {
  return nock('https://pos.sandbox.uk.eagleeye.com:443', {
    encodedQueryParams: true,
  })
    .post('/connect/wallet/settle', {
      mode: 'ACTIVE',
      reference: cart.id,
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      basket: {
        type: 'ENRICHED',
        summary: {
          redemptionChannel: 'Online',
          totalDiscountAmount: { promotions: 1133 },
          totalItems: 2,
          totalBasketValue: 4405,
          qualifiesResults: [
            { instanceId: '1744391-1', totalMatchingSpend: 100 },
          ],
          adjustmentResults: [
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1744391',
              instanceId: '1744391-1',
              relatedAccountIds: [],
              type: 'createRedeem',
              multiItem: [],
              value: 883,
              isUnredeemable: false,
              playOrderPosition: 2,
              totalDiscountAmount: 883,
            },
          ],
          results: {
            points: {
              spend: 0,
              debit: 0,
              refund: 0,
              totalPointsTaken: 0,
              earn: 0,
              credit: 0,
              totalPointsGiven: 0,
              totalMonetaryValue: 0,
            },
          },
        },
        contents: [
          {
            upc: '245865',
            itemUnitCost: 1000,
            totalUnitCostAfterDiscount: 4000,
            totalUnitCost: 4000,
            description: 'Farm Fresh Cheddar Cheese 500g',
            itemUnitMetric: 'EACH',
            itemUnitCount: 4,
            salesKey: 'SALE',
            contributionResults: [{ instanceId: '1744391-1', value: 601 }],
          },
          {
            upc: '245877',
            itemUnitCost: 546,
            totalUnitCostAfterDiscount: 1638,
            totalUnitCost: 1638,
            description: 'Bottled Still Water',
            itemUnitMetric: 'EACH',
            itemUnitCount: 3,
            salesKey: 'SALE',
            contributionResults: [{ instanceId: '1744391-1', value: 245 }],
          },
          {
            upc: '245879',
            itemUnitCost: 500,
            totalUnitCostAfterDiscount: 250,
            totalUnitCost: 500,
            description: 'Shipping method',
            itemUnitMetric: 'EACH',
            itemUnitCount: 1,
            salesKey: 'SALE',
            qualifiesResults: [
              {
                instanceId: '1736971-1',
                totalMatchingUnits: 1,
                totalMatchingSpend: 1,
              },
            ],
            adjustmentResults: [
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1736971',
                instanceId: '1736971-1',
                relatedAccountIds: [],
                type: 'createRedeem',
                multiItem: [],
                value: 250,
                isUnredeemable: false,
                totalMatchingUnits: 1,
                playOrderPosition: 1,
                totalDiscountAmount: 250,
              },
            ],
            itemUnitDiscount: 250,
            contributionResults: [{ instanceId: '1744391-1', value: 37 }],
          },
        ],
        analysedDateTime: '2023-11-29T12:10:58+00:00',
      },
    })
    .times(times)
    .delayConnection(delayConnection)
    .reply(
      responseCode,
      {
        walletTransactions: [
          {
            walletTransactionId: '1628201',
            parentWalletTransactionId: null,
            walletId: 'string',
            reference: 'string',
            identityId: 'string',
            type: 'string',
            status: 'SETTLED',
            meta: {
              key1: 'Value1',
              key2: 'Another Value',
            },
            state: null,
            expiryDate: '2018-08-01T15:15:24+01:00',
            accounts: [
              {
                accountId: '33741',
                accountTransactionId: '3345',
              },
              {
                accountId: '44771',
                accountTransactionId: '3346',
              },
              {
                accountId: '1818',
                accountTransactionId: '3347',
              },
              {
                accountId: '2233',
                accountTransactionId: '3348',
              },
            ],
            basket: {},
            location: {
              storeId: 'string',
              storeParentId: 'string',
            },
            dateCreated: '2018-07-31T13:12:11+01:00',
            lastUpdated: '2018-07-31T13:12:11+01:00',
          },
        ],
        accountTransactions: [
          {
            accountTransactionId: '3345',
            accountId: '33741',
            parentAccountTransactionId: null,
            event: 'REDEEM',
            value: 0,
            source: 'CLIENT',
            transactionDetails: {},
            balancesBefore: {
              available: 0,
              refundable: 0,
              current: 0,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            balancesAfter: {
              available: 0,
              refundable: 0,
              current: 0,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            properties: {},
            dateCreated: '2018-07-31T13:12:11+01:00',
            lastUpdated: '2018-07-31T13:12:11+01:00',
          },
          {
            accountTransactionId: '3346',
            accountId: '44771',
            parentAccountTransactionId: null,
            event: 'STAMP',
            value: 1,
            source: 'CLIENT',
            transactionDetails: {},
            balancesBefore: {
              available: 6,
              refundable: 0,
              current: 6,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            balancesAfter: {
              available: 7,
              refundable: 0,
              current: 7,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            properties: {},
            dateCreated: '2018-07-31T13:12:11+01:00',
            lastUpdated: '2018-07-31T13:12:11+01:00',
          },
          {
            accountTransactionId: '3347',
            accountId: '1818',
            parentAccountTransactionId: null,
            event: 'CREDIT',
            value: 12,
            source: 'CLIENT',
            transactionDetails: {},
            balancesBefore: {
              available: 77,
              refundable: 0,
              current: 77,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            balancesAfter: {
              available: 89,
              refundable: 0,
              current: 89,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            properties: {},
            dateCreated: '2018-07-31T13:12:11+01:00',
            lastUpdated: '2018-07-31T13:12:11+01:00',
          },
          {
            accountTransactionId: '3348',
            accountId: '2233',
            parentAccountTransactionId: null,
            event: 'DEBIT',
            value: 100,
            source: 'CLIENT',
            transactionDetails: {},
            balancesBefore: {
              available: 230,
              refundable: 230,
              current: 230,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            balancesAfter: {
              available: 130,
              refundable: 130,
              current: 130,
              lifetime: 0,
              totalSpend: 0,
              transactionCount: 0,
            },
            properties: {},
            dateCreated: '2018-07-31T13:12:11+01:00',
            lastUpdated: '2018-07-31T13:12:11+01:00',
          },
        ],
      },
      [],
    );
};

export const nockWalletOpenRetryOnIdentificationError = async (
  cart,
  responseCode = 200,
  delayConnection = 0,
) => {
  const configService = new ScriptConfigService();
  const commercetools = new Commercetools(configService as any);
  const customObjectService = new CustomObjectService(commercetools);
  const basketStoreService = new CtBasketStoreService(
    customObjectService,
    configService as any,
  );
  const adjudicationMapper = new AdjudicationMapper(
    configService as any,
    commercetools,
    basketStoreService,
  );
  const basketContents = [
    ...adjudicationMapper.mapCartLineItemsToBasketContent(cart.lineItems),
  ];
  const shippingDiscountItem =
    await adjudicationMapper.mapShippingMethodSkusToBasketItems(
      cart.shippingInfo,
    );
  if (shippingDiscountItem.upc) {
    basketContents.push(shippingDiscountItem);
  }
  return (
    nock('https://pos.sandbox.uk.eagleeye.com:443', {
      encodedQueryParams: true,
    })
      .persist()
      .post('/connect/wallet/open', {
        reference: cart.id,
        lock: true,
        location: {
          incomingIdentifier: 'outlet1',
          parentIncomingIdentifier: 'banner1',
        },
        options: {
          adjustBasket: {
            includeOpenOffers: true,
            enabled: true,
          },
          analyseBasket: {
            includeOpenOffers: true,
            enabled: true,
          },
        },
        basket: {
          type: 'STANDARD',
          summary: {
            redemptionChannel: 'Online',
            totalDiscountAmount: {
              general: null,
              staff: null,
              promotions: 0,
            },
            totalItems: cart.lineItems.reduce(
              (acc, lineItem) => lineItem.quantity + acc,
              0,
            ),
            totalBasketValue:
              cart.lineItems.reduce(
                (acc, lineItem) =>
                  lineItem.price.value.centAmount * lineItem.quantity + acc,
                0,
              ) + (cart.shippingInfo?.price?.centAmount ?? 0),
          },
          contents: basketContents,
        },
      })
      // .times(times)
      .delayConnection(delayConnection)
      .reply(
        responseCode,
        {
          wallet: null,
          identity: null,
          accounts: [],
          additionalEntities: null,
          walletTransactions: [],
          accountTransactions: [],
          analyseBasketResults: {
            basket: {
              type: 'STANDARD',
              summary: {
                redemptionChannel: 'Online',
                totalDiscountAmount: {
                  general: null,
                  staff: null,
                  promotions: 300,
                },
                totalItems: getTotalItemCount(cart),
                totalBasketValue: getTotalBasketValue(cart),
                adjustmentResults: [
                  { value: 200 },
                  { value: 500 }, // Voucher code "123456", 5 pounds off 50 (Basket)
                ],
              },
              contents: [
                {
                  upc: '245865',
                  adjustmentResults: [
                    {
                      totalDiscountAmount: 100,
                    },
                  ],
                },
                {
                  upc: '245879',
                  adjustmentResults: [
                    {
                      totalDiscountAmount: 250,
                    },
                  ],
                },
              ],
            },
            discount: [
              {
                campaignName: 'Example Discount',
              },
            ],
          },
          basketAdjudicationResult: null,
          spendAdjudicationResults: null,
        },
        [],
      )
  );
};

export const nockWalletOpenIdentityError = async (
  cart,
  responseCode = 404,
  delayConnection = 0,
) => {
  const configService = new ScriptConfigService();
  const commercetools = new Commercetools(configService as any);
  const customObjectService = new CustomObjectService(commercetools);
  const basketStoreService = new CtBasketStoreService(
    customObjectService,
    configService as any,
  );
  const adjudicationMapper = new AdjudicationMapper(
    configService as any,
    commercetools,
    basketStoreService,
  );
  const basketContents = [
    ...adjudicationMapper.mapCartLineItemsToBasketContent(cart.lineItems),
  ];
  const shippingDiscountItem =
    await adjudicationMapper.mapShippingMethodSkusToBasketItems(
      cart.shippingInfo,
    );
  if (shippingDiscountItem.upc) {
    basketContents.push(shippingDiscountItem);
  }

  return nock('https://pos.sandbox.uk.eagleeye.com:443', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/connect/wallet/open', {
      reference: cart.id,
      identity: {
        identityValue: '123456',
      },
      lock: true,
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      options: {
        adjustBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
        analyseBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
      },
      basket: {
        type: 'STANDARD',
        summary: {
          redemptionChannel: 'Online',
          totalDiscountAmount: {
            general: null,
            staff: null,
            promotions: 0,
          },
          totalItems: getTotalItemCount(cart),
          totalBasketValue: getTotalBasketValue(cart),
        },
        contents: basketContents,
      },
    })
    .delayConnection(delayConnection)
    .replyWithError({
      response: {
        code: 'ERR_BAD_REQUEST',
        status: responseCode,
      },
    });
};

function getTotalItemCount(cart: any): number {
  return cart.lineItems.reduce((acc, lineItem) => lineItem.quantity + acc, 0);
}

function getTotalBasketValue(cart: any): number {
  return (
    cart.lineItems.reduce(
      (acc, lineItem) =>
        lineItem.price.value.centAmount * lineItem.quantity + acc,
      0,
    ) + (cart.shippingInfo?.price?.centAmount ?? 0)
  );
}
