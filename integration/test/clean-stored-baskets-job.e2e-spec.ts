import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { nockCtAuth } from './utils/nocks/CommercetoolsNock';
import {
  nockDeleteCustomObject,
  nockQueryCustomObjects,
} from './utils/nocks/CustomObjectNock';
import { MockLogger } from './utils/mocks/MockLogger';
import * as nock from 'nock';
import { sleep } from '../src/common/helper/timeout';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../src/common/constants/constants';

describe('Clean Stored Enriched Baskets (e2e)', () => {
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

  it('should clean all stored baskets older than the specified threshold', async () => {
    const sampleCustomObject = {
      key: 'my-cart-id',
      lastModifiedAt: '2023-01-01T01:00:39Z',
    };
    const ctAuthNock = nockCtAuth();
    const queryCustomObjectsNock = nockQueryCustomObjects(
      200,
      {
        limit: 5,
        withTotal: 'false',
        container: CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        offset: 0,
        where: /.+/i,
        sort: 'lastModifiedAt+asc',
      },
      {
        count: 5,
        offset: 0,
        results: Array(5).fill(sampleCustomObject),
      },
    );
    const queryCustomObjectsNock2 = nockQueryCustomObjects(
      200,
      {
        limit: 5,
        withTotal: 'false',
        container: CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        offset: 5,
        where: /.+/i,
        sort: 'lastModifiedAt+asc',
      },
      {
        count: 2,
        offset: 5,
        results: Array(2).fill(sampleCustomObject),
      },
    );
    const deleteCustomObjectNock = nockDeleteCustomObject(
      'my-cart-id',
      CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
      {},
      33,
    );

    app = await initAppModule();
    await request(app.getHttpServer())
      .post('/jobs/stored-basket-cleanup')
      .send()
      .expect(201)
      .expect({
        results: {
          successful: Array(7).fill(sampleCustomObject),
          failed: [],
        },
      });

    await sleep(100); //await for
    expect(ctAuthNock.isDone()).toBeTruthy();
    expect(queryCustomObjectsNock.isDone()).toBeTruthy();
    expect(queryCustomObjectsNock2.isDone()).toBeTruthy();
    expect(deleteCustomObjectNock.isDone()).toBeTruthy();
  });
});
