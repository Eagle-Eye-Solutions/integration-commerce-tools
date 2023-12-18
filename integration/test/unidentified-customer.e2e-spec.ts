import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RECALCULATE_CART } from './utils/data/CartExtensionInputs.data';
import { MockLogger } from './utils/mocks/MockLogger';
import { ConfigService } from '@nestjs/config';
import * as nock from 'nock';

describe('Exclude unidentified customers (e2e)', () => {
  let app: INestApplication;
  let mockLogger: MockLogger;

  beforeEach(nock.cleanAll);

  async function initAppModule(mockConfigService) {
    const useMockLogger = false;
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .setLogger(useMockLogger ? mockLogger : new Logger())
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    app = module.createNestApplication();
    await app.init();
    return app;
  }

  afterEach(async () => {
    await app.close();
  });

  it('should return and empty action array when EE_EXCLUDE_UNIDENTIFIED_CUSTOMERS is set to true', async () => {
    const mockConfigService = {
      get: (key: string) =>
        key === 'eagleEye.excludeUnidentifiedCustomers' ? 'true' : null,
    };

    app = await initAppModule(mockConfigService);

    const recalculateCart = JSON.parse(JSON.stringify(RECALCULATE_CART));
    delete recalculateCart.resource.obj.custom.fields;
    await request(app.getHttpServer())
      .post('/service')
      .send(recalculateCart)
      .expect(200)
      .expect({
        actions: [],
      });
  });
});
