import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RECALCULATE_CART } from './utils/data/CartExtensionInputs.data';
import {
  nockCtAuth,
  nockCtGetShippingMethodsWithIds,
} from './utils/nocks/CommercetoolsNock';
import {
  nockGetCustomObject,
  nockPostEnrichedBasketCustomObject,
} from './utils/nocks/CustomObjectNock';
import {
  nockWalletOpenWithLoyalty,
  nockWalletOpenWithMinSpendLoyaltyContinuityCampaignCompleting,
  nockWalletOpenWithMinSpendLoyaltyContinuityCampaignInProgress,
  nockWalletOpenWithMinSpendOnItemLoyaltyContinuityCampaignCompleting,
  nockWalletOpenWithMinSpendOnItemLoyaltyContinuityCampaignInProgress,
  nockWalletOpenWithQuestCampaignCompleting,
  nockWalletOpenWithQuestCampaignInProgress,
} from './utils/nocks/EagleEyeNock';
import { MockLogger } from './utils/mocks/MockLogger';
import * as nock from 'nock';
import { sleep } from '../src/common/helper/timeout';
import {
  LOYALTY_SUCCESS_RESPONSE,
  MIN_SPEND_CONTINUITY_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE,
  MIN_SPEND_CONTINUITY_LOYALTY_CAMPAIGN_IN_PROGRESS_RESPONSE,
  MIN_SPEND_ON_ITEM_CONTINUITY_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE,
  MIN_SPEND_ON_ITEM_CONTINUITY_LOYALTY_CAMPAIGN_INPROGRESS_RESPONSE,
  QUEST_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE,
  QUEST_LOYALTY_CAMPAIGN_INPROGRESS_RESPONSE,
} from './utils/data/CartExtensionResponse.data';

