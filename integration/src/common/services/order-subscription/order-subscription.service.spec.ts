import { Test, TestingModule } from '@nestjs/testing';
import { OrderSubscriptionService } from './order-subscription.service';
import { OrderPaymentStateChangedMessage } from '@commercetools/platform-sdk';
import { EventHandlerService } from '../../services/event-handler/event-handler.service';
import { ConfigService } from '@nestjs/config';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { CTCartToEEBasketMapper } from '../../mappers/ctCartToEeBasket.mapper';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../../settle/services/order-settle/order-settle.service';
import { BASKET_STORE_SERVICE } from '../basket-store/basket-store.provider';

describe('OrderSubscriptionService', () => {
  let service: OrderSubscriptionService;
  let eventHandlerService: EventHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderSubscriptionService,
        {
          provide: EventHandlerService,
          useValue: {
            processEvent: jest.fn(),
            handleProcessedEventResponse: jest.fn(),
          },
        },
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
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EagleEyeApiClient,
          useValue: {
            wallet: {
              invoke: jest.fn(),
            },
          },
        },
        CTCartToEEBasketMapper,
        {
          provide: Commercetools,
          useValue: {
            getOrderById: jest.fn(),
          },
        },
        {
          provide: OrderSettleService,
          useValue: {
            settleTransactionFromOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderSubscriptionService>(OrderSubscriptionService);
    eventHandlerService = module.get(EventHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle successful order subscription events', async () => {
    const body = {
      resource: {
        typeId: 'order',
        id: 'order-id',
      },
      type: 'OrderPaymentStateChanged',
      paymentState: 'Paid',
    } as unknown as OrderPaymentStateChangedMessage;
    jest.spyOn(eventHandlerService, 'processEvent').mockResolvedValueOnce([
      {
        status: 'fulfilled',
        value: [() => {}],
      },
    ]);
    const result = { status: 'OK' };
    jest
      .spyOn(eventHandlerService, 'handleProcessedEventResponse')
      .mockReturnValue(result as any);
    const response = await service.handleOrderSubscriptionEvents(body as any);
    expect(response).toEqual(result);
  });

  it('should handle failed order subscription events', async () => {
    const body = {
      resource: {
        typeId: 'order',
        id: 'order-id',
      },
      type: 'OrderPaymentStateChanged',
      paymentState: 'Paid',
    } as unknown as OrderPaymentStateChangedMessage;
    jest.spyOn(eventHandlerService, 'processEvent').mockResolvedValueOnce([
      {
        status: 'rejected',
        reason: {},
      },
    ]);
    const result = { status: '4xx' };
    jest
      .spyOn(eventHandlerService, 'handleProcessedEventResponse')
      .mockReturnValue(result as any);
    const response = await service.handleOrderSubscriptionEvents(body as any);
    expect(response).toEqual(result);
  });
});
