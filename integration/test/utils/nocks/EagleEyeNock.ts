import * as nock from 'nock';
import { AdjudicationMapper } from '../../../src/adjudication/mappers/adjudication.mapper';
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

export const nockWalletOpenWithMinSpendOnItemLoyaltyContinuityCampaignInProgress =
  async (cart, times = 1, responseCode = 200, delayConnection = 0) => {
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
              accountId: '2830993430',
              walletId: '170828612',
              campaignId: '1801571',
              campaign: {
                campaignId: 1801571,
                campaignTypeId: 106,
                campaignMode: 'RESTRICTED',
                campaignName:
                  '500 points for spending £10 on bears (UPC: 245896)',
                accountTypeId: 8,
                startDate: '2024-01-08T00:00:00+00:00',
                endDate: '2030-12-31T23:59:00+00:00',
                status: 'ACTIVE',
                sequenceKey: null,
                reference: '001801571',
                relationships: [],
                dateCreated: '2024-01-08T15:05:04+00:00',
                lastUpdated: '2024-01-08T15:05:04+00:00',
              },
              type: 'CONTINUITY',
              clientType: 'OFFER',
              status: 'ACTIVE',
              state: 'LOADED',
              dates: {
                start: '2024-01-11T15:57:48+00:00',
                end: '2030-12-31T23:59:00+00:00',
              },
              meta: null,
              dateCreated: '2024-01-11T15:57:48+00:00',
              lastUpdated: '2024-01-11T15:57:48+00:00',
              overrides: [],
              balances: {
                totalSpend: 0,
                currentSpend: 0,
                transactionCount: 0,
                currentTransactions: 0,
                totalUnits: 0,
                currentUnits: 0,
              },
              relationships: null,
              mobileWallet: null,
              enriched: {
                token: null,
                qualifier: {
                  continuity: {
                    totalTransactionCount: null,
                    totalTransactionSpend: 1000,
                    totalTransactionUnits: null,
                  },
                },
                reward: {
                  offerId: '1212582',
                  offerName: 'CAMPAIGN OFFER (auto) v2',
                  posReference: null,
                },
                custom: null,
                restrictions: {},
                redemptionWindows: {},
                enrichmentType: 'CONTINUITY',
                campaignName:
                  '500 points for spending £10 on bears (UPC: 245896)',
                campaignReference: '001801571',
              },
            },
            {
              accountId: '2830993431',
              walletId: '170828612',
              campaignId: '1653843',
              campaign: {
                campaignId: 1653843,
                campaignTypeId: 7,
                campaignMode: 'OPEN',
                campaignName: 'Retail Points',
                accountTypeId: 7,
                status: 'ACTIVE',
                sequenceKey: null,
                reference: 'RETAILPOINTS',
                relationships: [],
              },
              type: 'POINTS',
              clientType: 'RETAILPOINTS',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                current: 0,
                usable: 0,
                locked: 0,
                lifetime: 0,
                lifetimeSpend: 0,
                lifetimeSpendValue: 0,
                pending: 0,
              },
            },
          ],
          analyseBasketResults: {
            basket: {
              type: 'ENRICHED',
              summary: {
                redemptionChannel: 'Online',
                totalDiscountAmount: {
                  general: null,
                  staff: null,
                  promotions: 0,
                },
                totalItems: 1,
                totalBasketValue: 400,
                results: {
                  points: {
                    spend: 0,
                    debit: 0,
                    refund: 0,
                    totalPointsTaken: 0,
                    earn: 400,
                    credit: 0,
                    totalPointsGiven: 400,
                    totalMonetaryValue: 0,
                  },
                },
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
                    targetedAccountId: '2830993431',
                    targetedWalletId: '170828612',
                    totalMatchingUnits: null,
                    playOrderPosition: 1,
                  },
                ],
              },
              contents: [
                {
                  upc: '245896',
                  itemUnitCost: 400,
                  salesKey: 'SALE',
                  totalUnitCostAfterDiscount: 400,
                  totalUnitCost: 400,
                  description: 'Bears',
                  itemUnitMetric: 'EACH',
                  itemUnitCount: 1,
                  contributionResults: [
                    {
                      instanceId: '1653843-1',
                      value: 400,
                    },
                  ],
                  adjudicationResults: [
                    {
                      resourceType: 'CAMPAIGN',
                      resourceId: '1801571',
                      instanceId: '1801571-1',
                      success: null,
                      type: 'credit',
                      value: null,
                      balances: {
                        total_spend: 400,
                      },
                      isRefundable: true,
                      isUnredeemable: false,
                      relatedAccountIds: ['2830993430'],
                      targetedAccountId: '2830993430',
                      targetedWalletId: '170828612',
                      totalMatchingUnits: null,
                      playOrderPosition: 2,
                    },
                  ],
                },
              ],
              analysedDateTime: '2024-01-11T18:05:59+00:00',
            },
            points: [
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                walletId: '170828612',
                operationType: 'earn',
                value: 400,
                accountId: '2830993431',
                relatedSchemeId: '1653843',
                details: null,
                totalMatchingUnits: null,
              },
            ],
            unusedAccounts: [],
          },
          basketAdjudicationResult: null,
          spendAdjudicationResults: null,
          transactionCapabilities: {
            loyalty: {
              spend: true,
              earn: true,
            },
          },
        },
        [],
      );
  };

