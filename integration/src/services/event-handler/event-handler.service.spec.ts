import { Test, TestingModule } from '@nestjs/testing';
import { EventHandlerService } from './event-handler.service';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';
import { BASKET_STORE_SERVICE } from '../basket-store/basket-store.provider';
import { OrderSettleService } from '../order-settle/order-settle.service';
import { OrderPaymentStateChangedProcessor } from './event-processor/order-payment-state-changed.processor';
import { OrderCreatedProcessor } from './event-processor/order-created.processor';

describe('EventHandlerService', () => {
  let service: EventHandlerService;
  const walletOpenMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventHandlerService,
        {
          provide: Commercetools,
          useValue: {
            getShippingMethods: jest.fn(),
            getOrderById: jest.fn(),
          },
        },
        {
          provide: EagleEyeApiClient,
          useValue: {
            wallet: {
              invoke: walletOpenMock,
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        { provide: CircuitBreakerService, useValue: { fire: jest.fn() } },
        CTCartToEEBasketMapper,
        {
          provide: BASKET_STORE_SERVICE,
          useValue: {
            save: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            isEnabled: jest.fn(),
          },
        },
        {
          provide: OrderSettleService,
          useValue: {
            settleTransactionFromOrder: jest.fn(),
          },
        },
        OrderPaymentStateChangedProcessor,
        OrderCreatedProcessor,
        {
          provide: 'EventProcessors',
          useFactory: (orderPaymentStateChanged, orderCreatedProcessor) => [
            orderPaymentStateChanged,
            orderCreatedProcessor,
          ],
          inject: [OrderPaymentStateChangedProcessor, OrderCreatedProcessor],
        },
      ],
    }).compile();

    service = module.get<EventHandlerService>(EventHandlerService);
  });

  describe('processEvent', () => {
    it('should process the OrderPaymentStateChanged event and return action promises', async () => {
      const message = {
        resource: {
          typeId: 'order',
          id: '123456',
        },
        type: 'OrderPaymentStateChanged',
        paymentState: 'Paid',
        id: '123456',
      };

      const actionPromises = await service.processEvent(message as any);

      expect(actionPromises.filter((p: any) => p.value)).toEqual([
        {
          status: 'fulfilled',
          value: [expect.any(Function)],
        },
      ]);
    });

    it('should process the OrderCreated event and return action promises', async () => {
      const message = {
        resource: {
          typeId: 'order',
          id: '123456',
        },
        order: {
          id: '123456',
          cart: {
            id: 'cart-id',
          },
          paymentState: 'Paid',
        },
        type: 'OrderCreated',
        id: '123456',
      };

      const actionPromises = await service.processEvent(message as any);

      expect(actionPromises.filter((p: any) => p.value)).toEqual([
        {
          status: 'fulfilled',
          value: [expect.any(Function)],
        },
      ]);
    });
  });

  describe('handleProcessedEventResponse', () => {
    it('should handle the processed event response and return the processing result', () => {
      const results = [
        {
          status: 'fulfilled',
          value: [() => {}],
        },
      ];
      const message = {
        resource: {
          typeId: 'order',
          id: '123456',
        },
        type: 'OrderPaymentStateChanged',
        paymentState: 'Paid',
        id: '123456',
      };

      const processingResult = service.handleProcessedEventResponse(
        results as any,
        message as any,
        true,
      );

      expect(processingResult).toEqual({ status: 'OK' });
    });

    it('should log if there are no results and logEventStats is true', () => {
      const results = [];
      const message = {
        resource: {
          typeId: 'order',
          id: '123456',
        },
        type: 'OrderPaymentStateChanged',
        paymentState: 'Paid',
        id: '123456',
      };

      const processingResult = service.handleProcessedEventResponse(
        results as any,
        message as any,
        true,
      );

      expect(processingResult).toEqual({ status: 'OK' });
    });

    it('should log if any request failed with a status code between 400 and 500', () => {
      const results = [
        {
          status: 'rejected',
          reason: {
            status: 403,
          },
        },
      ];
      const message = {
        resource: {
          typeId: 'order',
          id: '123456',
        },
        type: 'OrderPaymentStateChanged',
        paymentState: 'Paid',
        id: '123456',
      };

      const processingResult = service.handleProcessedEventResponse(
        results as any,
        message as any,
        true,
      );

      expect(processingResult).toEqual({ status: '4xx' });
    });

    it('should log if any request failed with a status code between 300 and 400', () => {
      const results = [
        {
          status: 'rejected',
          reason: {
            status: 300,
          },
        },
      ];
      const message = {
        resource: {
          typeId: 'order',
          id: '123456',
        },
        type: 'OrderPaymentStateChanged',
        paymentState: 'Paid',
        id: '123456',
      };

      const processingResult = service.handleProcessedEventResponse(
        results as any,
        message as any,
        true,
      );

      expect(processingResult).toEqual({ status: '4xx' });
    });

    it('should throw an error if any request failed with a 5xx status code', () => {
      const results = [
        {
          status: 'rejected',
          reason: {
            status: 500,
          },
        },
      ];
      const message = {
        resource: {
          typeId: 'order',
          id: '123456',
        },
        type: 'OrderPaymentStateChanged',
        paymentState: 'Paid',
        id: '123456',
      };

      expect(() => {
        service.handleProcessedEventResponse(
          results as any,
          message as any,
          true,
        );
      }).toThrowError(`Failed to process request for message: ${message.id}`);
    });
  });
});
