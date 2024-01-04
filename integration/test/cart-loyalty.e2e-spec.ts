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
import { nockWalletOpenWithLoyalty } from './utils/nocks/EagleEyeNock';
import { MockLogger } from './utils/mocks/MockLogger';
import * as nock from 'nock';
import { sleep } from '../src/common/helper/timeout';
import { LOYALTY_SUCCESS_RESPONSE } from './utils/data/CartExtensionResponse.data';

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
      .expect(LOYALTY_SUCCESS_RESPONSE);

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });
});