export const nockWalletOpenWithMinSpendOnItemLoyaltyContinuityCampaignCompleting =
  async (cart, times = 1, responseCode = 200, delayConnection = 0) => {
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
              accountId: '2830993430',
              walletId: '170828612',
              campaignId: '1801571',
              campaign: {
                campaignId: 1801571,
                campaignTypeId: 106,
                campaignMode: 'RESTRICTED',
                campaignName:
                  '500 points for spending £10 on bears (UPC: 245896)',
                accountTypeId: 8,
                startDate: '2024-01-08T00:00:00+00:00',
                endDate: '2030-12-31T23:59:00+00:00',
                status: 'ACTIVE',
                sequenceKey: null,
                reference: '001801571',
                relationships: [],
                dateCreated: '2024-01-08T15:05:04+00:00',
                lastUpdated: '2024-01-08T15:05:04+00:00',
              },
              type: 'CONTINUITY',
              clientType: 'OFFER',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                totalSpend: 0,
                currentSpend: 0,
                transactionCount: 0,
                currentTransactions: 0,
                totalUnits: 0,
                currentUnits: 0,
              },
              relationships: null,
              mobileWallet: null,
              enriched: {
                token: null,
                qualifier: {
                  continuity: {
                    totalTransactionCount: null,
                    totalTransactionSpend: 1000,
                    totalTransactionUnits: null,
                  },
                },
                reward: {
                  offerId: '1212582',
                  offerName: 'CAMPAIGN OFFER (auto) v2',
                  posReference: null,
                },
                custom: null,
                restrictions: {},
                redemptionWindows: {},
                enrichmentType: 'CONTINUITY',
                campaignName:
                  '500 points for spending £10 on bears (UPC: 245896)',
                campaignReference: '001801571',
              },
            },
            {
              accountId: '2830993431',
              walletId: '170828612',
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
              type: 'POINTS',
              clientType: 'RETAILPOINTS',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                current: 0,
                usable: 0,
                locked: 0,
                lifetime: 0,
                lifetimeSpend: 0,
                lifetimeSpendValue: 0,
                pending: 0,
              },
              relationships: null,
              mobileWallet: null,
            },
          ],
          analyseBasketResults: {
            basket: {
              type: 'ENRICHED',
              summary: {
                redemptionChannel: 'Online',
                totalDiscountAmount: {
                  general: null,
                  staff: null,
                  promotions: 0,
                },
                totalItems: 1,
                totalBasketValue: 3374,
                results: {
                  points: {
                    spend: 0,
                    debit: 0,
                    refund: 0,
                    totalPointsTaken: 0,
                    earn: 3374,
                    credit: 500,
                    totalPointsGiven: 3874,
                    totalMonetaryValue: 0,
                  },
                },
                adjudicationResults: [
                  {
                    resourceType: 'SCHEME',
                    resourceId: '1653843',
                    instanceId: '1653843-1',
                    success: null,
                    type: 'earn',
                    value: null,
                    balances: {
                      current: 3374,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: [],
                    targetedAccountId: '2830993431',
                    targetedWalletId: '170828612',
                    totalMatchingUnits: null,
                    playOrderPosition: 1,
                  },
                ],
              },
              contents: [
                {
                  upc: '245896',
                  itemUnitCost: 3374,
                  salesKey: 'SALE',
                  totalUnitCostAfterDiscount: 3374,
                  totalUnitCost: 3374,
                  description: 'Bears',
                  itemUnitMetric: 'EACH',
                  itemUnitCount: 1,
                  contributionResults: [
                    {
                      instanceId: '1653843-1',
                      value: 3374,
                    },
                  ],
                  adjudicationResults: [
                    {
                      resourceType: 'CAMPAIGN',
                      resourceId: '1801571',
                      instanceId: '1801571-1',
                      success: null,
                      type: 'credit',
                      value: null,
                      balances: {
                        total_spend: 3374,
                      },
                      isRefundable: true,
                      isUnredeemable: false,
                      relatedAccountIds: ['2830993430'],
                      targetedAccountId: '2830993430',
                      targetedWalletId: '170828612',
                      totalMatchingUnits: null,
                      playOrderPosition: 2,
                    },
                    {
                      resourceType: 'CAMPAIGN',
                      resourceId: '1801571',
                      instanceId: '1801571-1',
                      success: null,
                      type: 'redeem',
                      value: 500,
                      balances: null,
                      isRefundable: true,
                      isUnredeemable: false,
                      relatedAccountIds: ['2830993430'],
                      targetedAccountId: '2830993430',
                      targetedWalletId: '170828612',
                      totalMatchingUnits: 1,
                      playOrderPosition: 2,
                    },
                    {
                      resourceType: 'CAMPAIGN',
                      resourceId: '1801571',
                      instanceId: '1801571-1',
                      success: null,
                      type: 'credit',
                      value: null,
                      balances: {
                        current: 500,
                      },
                      isRefundable: true,
                      isUnredeemable: false,
                      relatedAccountIds: ['2830993430'],
                      targetedAccountId: '2830993431',
                      targetedWalletId: '170828612',
                      totalMatchingUnits: null,
                      playOrderPosition: 2,
                    },
                  ],
                },
              ],
              analysedDateTime: '2024-01-11T15:58:48+00:00',
            },
            points: [
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                walletId: '170828612',
                operationType: 'earn',
                value: 3374,
                accountId: '2830993431',
                relatedSchemeId: '1653843',
                details: null,
                totalMatchingUnits: null,
              },
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                operationType: 'credit',
                value: 500,
                relatedSchemeId: '1653843',
                accountId: '2830993431',
                walletId: '170828612',
                details: {
                  appliedAnalyseBasketType: 'CONTINUITY',
                },
              },
            ],
            unusedAccounts: [],
          },
          basketAdjudicationResult: null,
          spendAdjudicationResults: null,
          transactionCapabilities: {
            loyalty: {
              spend: true,
              earn: true,
            },
          },
        },
        [],
      );
  };

