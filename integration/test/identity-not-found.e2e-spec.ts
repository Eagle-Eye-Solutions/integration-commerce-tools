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
  nockPostEnirchedBasketCustomObject,
} from './utils/nocks/CustomObjectNock';
import {
  nockWalletOpenIdentityError,
  nockWalletOpenRetryOnIdentificationError,
} from './utils/nocks/EagleEyeNock';
import { MockLogger } from './utils/mocks/MockLogger';
import * as nock from 'nock';
import { sleep } from '../src/common/helper/timeout';
import { CUSTOMER_NOT_FOUND_FETCHED_OPEN_PROMOTIONS_RESPONSE } from './utils/data/CartExtensionResponse.data';

describe('Identity Not Found (e2e)', () => {
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

  it('should return open promotions when the targetted promotions are not available for an unidentified customer', async () => {
    const ctAuthNock = nockCtAuth();
    const cartExtenstionInput = JSON.parse(JSON.stringify(RECALCULATE_CART));
    cartExtenstionInput.resource.obj.custom = {
      fields: {
        'eagleeye-identityValue': '123456',
      },
    };
    const nockCtGetShippingMethods = nockCtGetShippingMethodsWithIds(
      [cartExtenstionInput.resource.obj.shippingInfo.shippingMethod.id],
      50,
    );
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const postEnrichedBasketCustomObjectNock =
      nockPostEnirchedBasketCustomObject();
    const walletOpenErrorNock = await nockWalletOpenIdentityError(
      cartExtenstionInput.resource.obj,
      404,
    );

    const walletOpenNock = await nockWalletOpenRetryOnIdentificationError(
      cartExtenstionInput.resource.obj,
      200,
    );

    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/')
      .send(cartExtenstionInput)
      .expect(201)
      .expect(CUSTOMER_NOT_FOUND_FETCHED_OPEN_PROMOTIONS_RESPONSE);

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(nockCtGetShippingMethods.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(postEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletOpenErrorNock.isDone()).toBeTruthy();
    expect(walletOpenNock.isDone()).toBeTruthy();
  });
});