describe('Cart Loyalty processing (e2e)', () => {
  let app: INestApplication;
  let mockLogger: MockLogger;

  beforeEach(nock.cleanAll);

  // let ctAuthNock: nock.Scope, getCustomObjectNock: nock.Scope;

  async function initAppModule() {
    const useMockLogger = false;
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .setLogger(useMockLogger ? mockLogger : new Logger())
      .compile();

    app = module.createNestApplication();
    await app.init();
    return app;
  }

  afterEach(async () => {
    await app.close();
  });

  it('should process request and return cart update actions with loyalty custom fields', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [RECALCULATE_CART.resource.obj.shippingInfo.shippingMethod.id],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject({
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
            type: 'STANDARD',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: {
                general: null,
                staff: null,
                promotions: 300,
              },
              totalItems: 7,
              totalBasketValue: 6138,
              adjustmentResults: [{ value: 200 }],
              adjudicationResults: [
                {
                  resourceType: 'SCHEME',
                  resourceId: '1653843',
                  instanceId: '1653843-1',
                  success: null,
                  type: 'earn',
                  value: null,
                  balances: { current: 400 },
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
                  balances: { current: 400 },
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
                adjustmentResults: [{ totalDiscountAmount: 100 }],
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
                adjustmentResults: [{ totalDiscountAmount: 250 }],
              },
            ],
          },
          cart: { typeId: 'cart', id: '8be07418-04a0-49ba-b56f-2aa35d1027a4' },
        },
      });
    const walletOpenNock = await nockWalletOpenWithLoyalty(
      RECALCULATE_CART.resource.obj,
      1,
      200,
      0,
    );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect((res) => expect(res.body).toEqual(LOYALTY_SUCCESS_RESPONSE));

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });

  it('should process request and return cart update actions with loyalty custom fields when a continuity campaign on transaction spend on a product is completing', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const itemLevelContinuityCampaignQualifyingCart = JSON.parse(
      JSON.stringify(RECALCULATE_CART),
    );
    itemLevelContinuityCampaignQualifyingCart.resource.obj.lineItems = [
      {
        id: '4d02b4ab-8063-4f36-8bbf-790656d2e564',
        productId: '4d629059-8e57-4785-87cc-8b91d6bef60c',
        productKey: 'teddy-bear',
        name: {
          en: 'Teddy Bear',
        },
        variant: {
          id: 1,
          sku: '245896',
          prices: [
            {
              id: 'e227bed3-6371-4036-a111-c6e0aed444cd',
              value: {
                type: 'centPrecision',
                currencyCode: 'GBP',
                centAmount: 3374,
                fractionDigits: 2,
              },
            },
          ],
          attributes: [],
          assets: [],
          availability: {
            isOnStock: true,
            availableQuantity: 900,
            version: 1,
            id: 'bf224143-164b-4bf6-ade5-de0b8f1a6998',
          },
        },
        price: {
          id: 'e227bed3-6371-4036-a111-c6e0aed444cd',
          value: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 3374,
            fractionDigits: 2,
          },
        },
        quantity: 1,
        discountedPricePerQuantity: [],
        perMethodTaxRate: [],
        addedAt: '2024-01-11T16:06:21.344Z',
        lastModifiedAt: '2024-01-11T16:06:21.344Z',
        state: [
          {
            quantity: 1,
            state: {
              typeId: 'state',
              id: '048f8cd6-b834-4c2f-89f7-96659b5f1956',
            },
          },
        ],
        priceMode: 'Platform',
        lineItemMode: 'Standard',
        totalPrice: {
          type: 'centPrecision',
          currencyCode: 'GBP',
          centAmount: 3374,
          fractionDigits: 2,
        },
        custom: {
          type: {
            typeId: 'type',
            id: '24d8b2d5-7f5e-4c54-8028-cd9b4eb19a4e',
          },
          fields: {
            'eagleeye-loyaltyCredits': '',
          },
        },
      },
    ];
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [
        itemLevelContinuityCampaignQualifyingCart.resource.obj.shippingInfo
          .shippingMethod.id,
      ],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject({
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
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
          cart: {
            typeId: 'cart',
            id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
          },
        },
      });
    const walletOpenNock =
      await nockWalletOpenWithMinSpendOnItemLoyaltyContinuityCampaignCompleting(
        itemLevelContinuityCampaignQualifyingCart.resource.obj,
        1,
        200,
        0,
      );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(itemLevelContinuityCampaignQualifyingCart)
      .expect(201)
      .expect((res) =>
        expect(res.body).toEqual(
          MIN_SPEND_ON_ITEM_CONTINUITY_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE,
        ),
      );

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });

  it('should process request and return cart update actions with loyalty custom fields when a continuity campaign on transaction spend on a product is in progress', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const itemLevelContinuityCampaignQualifyingCart = JSON.parse(
      JSON.stringify(RECALCULATE_CART),
    );
    itemLevelContinuityCampaignQualifyingCart.resource.obj.lineItems = [
      {
        id: '4d02b4ab-8063-4f36-8bbf-790656d2e564',
        productId: '4d629059-8e57-4785-87cc-8b91d6bef60c',
        productKey: 'teddy-bear',
        name: {
          en: 'Teddy Bear',
        },
        variant: {
          id: 1,
          sku: '245896',
          prices: [
            {
              id: 'e227bed3-6371-4036-a111-c6e0aed444cd',
              value: {
                type: 'centPrecision',
                currencyCode: 'GBP',
                centAmount: 400,
                fractionDigits: 2,
              },
            },
          ],
          attributes: [],
          assets: [],
          availability: {
            isOnStock: true,
            availableQuantity: 900,
            version: 1,
            id: 'bf224143-164b-4bf6-ade5-de0b8f1a6998',
          },
        },
        price: {
          id: 'e227bed3-6371-4036-a111-c6e0aed444cd',
          value: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 400,
            fractionDigits: 2,
          },
        },
        quantity: 1,
        discountedPricePerQuantity: [],
        perMethodTaxRate: [],
        addedAt: '2024-01-11T16:06:21.344Z',
        lastModifiedAt: '2024-01-11T16:06:21.344Z',
        state: [
          {
            quantity: 1,
            state: {
              typeId: 'state',
              id: '048f8cd6-b834-4c2f-89f7-96659b5f1956',
            },
          },
        ],
        priceMode: 'Platform',
        lineItemMode: 'Standard',
        totalPrice: {
          type: 'centPrecision',
          currencyCode: 'GBP',
          centAmount: 400,
          fractionDigits: 2,
        },
        custom: {
          type: {
            typeId: 'type',
            id: '24d8b2d5-7f5e-4c54-8028-cd9b4eb19a4e',
          },
          fields: {
            'eagleeye-loyaltyCredits': '',
          },
        },
      },
    ];
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [
        itemLevelContinuityCampaignQualifyingCart.resource.obj.shippingInfo
          .shippingMethod.id,
      ],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject({
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
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
          cart: {
            typeId: 'cart',
            id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
          },
        },
      });
    const walletOpenNock =
      await nockWalletOpenWithMinSpendOnItemLoyaltyContinuityCampaignInProgress(
        itemLevelContinuityCampaignQualifyingCart.resource.obj,
        1,
        200,
        0,
      );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(itemLevelContinuityCampaignQualifyingCart)
      .expect(201)
      .expect((res) =>
        expect(res.body).toEqual(
          MIN_SPEND_ON_ITEM_CONTINUITY_LOYALTY_CAMPAIGN_INPROGRESS_RESPONSE,
        ),
      );

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });

  it('should process request and return cart update actions with loyalty custom fields when a continuity campaign on transaction spend is completing', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [RECALCULATE_CART.resource.obj.shippingInfo.shippingMethod.id],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject({
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
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
          cart: {
            typeId: 'cart',
            id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
          },
        },
      });
    const walletOpenNock =
      await nockWalletOpenWithMinSpendLoyaltyContinuityCampaignCompleting(
        RECALCULATE_CART.resource.obj,
        1,
        200,
        0,
      );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect((res) =>
        expect(res.body).toEqual(
          MIN_SPEND_CONTINUITY_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE,
        ),
      );

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });

  it('should process request and return cart update actions with appropriate loyalty custom fields when a continuity campaign on transaction spend is in progress', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [RECALCULATE_CART.resource.obj.shippingInfo.shippingMethod.id],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject({
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
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
          cart: {
            typeId: 'cart',
            id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
          },
        },
      });
    const walletOpenNock =
      await nockWalletOpenWithMinSpendLoyaltyContinuityCampaignInProgress(
        RECALCULATE_CART.resource.obj,
        1,
        200,
        0,
      );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect((res) =>
        expect(res.body).toEqual(
          MIN_SPEND_CONTINUITY_LOYALTY_CAMPAIGN_IN_PROGRESS_RESPONSE,
        ),
      );

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });

  it('should process request and return cart update actions when a quest campaign is completing', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [RECALCULATE_CART.resource.obj.shippingInfo.shippingMethod.id],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject({
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
            type: 'ENRICHED',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: {
                general: null,
                staff: null,
                promotions: 0,
              },
              totalItems: 3,
              totalBasketValue: 8993,
              results: {
                points: {
                  spend: 0,
                  debit: 0,
                  refund: 0,
                  totalPointsTaken: 0,
                  earn: 8993,
                  credit: 2000,
                  totalPointsGiven: 10993,
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
                    current: 8993,
                  },
                  relatedAccountIds: [],
                  targetedAccountId: '2853561878',
                  targetedWalletId: '172454304',
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762399',
                  instanceId: '1762399-1',
                  success: null,
                  type: 'redeem',
                  value: 0,
                  balances: null,
                  relatedAccountIds: ['2853561875'],
                  targetedAccountId: '2853561875',
                  targetedWalletId: '172454304',
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762401',
                  instanceId: '1762401-1',
                  success: null,
                  type: 'redeem',
                  value: 0,
                  balances: null,
                  relatedAccountIds: ['2853561876'],
                  targetedAccountId: '2853561876',
                  targetedWalletId: '172454304',
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762402',
                  instanceId: '1762402-1',
                  success: null,
                  type: 'redeem',
                  value: 0,
                  balances: null,
                  relatedAccountIds: ['2853561877'],
                  targetedAccountId: '2853561877',
                  targetedWalletId: '172454304',
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762406',
                  instanceId: '1762406-1',
                  success: null,
                  type: 'redeem',
                  value: 2000,
                  balances: null,
                  relatedAccountIds: ['2853561874'],
                  targetedAccountId: '2853561874',
                  targetedWalletId: '172454304',
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762406',
                  instanceId: '1762406-1',
                  success: null,
                  type: 'credit',
                  value: null,
                  balances: {
                    current: 2000,
                  },
                  relatedAccountIds: ['2853561874'],
                  targetedAccountId: '2853561878',
                  targetedWalletId: '172454304',
                },
              ],
              qualifiesResults: [
                {
                  instanceId: '1762406-1',
                  totalMatchingUnits: null,
                  totalMatchingSpend: null,
                },
              ],
            },
            contents: [
              {
                itemUnitCost: 2817,
                totalUnitCostAfterDiscount: 2817,
                totalUnitCost: 2817,
                description: 'eBike Hire',
                itemUnitMetric: 'EACH',
                itemUnitCount: 1,
                salesKey: 'SALE',
                upc: '245903',
                contributionResults: [
                  {
                    instanceId: '1653843-1',
                    value: 2817,
                  },
                  {
                    instanceId: '1762406-1',
                    value: 626,
                  },
                ],
                qualifiesResults: [
                  {
                    instanceId: '1762402-1',
                    totalMatchingUnits: 1,
                    totalMatchingSpend: 1,
                  },
                ],
              },
              {
                itemUnitCost: 2137,
                totalUnitCostAfterDiscount: 2137,
                totalUnitCost: 2137,
                description: 'Standard Card Hire',
                itemUnitMetric: 'EACH',
                itemUnitCount: 1,
                salesKey: 'SALE',
                upc: '245882',
                contributionResults: [
                  {
                    instanceId: '1653843-1',
                    value: 2137,
                  },
                  {
                    instanceId: '1762406-1',
                    value: 475,
                  },
                ],
                qualifiesResults: [
                  {
                    instanceId: '1762399-1',
                    totalMatchingUnits: 1,
                    totalMatchingSpend: 1,
                  },
                ],
              },
              {
                itemUnitCost: 4039,
                totalUnitCostAfterDiscount: 4039,
                totalUnitCost: 4039,
                description: 'eScooter Hire',
                itemUnitMetric: 'EACH',
                itemUnitCount: 1,
                salesKey: 'SALE',
                upc: '245902',
                contributionResults: [
                  {
                    instanceId: '1653843-1',
                    value: 4039,
                  },
                  {
                    instanceId: '1762406-1',
                    value: 899,
                  },
                ],
                qualifiesResults: [
                  {
                    instanceId: '1762401-1',
                    totalMatchingUnits: 1,
                    totalMatchingSpend: 1,
                  },
                ],
              },
            ],
            analysedDateTime: '2024-01-22T13:07:20+00:00',
          },
          cart: {
            typeId: 'cart',
            id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
          },
        },
      });
    const walletOpenNock = await nockWalletOpenWithQuestCampaignCompleting(
      RECALCULATE_CART.resource.obj,
      1,
      200,
      0,
    );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(QUEST_LOYALTY_CAMPAIGN_COMPLETING_RESPONSE);

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });

  it('should process request and return cart update actions when a quest campaign is in progress', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [RECALCULATE_CART.resource.obj.shippingInfo.shippingMethod.id],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject({
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
            type: 'ENRICHED',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: {
                general: null,
                staff: null,
                promotions: 0,
              },
              totalItems: 2,
              totalBasketValue: 4954,
              results: {
                points: {
                  spend: 0,
                  debit: 0,
                  refund: 0,
                  totalPointsTaken: 0,
                  earn: 4954,
                  credit: 0,
                  totalPointsGiven: 4954,
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
                    current: 4954,
                  },
                  isRefundable: true,
                  isUnredeemable: false,
                  relatedAccountIds: [],
                  targetedAccountId: '2853881869',
                  targetedWalletId: '172471269',
                  totalMatchingUnits: null,
                  playOrderPosition: 1,
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762399',
                  instanceId: '1762399-1',
                  success: null,
                  type: 'redeem',
                  value: 0,
                  balances: null,
                  isRefundable: true,
                  isUnredeemable: false,
                  relatedAccountIds: ['2853881866'],
                  targetedAccountId: '2853881866',
                  targetedWalletId: '172471269',
                  totalMatchingUnits: null,
                  playOrderPosition: 2,
                  totalRewardUnits: 0,
                },
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1762402',
                  instanceId: '1762402-1',
                  success: null,
                  type: 'redeem',
                  value: 0,
                  balances: null,
                  isRefundable: true,
                  isUnredeemable: false,
                  relatedAccountIds: ['2853881868'],
                  targetedAccountId: '2853881868',
                  targetedWalletId: '172471269',
                  totalMatchingUnits: null,
                  playOrderPosition: 3,
                  totalRewardUnits: 0,
                },
              ],
            },
            contents: [
              {
                itemUnitCost: 2817,
                totalUnitCostAfterDiscount: 2817,
                totalUnitCost: 2817,
                description: 'eBike Hire',
                itemUnitMetric: 'EACH',
                itemUnitCount: 1,
                salesKey: 'SALE',
                upc: '245903',
                contributionResults: [
                  {
                    instanceId: '1653843-1',
                    value: 2817,
                  },
                ],
                qualifiesResults: [
                  {
                    instanceId: '1762402-1',
                    totalMatchingUnits: 1,
                    totalMatchingSpend: 1,
                  },
                ],
              },
              {
                itemUnitCost: 2137,
                totalUnitCostAfterDiscount: 2137,
                totalUnitCost: 2137,
                description: 'Standard Card Hire',
                itemUnitMetric: 'EACH',
                itemUnitCount: 1,
                salesKey: 'SALE',
                upc: '245882',
                contributionResults: [
                  {
                    instanceId: '1653843-1',
                    value: 2137,
                  },
                ],
                qualifiesResults: [
                  {
                    instanceId: '1762399-1',
                    totalMatchingUnits: 1,
                    totalMatchingSpend: 1,
                  },
                ],
              },
            ],
            analysedDateTime: '2024-01-22T13:52:58+00:00',
          },
          cart: {
            typeId: 'cart',
            id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
          },
        },
      });
    const walletOpenNock = await nockWalletOpenWithQuestCampaignInProgress(
      RECALCULATE_CART.resource.obj,
      1,
      200,
      0,
    );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(QUEST_LOYALTY_CAMPAIGN_INPROGRESS_RESPONSE);

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });
});
