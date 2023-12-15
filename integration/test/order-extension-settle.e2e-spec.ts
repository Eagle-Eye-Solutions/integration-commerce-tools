import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { nockCtAuth } from './utils/nocks/CommercetoolsNock';
import {
  nockDeleteCustomObject,
  nockGetCustomObject,
  nockGetEnrichedBasketCustomObject,
} from './utils/nocks/CustomObjectNock';
import { nockWalletSettle } from './utils/nocks/EagleEyeNock';
import { MockLogger } from './utils/mocks/MockLogger';
import * as nock from 'nock';
import { sleep } from '../src/common/helper/timeout';
import { ORDER_FOR_SETTLE } from './utils/data/OrderExtensionInputs.data';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../src/common/constants/constants';

describe('Settle EE transactions on order update (e2e)', () => {
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

  it('should try to settle the EE transaction when an order is updated and has "eagleeye-action=SETTLE"', async () => {
    const ctAuthNock = nockCtAuth();
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const getEnrichedBasketCustomObjectNock =
      nockGetEnrichedBasketCustomObject();

    const walletSettleNock = await nockWalletSettle(
      ORDER_FOR_SETTLE.resource.obj.cart,
    );

    const deleteCustomObjectNock = nockDeleteCustomObject(
      ORDER_FOR_SETTLE.resource.obj.cart.id,
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
    );

    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/service')
      .send(ORDER_FOR_SETTLE)
      .expect(201)
      .expect({
        actions: [
          {
            action: 'setCustomField',
            name: 'eagleeye-settledStatus',
            value: 'SETTLED',
          },
          { action: 'setCustomField', name: 'eagleeye-basketStore' },
          { action: 'setCustomField', name: 'eagleeye-basketUri' },
        ],
      });

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(getEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletSettleNock.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
  });
});
