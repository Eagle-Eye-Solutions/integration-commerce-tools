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
  nockDeleteCustomObject,
  nockGetCustomObject,
  nockPostCircuitStateCustomObject,
  nockPostEnrichedBasketCustomObject,
} from './utils/nocks/CustomObjectNock';
import { nockWalletOpen } from './utils/nocks/EagleEyeNock';
import { MockLogger } from './utils/mocks/MockLogger';
import { CIRCUIT_BREAKER_OPEN } from './utils/data/CustomObjects.data';
import * as nock from 'nock';
import { sleep } from '../src/common/helper/timeout';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../src/common/constants/constants';
import {
  ERROR_RESPONSE,
  SUCCESS_RESPONSE,
} from './utils/data/CartExtensionResponse.data';

describe('Circuit breaker (e2e)', () => {
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

  it('should allow three requests when the circuit breaker is loaded with closed or empty state and open the circuit after 3 API errors, given the CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE is set to 50%', async () => {
    // ****** NOCK ******
    // nock.recorder.rec();
    // the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth();
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [RECALCULATE_CART.resource.obj.shippingInfo.shippingMethod.id],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postCircuitStateCustomObjectNock =
      nockPostCircuitStateCustomObject(200);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnrichedBasketCustomObject();
    const deleteCustomObjectNock = nockDeleteCustomObject(
      RECALCULATE_CART.resource.id,
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
      16,
    );
    const walletOpenNock = await nockWalletOpen(
      RECALCULATE_CART.resource.obj,
      3,
      200,
      0,
    );
    const walletOpenErrorNock = await nockWalletOpen(
      RECALCULATE_CART.resource.obj,
      4,
      500,
      0,
    );
    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(SUCCESS_RESPONSE);
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(SUCCESS_RESPONSE);
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(SUCCESS_RESPONSE);
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR_RESPONSE);
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR_RESPONSE);
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR_RESPONSE);
    // open circuit and save circuit state to CT custom object
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR_RESPONSE);
    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
    expect(walletOpenErrorNock.isDone()).toBeTruthy();
    expect(walletOpenErrorNock.isDone()).toBeTruthy();
  });

  it('should fail straight away when the circuit breaker state is loaded with open state', async () => {
    const ctAuthNock = nockCtAuth();
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [RECALCULATE_CART.resource.obj.shippingInfo.shippingMethod.id],
      1,
    );
    const getCustomObjectNock = nockGetCustomObject(200, CIRCUIT_BREAKER_OPEN);
    const deleteCustomObjectNock = nockDeleteCustomObject(
      RECALCULATE_CART.resource.id,
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
    );
    app = await initAppModule();

    await request(app.getHttpServer())
      .post('/cart/service')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect({
        actions: [
          {
            action: 'setCustomField',
            name: 'eagleeye-errors',
            value: [
              '{"type":"EE_API_CIRCUIT_OPEN","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
            ],
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-appliedDiscounts',
            value: [],
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-basketStore',
            value: '',
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-basketUri',
            value: '',
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
            value: '',
          },
          { action: 'setDirectDiscounts', discounts: [] },
        ],
      });
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCustomObjectNock.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
  });
});