export const nockWalletOpenWithMinSpendLoyaltyContinuityCampaignCompleting =
  async (cart, times = 1, responseCode = 200, delayConnection = 0) => {
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
              accountId: '2830357206',
              walletId: '170818646',
              campaignId: '1801469',
              campaign: {
                campaignId: 1801469,
                campaignTypeId: 106,
                campaignMode: 'RESTRICTED',
                campaignName:
                  '500 points for spending £50 or more across one or more transactions',
                accountTypeId: 8,
                status: 'ACTIVE',
                sequenceKey: null,
                reference: '001801469',
              },
              type: 'CONTINUITY',
              clientType: 'OFFER',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                totalSpend: 0,
                currentSpend: 0,
                transactionCount: 0,
                currentTransactions: 0,
                totalUnits: 0,
                currentUnits: 0,
              },
              enriched: {
                token: null,
                qualifier: {
                  continuity: {
                    totalTransactionCount: null,
                    totalTransactionSpend: 5000,
                    totalTransactionUnits: null,
                  },
                },
                reward: {
                  offerId: '1212493',
                  offerName: 'CAMPAIGN OFFER (auto) v2',
                  posReference: null,
                },
                custom: null,
                restrictions: {},
                redemptionWindows: {},
                enrichmentType: 'CONTINUITY',
                campaignName:
                  '500 points for spending £50 or more across one or more transactions',
                campaignReference: '001801469',
              },
            },
            {
              accountId: '2830357207',
              walletId: '170818646',
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
              type: 'POINTS',
              clientType: 'RETAILPOINTS',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                current: 0,
                usable: 0,
                locked: 0,
                lifetime: 0,
                lifetimeSpend: 0,
                lifetimeSpendValue: 0,
                pending: 0,
              },
              enriched: {
                properties: {
                  allowNegativeBalance: {
                    enabled: true,
                  },
                  autotopup: {
                    defaultFunding: [],
                    enabled: false,
                    reasonCodes: null,
                  },
                  credit: {
                    defaultFunding: [],
                    enabled: false,
                    reasonCodes: null,
                  },
                  debit: {
                    defaultFunding: [],
                    enabled: false,
                    reasonCodes: null,
                  },
                  details: {
                    alternativeDescription: '',
                    alternativeName: '',
                    description: '',
                    printMessage: '',
                    screenMessage: '',
                  },
                  earn: {
                    defaultFunding: [],
                    enabled: false,
                    reasonCodes: null,
                  },
                  earnRates: {
                    ctintegration: {
                      default: {
                        description: null,
                        name: null,
                        product: null,
                        rates: [
                          {
                            amount: 1,
                            bonus: null,
                            ceiling: null,
                            floor: null,
                            offset: 0,
                            step: 1,
                          },
                        ],
                        reference: null,
                        roundPoints: {
                          active: false,
                        },
                        type: 'STANDARD',
                      },
                    },
                  },
                  exchange: {
                    defaultFunding: [],
                    enabled: false,
                    reasonCodes: null,
                  },
                  expiryPoints: {
                    enabled: false,
                  },
                  goodwill: {
                    defaultFunding: [],
                    enabled: false,
                    reasonCodes: null,
                    restrictions: [
                      {
                        period: '',
                        singleValue: 0,
                        transactions: 0,
                        value: 0,
                      },
                    ],
                  },
                  householdSharing: {
                    enabled: true,
                  },
                  lock: null,
                  pointsLimit: {
                    exceed: false,
                    limit: null,
                  },
                  redemptionRates: {
                    ctintegration: [
                      {
                        bonus: 0,
                        ceiling: 999999,
                        floor: 1,
                        pointsBack: 0,
                        rate: 1,
                        step: 1,
                      },
                    ],
                  },
                  spend: {
                    defaultFunding: [],
                    enabled: false,
                    reasonCodes: null,
                  },
                },
                pointsExpiry: null,
                enrichmentType: 'POINTS',
                schemeName: 'Retail Points',
                schemeReference: 'RETAILPOINTS',
              },
            },
          ],
          additionalEntities: null,
          walletTransactions: [],
          accountTransactions: [],
          analyseBasketResults: {
            basket: {
              type: 'ENRICHED',
              summary: {
                redemptionChannel: 'Online',
                totalDiscountAmount: {
                  general: null,
                  staff: null,
                  promotions: 0,
                },
                totalItems: 1,
                totalBasketValue: 6000,
                results: {
                  points: {
                    spend: 0,
                    debit: 0,
                    refund: 0,
                    totalPointsTaken: 0,
                    earn: 6000,
                    credit: 500,
                    totalPointsGiven: 6500,
                    totalMonetaryValue: 0,
                  },
                },
                adjudicationResults: [
                  {
                    resourceType: 'SCHEME',
                    resourceId: '1653843',
                    instanceId: '1653843-1',
                    success: null,
                    type: 'earn',
                    value: null,
                    balances: {
                      current: 6000,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: [],
                    targetedAccountId: '2830357207',
                    targetedWalletId: '170818646',
                    totalMatchingUnits: null,
                    playOrderPosition: 1,
                  },
                  {
                    resourceType: 'CAMPAIGN',
                    resourceId: '1801469',
                    instanceId: '1801469-1',
                    success: null,
                    type: 'credit',
                    value: null,
                    balances: {
                      total_spend: 6000,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: ['2830357206'],
                    targetedAccountId: '2830357206',
                    targetedWalletId: '170818646',
                    totalMatchingUnits: null,
                    playOrderPosition: 2,
                  },
                  {
                    resourceType: 'CAMPAIGN',
                    resourceId: '1801469',
                    instanceId: '1801469-1',
                    success: null,
                    type: 'redeem',
                    value: 500,
                    balances: null,
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: ['2830357206'],
                    targetedAccountId: '2830357206',
                    targetedWalletId: '170818646',
                    totalMatchingUnits: null,
                    playOrderPosition: 2,
                  },
                  {
                    resourceType: 'CAMPAIGN',
                    resourceId: '1801469',
                    instanceId: '1801469-1',
                    success: null,
                    type: 'credit',
                    value: null,
                    balances: {
                      current: 500,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: ['2830357206'],
                    targetedAccountId: '2830357207',
                    targetedWalletId: '170818646',
                    totalMatchingUnits: null,
                    playOrderPosition: 2,
                  },
                ],
              },
              contents: [
                {
                  upc: '245903',
                  itemUnitCost: 6000,
                  salesKey: 'SALE',
                  totalUnitCostAfterDiscount: 6000,
                  totalUnitCost: 6000,
                  description: 'eBike',
                  itemUnitMetric: 'EACH',
                  itemUnitCount: 1,
                  contributionResults: [
                    {
                      instanceId: '1653843-1',
                      value: 6000,
                    },
                  ],
                },
              ],
              analysedDateTime: '2024-01-11T11:34:17+00:00',
            },
            points: [
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                walletId: '170818646',
                operationType: 'earn',
                value: 6000,
                accountId: '2830357207',
                relatedSchemeId: '1653843',
                details: null,
                totalMatchingUnits: null,
              },
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801469',
                operationType: 'credit',
                value: 500,
                relatedSchemeId: '1653843',
                accountId: '2830357207',
                walletId: '170818646',
                details: {
                  appliedAnalyseBasketType: 'CONTINUITY',
                },
              },
            ],
            unusedAccounts: [],
          },
          basketAdjudicationResult: null,
          spendAdjudicationResults: null,
        },
        [],
      );
  };

