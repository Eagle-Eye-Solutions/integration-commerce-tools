import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import {
  ExtensionInput,
  OrderPaymentStateChangedMessage,
} from '@commercetools/platform-sdk';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import { PromotionService } from './services/promotions/promotions.service';
import { BASKET_STORE_SERVICE } from './services/basket-store/basket-store.provider';
import { BasketStoreService } from './services/basket-store/basket-store.interface';
import { EagleEyePluginException } from './common/exceptions/eagle-eye-plugin.exception';
import { EventHandlerService } from './services/event-handler/event-handler.service';
import { ConfigService } from '@nestjs/config';
import { EagleEyeApiClient } from './providers/eagleeye/eagleeye.provider';
import { CTCartToEEBasketMapper } from './common/mappers/ctCartToEeBasket.mapper';
import { Commercetools } from './providers/commercetools/commercetools.provider';
import { OrderSettleService } from './services/order-settle/order-settle.service';

class CircuitBreakerError extends Error {
  constructor(public code: string) {
    super();
  }
}

describe('AppService', () => {
  let service: AppService;
  let circuitBreakerService: CircuitBreakerService;
  let promotionService: PromotionService;
  let basketStoreService: jest.Mocked<BasketStoreService>;
  let orderSettleService: OrderSettleService;
  let eventHandlerService: EventHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: CircuitBreakerService, useValue: { fire: jest.fn() } },
        {
          provide: PromotionService,
          useValue: {
            getBasketLevelDiscounts: jest.fn(),
            getItemLevelDiscounts: jest.fn(),
            getDiscounts: jest.fn(),
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
          provide: EventHandlerService,
          useValue: {
            processEvent: jest.fn(),
            handleProcessedEventResponse: jest.fn(),
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

    service = module.get<AppService>(AppService);
    circuitBreakerService = module.get<CircuitBreakerService>(
      CircuitBreakerService,
    );
    promotionService = module.get<PromotionService>(PromotionService);
    basketStoreService = module.get(BASKET_STORE_SERVICE);
    orderSettleService = module.get(OrderSettleService);
    eventHandlerService = module.get(EventHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle cart extension request', async () => {
    const body: ExtensionInput = {
      action: 'Create',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {} as any,
      },
    };
    const discountDrafts = [
      {
        target: {
          type: 'totalPrice',
        },
        value: {
          money: [
            {
              centAmount: 100,
              currencyCode: 'GBP',
              fractionDigits: 2,
              type: 'centPrecision',
            },
          ],
          type: 'absolute',
        },
      },
      {
        target: {
          predicate: 'sku="SKU123"',
          type: 'lineItems',
        },
        value: {
          money: [
            {
              centAmount: 100,
              currencyCode: 'GBP',
              fractionDigits: 2,
              type: 'centPrecision',
            },
          ],
          type: 'absolute',
        },
      },
      {
        target: {
          type: 'shipping',
        },
        value: {
          money: [
            {
              centAmount: 10,
              currencyCode: 'GBP',
              fractionDigits: 2,
              type: 'centPrecision',
            },
          ],
          type: 'absolute',
        },
      },
    ];
    const discountDescriptions = [
      {
        description: 'Example Discount',
      },
      {
        description: 'Example Item Discount',
      },
      {
        description: 'Example Shipping Discount',
      },
    ];
    jest.spyOn(promotionService, 'getDiscounts').mockResolvedValueOnce({
      discounts: discountDrafts,
      discountDescriptions,
      errors: [],
    } as any);
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    const result = {
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': [],
            'eagleeye-appliedDiscounts': discountDescriptions.map(
              (d) => d.description,
            ),
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-voucherCodes': [],
          },
          type: {
            key: 'custom-cart-type',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: discountDrafts,
        },
      ],
    };
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({});
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual(result);
    expect(basketStoreService.save).toBeCalledTimes(1);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should handle order extension request', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: {
        typeId: 'order',
        id: '123',
        obj: {
          custom: {
            fields: {
              'eagleeye-action': 'SETTLE',
              'eagleeye-basketStore': 'CUSTOM_TYPE',
              'eagleeye-basketUri': 'some/uri',
            },
          },
          cart: {
            id: 'cart-id',
          },
        } as any,
      },
    };
    const updateActions = [
      {
        action: 'setCustomField',
        name: 'eagleeye-action',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketStore',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketUri',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-settledStatus',
        value: 'SETTLED',
      },
    ];
    jest
      .spyOn(orderSettleService, 'settleTransactionFromOrder')
      .mockResolvedValue(updateActions as any);
    const result = {
      actions: updateActions,
    };
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual(result);
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
    const response = await service.handleSubscriptionEvents(body as any);
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
    const response = await service.handleSubscriptionEvents(body as any);
    expect(response).toEqual(result);
  });

  it('should not store the enriched basket if that option is not enabled', async () => {
    const body: ExtensionInput = {
      action: 'Create',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {} as any,
      },
    };
    const discountDrafts = [
      {
        target: {
          type: 'totalPrice',
        },
        value: {
          money: [
            {
              centAmount: 100,
              currencyCode: 'GBP',
              fractionDigits: 2,
              type: 'centPrecision',
            },
          ],
          type: 'absolute',
        },
      },
    ];
    const discountDescriptions = [];
    jest.spyOn(promotionService, 'getDiscounts').mockResolvedValueOnce({
      discounts: discountDrafts,
      discountDescriptions,
      errors: [],
    } as any);
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(false);
    const result = {
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': [],
            'eagleeye-appliedDiscounts': discountDescriptions.map(
              (d) => d.description,
            ),
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-voucherCodes': [],
          },
          type: {
            key: 'custom-cart-type',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: discountDrafts,
        },
      ],
    };
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({});
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual(result);
    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should return valid token and invalid token errors when provided by the EE API', async () => {
    const body: ExtensionInput = {
      action: 'Create',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {} as any,
      },
    };
    const discountDrafts = [];
    const discountDescriptions = [];
    const errors = [
      {
        type: 'EE_API_TOKEN_PCEXNF',
        message: 'Voucher invalid: Failed to load token',
        context: {
          value: '1234590',
          resourceType: null,
          resourceId: null,
          errorCode: 'PCEXNF',
          errorMessage: 'Voucher invalid: Failed to load token',
        },
      },
    ];
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest.spyOn(promotionService, 'getDiscounts').mockResolvedValueOnce({
      discounts: discountDrafts,
      discountDescriptions,
      errors,
      voucherCodes: ['valid-token'],
    } as any);
    const result = {
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': errors.map((error) => JSON.stringify(error)),
            'eagleeye-appliedDiscounts': discountDescriptions.map(
              (d) => d.description,
            ),
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-voucherCodes': ['valid-token'],
          },
          type: {
            key: 'custom-cart-type',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: discountDrafts,
        },
      ],
    };
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({});
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual(result);
    expect(basketStoreService.save).toBeCalledTimes(1);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should return EE_API_UNAVAILABLE error in the cart custom type when the API request to EagleEye fails', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123', obj: {} as any },
    };
    const error = new EagleEyeApiException(
      'EE_API_UNAVAILABLE',
      'The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated',
    );
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': [
              '{"type":"EE_API_UNAVAILABLE","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
            ],
            'eagleeye-appliedDiscounts': [],
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-voucherCodes': [],
          },
          type: {
            key: 'custom-cart-type',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [],
        },
      ],
    });
    expect(response.actions).toHaveLength(2);

    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(1);
  });

  it('should not try to delete the enriched basket when the feature is not enabled and the EE API fails', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123', obj: {} as any },
    };
    const error = new EagleEyeApiException(
      'EE_API_UNAVAILABLE',
      'The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated',
    );
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(false);
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response.actions).toHaveLength(2);

    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should return EE_API_CIRCUIT_OPEN error in the cart custom type when the circuit breaker is open', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123', obj: {} as any },
    };
    const error = new CircuitBreakerError('EOPENBREAKER');
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    const response = await service.handleExtensionRequest(body);
    expect(response.actions).toHaveLength(2);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': [
              '{"type":"EE_API_CIRCUIT_OPEN","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
            ],
            'eagleeye-appliedDiscounts': [],
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-voucherCodes': [],
          },
          type: {
            key: 'custom-cart-type',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [],
        },
      ],
    });

    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(1);
  });

  it('should return EE_API_GENERIC_ERROR error in the cart custom type when any other error is thrown', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123', obj: {} as any },
    };
    const error = new Error('SOME_OTHER_ERROR');
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response.actions).toHaveLength(2);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': [
              '{"type":"EE_API_GENERIC_ERROR","message":"Unexpected error with getting the promotions and loyalty points"}',
            ],
            'eagleeye-appliedDiscounts': [],
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-voucherCodes': [],
          },
          type: {
            key: 'custom-cart-type',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [],
        },
      ],
    });

    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(1);
  });

  it('should add the BASKET_DELETE error message to the errors list if fails to delete the saved basked following another error', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123', obj: {} as any },
    };
    const error = new Error('SOME_OTHER_ERROR');
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest
      .spyOn(basketStoreService, 'delete')
      .mockRejectedValue(
        new EagleEyePluginException(
          'BASKET_STORE_DELETE',
          'Error deleting enriched basket',
        ),
      );
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response.actions).toHaveLength(2);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': [
              '{"type":"EE_API_GENERIC_ERROR","message":"Unexpected error with getting the promotions and loyalty points"}',
            ],
            'eagleeye-appliedDiscounts': [],
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-voucherCodes': [],
          },
          type: {
            key: 'custom-cart-type',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [],
        },
      ],
    });

    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(1);
  });
});
