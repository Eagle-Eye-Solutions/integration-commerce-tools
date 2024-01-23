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

  it('should return an action array when EE_EXCLUDE_UNIDENTIFIED_CUSTOMERS is set to true', async () => {
    const mockConfigService = {
      get: (key: string) =>
        key === 'eagleEye.excludeUnidentifiedCustomers' ? 'true' : null,
    };

    app = await initAppModule(mockConfigService);

    const recalculateCart = JSON.parse(JSON.stringify(RECALCULATE_CART));
    delete recalculateCart.resource.obj.custom.fields;
    await request(app.getHttpServer())
      .post('/cart/service')
      .send(recalculateCart)
      .expect(200)
      .expect({
        actions: [
          {
            action: 'setCustomField',
            name: 'eagleeye-errors',
            value: [],
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
          {
            action: 'setCustomField',
            name: 'eagleeye-action',
            value: '',
          },
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
          {
            action: 'setLineItemCustomType',
            lineItemId: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
            type: {
              typeId: 'type',
              key: 'custom-line-item-type',
            },
            fields: {
              'eagleeye-loyaltyCredits': '',
              'eagleeye-appliedDiscounts': [],
            },
          },
          {
            action: 'setLineItemCustomType',
            lineItemId: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
            type: {
              typeId: 'type',
              key: 'custom-line-item-type',
            },
            fields: {
              'eagleeye-loyaltyCredits': '',
              'eagleeye-appliedDiscounts': [],
            },
          },
          {
            action: 'setDirectDiscounts',
            discounts: [],
          },
        ],
      });
  });
});