export const nockWalletOpenWithMinSpendLoyaltyContinuityCampaignInProgress =
  async (cart, times = 1, responseCode = 200, delayConnection = 0) => {
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
              accountId: '2830357206',
              walletId: '170818646',
              campaignId: '1801469',
              campaign: {
                campaignId: 1801469,
                campaignTypeId: 106,
                campaignMode: 'RESTRICTED',
                campaignName:
                  '500 points for spending £50 or more across one or more transactions',
                accountTypeId: 8,
                startDate: '2024-01-08T00:00:00+00:00',
                endDate: '2030-12-31T23:59:00+00:00',
                status: 'ACTIVE',
                sequenceKey: null,
                reference: '001801469',
                relationships: [],
                dateCreated: '2024-01-08T14:38:32+00:00',
                lastUpdated: '2024-01-08T14:38:32+00:00',
              },
              type: 'CONTINUITY',
              clientType: 'OFFER',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                totalSpend: 0,
                currentSpend: 0,
                transactionCount: 0,
                currentTransactions: 0,
                totalUnits: 0,
                currentUnits: 0,
              },
              enriched: {
                token: null,
                qualifier: {
                  continuity: {
                    totalTransactionCount: null,
                    totalTransactionSpend: 5000,
                    totalTransactionUnits: null,
                  },
                },
                reward: {
                  offerId: '1212493',
                  offerName: 'CAMPAIGN OFFER (auto) v2',
                  posReference: null,
                },
                custom: null,
                restrictions: {},
                redemptionWindows: {},
                enrichmentType: 'CONTINUITY',
                campaignName:
                  '500 points for spending £50 or more across one or more transactions',
                campaignReference: '001801469',
              },
            },
            {
              accountId: '2830357207',
              walletId: '170818646',
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
              type: 'POINTS',
              clientType: 'RETAILPOINTS',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                current: 0,
                usable: 0,
                locked: 0,
                lifetime: 0,
                lifetimeSpend: 0,
                lifetimeSpendValue: 0,
                pending: 0,
              },
            },
          ],
          analyseBasketResults: {
            basket: {
              type: 'ENRICHED',
              summary: {
                redemptionChannel: 'Online',
                totalDiscountAmount: {
                  general: null,
                  staff: null,
                  promotions: 0,
                },
                totalItems: 1,
                totalBasketValue: 4000,
                results: {
                  points: {
                    spend: 0,
                    debit: 0,
                    refund: 0,
                    totalPointsTaken: 0,
                    earn: 4000,
                    credit: 0,
                    totalPointsGiven: 4000,
                    totalMonetaryValue: 0,
                  },
                },
                adjudicationResults: [
                  {
                    resourceType: 'SCHEME',
                    resourceId: '1653843',
                    instanceId: '1653843-1',
                    success: null,
                    type: 'earn',
                    value: null,
                    balances: {
                      current: 4000,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: [],
                    targetedAccountId: '2830357207',
                    targetedWalletId: '170818646',
                    totalMatchingUnits: null,
                    playOrderPosition: 1,
                  },
                  {
                    resourceType: 'CAMPAIGN',
                    resourceId: '1801469',
                    instanceId: '1801469-1',
                    success: null,
                    type: 'credit',
                    value: null,
                    balances: {
                      total_spend: 4000,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: ['2830357206'],
                    targetedAccountId: '2830357206',
                    targetedWalletId: '170818646',
                    totalMatchingUnits: null,
                    playOrderPosition: 2,
                  },
                ],
              },
              contents: [
                {
                  upc: '245903',
                  itemUnitCost: 4000,
                  salesKey: 'SALE',
                  totalUnitCostAfterDiscount: 4000,
                  totalUnitCost: 4000,
                  description: 'eBike',
                  itemUnitMetric: 'EACH',
                  itemUnitCount: 1,
                  contributionResults: [
                    {
                      instanceId: '1653843-1',
                      value: 4000,
                    },
                  ],
                },
              ],
              analysedDateTime: '2024-01-11T12:36:14+00:00',
            },
            points: [
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                walletId: '170818646',
                operationType: 'earn',
                value: 4000,
                accountId: '2830357207',
                relatedSchemeId: '1653843',
                details: null,
                totalMatchingUnits: null,
              },
            ],
            unusedAccounts: [],
          },
          basketAdjudicationResult: null,
          spendAdjudicationResults: null,
          transactionCapabilities: {
            loyalty: {
              spend: true,
              earn: true,
            },
          },
        },
        [],
      );
  };

