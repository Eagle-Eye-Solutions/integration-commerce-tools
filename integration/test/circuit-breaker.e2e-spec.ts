import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RECALCULATE_CART } from './utils/data/CartExtensionInputs.data';
import { nockCtAuth } from './utils/nocks/CommercetoolsNock';
import {
  nockGetCustomObject,
  nockPostCustomObject,
} from './utils/nocks/CustomObjectNock';
import { CartDiscountActionBuilder } from '../src/providers/commercetools/actions/cart-update/CartDiscountActionBuilder';
import { nockWalletOpen } from './utils/nocks/EagleEyeNock';
import { MockLogger } from './utils/mocks/MockLogger';
import { CIRCUIT_BREAKER_OPEN } from './utils/data/CustomObjects.data';
import * as nock from 'nock';
import { sleep } from '../src/common/helper/timeout';

const NO_ERRORS = {
  actions: [
    {
      action: 'setCustomType',
      type: { typeId: 'type', key: 'eagleEye' },
      fields: { errors: [] },
    },
    CartDiscountActionBuilder.addDiscount(),
  ],
};

const ERROR = {
  actions: [
    {
      action: 'setCustomType',
      type: {
        typeId: 'type',
        key: 'eagleEye',
      },
      fields: {
        errors: [
          '{"type":"EE_API_UNAVAILABLE","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
        ],
      },
    },
    { action: 'setDirectDiscounts', discounts: [] },
  ],
};

describe('Circuit breaker (e2e)', () => {
  let app: INestApplication;
  let mockLogger: MockLogger;

  beforeEach(() => {
    nock.cleanAll();
  });

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

    //the following API calls are done onModuleInit and need to be mocked before the testing module is created
    const ctAuthNock = nockCtAuth(2);
    const getCustomObjectNock = nockGetCustomObject(404, null);
    const postCustomObjectNock = nockPostCustomObject(200);
    const walletOpenNock = nockWalletOpen(3, 200);
    const walletOpenErrorNock = nockWalletOpen(4, 500);

    app = await initAppModule();

    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(NO_ERRORS);
    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(NO_ERRORS);
    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(NO_ERRORS);
    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR);

    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR);
    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR);

    //open circuit and save circuit state to CT custom object
    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect(ERROR);

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(getCustomObjectNock.isDone()).toBeTruthy();
    expect(postCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
    expect(walletOpenErrorNock.isDone()).toBeTruthy();
  });

  it('should fail straight away when the circuit breaker state is loaded with open state', async () => {
    const ctAuthNock = nockCtAuth();
    const getCustomObjectNock = nockGetCustomObject(200, CIRCUIT_BREAKER_OPEN);
    app = await initAppModule();

    await request(app.getHttpServer())
      .post('/')
      .send(RECALCULATE_CART)
      .expect(201)
      .expect({
        actions: [
          {
            action: 'setCustomType',
            type: { typeId: 'type', key: 'eagleEye' },
            fields: {
              errors: [
                '{"type":"EE_API_CIRCUIT_OPEN","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
              ],
            },
          },
          { action: 'setDirectDiscounts', discounts: [] },
        ],
      });
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(getCustomObjectNock.isDone()).toBeTruthy();
  });
});
