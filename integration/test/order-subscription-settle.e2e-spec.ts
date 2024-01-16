import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  nockCtAuth,
  nockCtGetOrderById,
  nockCtUpdateOrderById,
} from './utils/nocks/CommercetoolsNock';
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

describe('Settle EE transactions on Order messages (e2e)', () => {
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

  it('should try to settle the EE transaction when an order paymentState changes to Paid', async () => {
    const ctAuthNock = nockCtAuth();
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const getEnrichedBasketCustomObjectNock =
      nockGetEnrichedBasketCustomObject();

    const getOrderByIdNock = nockCtGetOrderById(ORDER_FOR_SETTLE.resource.obj);
    const updateOrderByIdNock = nockCtUpdateOrderById(
      ORDER_FOR_SETTLE.resource.obj,
      {
        version: ORDER_FOR_SETTLE.resource.obj.version,
        actions: [
          {
            action: 'setCustomField',
            name: 'eagleeye-settledStatus',
            value: 'SETTLED',
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-basketStore',
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-basketUri',
          },
        ],
      },
    );

    const walletSettleNock = await nockWalletSettle(
      ORDER_FOR_SETTLE.resource.obj.cart,
    );

    const deleteCustomObjectNock = nockDeleteCustomObject(
      ORDER_FOR_SETTLE.resource.obj.cart.id,
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
    );

    const requestData = {
      resource: {
        typeId: 'order',
        id: ORDER_FOR_SETTLE.resource.obj.id,
      },
      type: 'OrderPaymentStateChanged',
      notificationType: 'Message',
      paymentState: 'Paid',
    };

    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/events')
      .send({ message: { data: Buffer.from(JSON.stringify(requestData)) } })
      .expect(200)
      .expect({ status: 'OK' });

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(getEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletSettleNock.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
    expect(getOrderByIdNock.isDone()).toBeTruthy();
    expect(updateOrderByIdNock.isDone()).toBeTruthy();
  });

  it('should try to settle the EE transaction when an order is created with paymentState "Paid"', async () => {
    const ctAuthNock = nockCtAuth();
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const getEnrichedBasketCustomObjectNock =
      nockGetEnrichedBasketCustomObject();

    const updateOrderByIdNock = nockCtUpdateOrderById(
      ORDER_FOR_SETTLE.resource.obj,
      {
        version: ORDER_FOR_SETTLE.resource.obj.version,
        actions: [
          {
            action: 'setCustomField',
            name: 'eagleeye-settledStatus',
            value: 'SETTLED',
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-basketStore',
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-basketUri',
          },
        ],
      },
    );

    const walletSettleNock = await nockWalletSettle(
      ORDER_FOR_SETTLE.resource.obj.cart,
    );

    const deleteCustomObjectNock = nockDeleteCustomObject(
      ORDER_FOR_SETTLE.resource.obj.cart.id,
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
    );

    const requestData = {
      resource: {
        typeId: 'order',
        id: ORDER_FOR_SETTLE.resource.obj.id,
      },
      type: 'OrderCreated',
      notificationType: 'Message',
      order: {
        ...ORDER_FOR_SETTLE.resource.obj,
        paymentState: 'Paid',
      },
    };

    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/events')
      .send({ message: { data: Buffer.from(JSON.stringify(requestData)) } })
      .expect(200)
      .expect({ status: 'OK' });

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(getEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletSettleNock.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
    expect(updateOrderByIdNock.isDone()).toBeTruthy();
  });

  it('should try to settle the EE transaction when an order is created with action "SETTLE"', async () => {
    const ctAuthNock = nockCtAuth();
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const getEnrichedBasketCustomObjectNock =
      nockGetEnrichedBasketCustomObject();

    const orderWithSettleAction = {
      ...ORDER_FOR_SETTLE.resource.obj,
    };
    orderWithSettleAction.custom.fields['eagleeye-action'] = 'SETTLE';

    const updateOrderByIdNock = nockCtUpdateOrderById(orderWithSettleAction, {
      version: ORDER_FOR_SETTLE.resource.obj.version,
      actions: [
        {
          action: 'setCustomField',
          name: 'eagleeye-settledStatus',
          value: 'SETTLED',
        },
        { action: 'setCustomField', name: 'eagleeye-action' },
        {
          action: 'setCustomField',
          name: 'eagleeye-basketStore',
        },
        {
          action: 'setCustomField',
          name: 'eagleeye-basketUri',
        },
      ],
    });

    const walletSettleNock = await nockWalletSettle(
      ORDER_FOR_SETTLE.resource.obj.cart,
    );

    const deleteCustomObjectNock = nockDeleteCustomObject(
      ORDER_FOR_SETTLE.resource.obj.cart.id,
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
    );

    app = await initAppModule();

    const requestData = {
      resource: {
        typeId: 'order',
        id: ORDER_FOR_SETTLE.resource.obj.id,
      },
      type: 'OrderCreated',
      notificationType: 'Message',
      order: orderWithSettleAction,
    };
    await request(app.getHttpServer())
      .post('/events')
      .send({ message: { data: Buffer.from(JSON.stringify(requestData)) } })

      .expect(200)
      .expect({ status: 'OK' });

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(getEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(walletSettleNock.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
    expect(updateOrderByIdNock.isDone()).toBeTruthy();
  });

  it('should try to settle the EE transaction when an order changes the action custom field to "SETTLE"', async () => {
    const ctAuthNock = nockCtAuth();
    const getCircuitStateCustomObjectNock = nockGetCustomObject(404, null);
    const getEnrichedBasketCustomObjectNock =
      nockGetEnrichedBasketCustomObject();

    const orderWithSettleAction = {
      ...ORDER_FOR_SETTLE.resource.obj,
    };
    orderWithSettleAction.custom.fields['eagleeye-action'] = 'SETTLE';

    const updateOrderByIdNock = nockCtUpdateOrderById(orderWithSettleAction, {
      version: ORDER_FOR_SETTLE.resource.obj.version,
      actions: [
        {
          action: 'setCustomField',
          name: 'eagleeye-settledStatus',
          value: 'SETTLED',
        },
        { action: 'setCustomField', name: 'eagleeye-action' },
        {
          action: 'setCustomField',
          name: 'eagleeye-basketStore',
        },
        {
          action: 'setCustomField',
          name: 'eagleeye-basketUri',
        },
      ],
    });

    const walletSettleNock = await nockWalletSettle(
      ORDER_FOR_SETTLE.resource.obj.cart,
    );

    const deleteCustomObjectNock = nockDeleteCustomObject(
      ORDER_FOR_SETTLE.resource.obj.cart.id,
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
    );

    const getOrderByIdNock = nockCtGetOrderById(orderWithSettleAction);

    app = await initAppModule();

    const requestData = {
      resource: {
        typeId: 'order',
        id: ORDER_FOR_SETTLE.resource.obj.id,
      },
      type: 'OrderCustomFieldChanged',
      notificationType: 'Message',
      name: 'eagleeye-action',
      value: 'SETTLE',
    };
    await request(app.getHttpServer())
      .post('/events')
      .send({ message: { data: Buffer.from(JSON.stringify(requestData)) } })

      .expect(200)
      .expect({ status: 'OK' });

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(getCircuitStateCustomObjectNock.isDone()).toBeTruthy();
    expect(getEnrichedBasketCustomObjectNock.isDone()).toBeTruthy();
    expect(getOrderByIdNock.isDone()).toBeTruthy();
    expect(walletSettleNock.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
    expect(updateOrderByIdNock.isDone()).toBeTruthy();
  });
});