export const nockWalletOpenWithMinTransactionLoyaltyContinuityCampaignInProgress_1 =
  async (cart, times = 1, responseCode = 200, delayConnection = 0) => {
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
              accountId: '2830359556',
              walletId: '170820850',
              campaignId: '1762358',
              campaign: {
                campaignId: 1762358,
                campaignTypeId: 106,
                campaignMode: 'RESTRICTED',
                campaignName:
                  '500 points for spending over £10 in three transactions',
                accountTypeId: 8,
                startDate: '2023-12-11T00:00:00+00:00',
                endDate: '2030-12-31T23:59:00+00:00',
                status: 'ACTIVE',
                sequenceKey: null,
                reference: '001762358',
              },
              type: 'CONTINUITY',
              clientType: 'OFFER',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                totalSpend: 0,
                currentSpend: 0,
                transactionCount: 0,
                currentTransactions: 0,
                totalUnits: 0,
                currentUnits: 0,
              },
              enriched: {
                token: null,
                qualifier: {
                  continuity: {
                    totalTransactionCount: 3,
                    totalTransactionSpend: null,
                    totalTransactionUnits: null,
                  },
                },
                reward: {
                  offerId: '1194691',
                  offerName: 'CAMPAIGN OFFER (auto) v2',
                  posReference: null,
                },
                custom: null,
                restrictions: {},
                redemptionWindows: {},
                enrichmentType: 'CONTINUITY',
                campaignName:
                  '500 points for spending over £10 in three transactions',
                campaignReference: '001762358',
              },
            },
            {
              accountId: '2830359557',
              walletId: '170820850',
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
              type: 'POINTS',
              clientType: 'RETAILPOINTS',
              status: 'ACTIVE',
              state: 'LOADED',
              balances: {
                current: 0,
                usable: 0,
                locked: 0,
                lifetime: 0,
                lifetimeSpend: 0,
                lifetimeSpendValue: 0,
                pending: 0,
              },
            },
          ],
          analyseBasketResults: {
            basket: {
              type: 'ENRICHED',
              summary: {
                redemptionChannel: 'Online',
                totalDiscountAmount: {
                  general: null,
                  staff: null,
                  promotions: 0,
                },
                totalItems: 1,
                totalBasketValue: 4000,
                results: {
                  points: {
                    spend: 0,
                    debit: 0,
                    refund: 0,
                    totalPointsTaken: 0,
                    earn: 4000,
                    credit: 0,
                    totalPointsGiven: 4000,
                    totalMonetaryValue: 0,
                  },
                },
                adjudicationResults: [
                  {
                    resourceType: 'SCHEME',
                    resourceId: '1653843',
                    instanceId: '1653843-1',
                    success: null,
                    type: 'earn',
                    value: null,
                    balances: {
                      current: 4000,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: [],
                    targetedAccountId: '2830359557',
                    targetedWalletId: '170820850',
                    totalMatchingUnits: null,
                    playOrderPosition: 1,
                  },
                  {
                    resourceType: 'CAMPAIGN',
                    resourceId: '1762358',
                    instanceId: '1762358-1',
                    success: null,
                    type: 'credit',
                    value: null,
                    balances: {
                      transaction_count: 1,
                    },
                    isRefundable: true,
                    isUnredeemable: false,
                    relatedAccountIds: ['2830359556'],
                    targetedAccountId: '2830359556',
                    targetedWalletId: '170820850',
                    totalMatchingUnits: null,
                    playOrderPosition: 2,
                  },
                ],
              },
              contents: [
                {
                  upc: '245903',
                  itemUnitCost: 4000,
                  salesKey: 'SALE',
                  totalUnitCostAfterDiscount: 4000,
                  totalUnitCost: 4000,
                  description: 'eBike',
                  itemUnitMetric: 'EACH',
                  itemUnitCount: 1,
                  contributionResults: [
                    {
                      instanceId: '1653843-1',
                      value: 4000,
                    },
                  ],
                },
              ],
              analysedDateTime: '2024-01-11T13:04:13+00:00',
            },
            points: [
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                walletId: '170820850',
                operationType: 'earn',
                value: 4000,
                accountId: '2830359557',
                relatedSchemeId: '1653843',
                details: null,
                totalMatchingUnits: null,
              },
            ],
            unusedAccounts: [],
          },
          basketAdjudicationResult: null,
          spendAdjudicationResults: null,
          transactionCapabilities: {
            loyalty: {
              spend: true,
              earn: true,
            },
          },
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
