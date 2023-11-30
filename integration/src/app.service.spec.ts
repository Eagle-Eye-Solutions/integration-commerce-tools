import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import { ExtensionInput } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/extension';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import { PromotionService } from './services/promotions/promotions.service';
import { BASKET_STORE_SERVICE } from './services/basket-store/basket-store.provider';
import { BasketStoreService } from './services/basket-store/basket-store.interface';

describe('AppService', () => {
  let service: AppService;
  let circuitBreakerService: CircuitBreakerService;
  let promotionService: PromotionService;
  let basketStoreService: jest.Mocked<BasketStoreService>;

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
            delete: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle extension request', async () => {
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
    const result = {
      actions: [
        {
          action: 'setCustomType',
          fields: {
            'eagleeye-errors': [],
            'eagleeye-appliedDiscounts': discountDescriptions.map(
              (d) => d.description,
            ),
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

  it('should return token errors when provided by the EE API', async () => {
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
    jest.spyOn(promotionService, 'getDiscounts').mockResolvedValueOnce({
      discounts: discountDrafts,
      discountDescriptions,
      errors,
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

  class CircuitBreakerError extends Error {
    constructor(public code: string) {
      super();
    }
  }

  it('should return EE_API_CIRCUIT_OPEN error in the cart custom type when the circuit breaker is open', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123', obj: {} as any },
    };
    const error = new CircuitBreakerError('EOPENBREAKER');
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
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

  it('should  return an empty action array if the request body is for an unsupported CT resource type', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'product-type', id: '123', obj: {} as any }, //invalid product-type
    };
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual({ actions: [] });

    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });
});
