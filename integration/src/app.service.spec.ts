import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import { ExtensionInput } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/extension';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import { PromotionService } from './services/promotions/promotions.service';

describe('AppService', () => {
  let service: AppService;
  let circuitBreakerService: CircuitBreakerService;
  let romotionService: PromotionService;

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
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    circuitBreakerService = module.get<CircuitBreakerService>(
      CircuitBreakerService,
    );
    romotionService = module.get<PromotionService>(PromotionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle extension request', async () => {
    const body: ExtensionInput = {
      action: 'Create',
      resource: { typeId: 'cart', id: '123' },
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
    ];
    const discountDescriptions = [
      {
        description: 'Example Discount',
      },
    ];
    jest.spyOn(romotionService, 'getDiscounts').mockResolvedValueOnce({
      discounts: discountDrafts,
      discountDescriptions,
    } as any);
    const result = {
      actions: [
        {
          action: 'setCustomType',
          fields: {
            errors: [],
            appliedDiscounts: discountDescriptions.map((d) => d.description),
          },
          type: {
            key: 'eagleEye',
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
      resource: { typeId: 'cart', id: '123' },
    };
    const error = new EagleEyeApiException(
      'EE_API_UNAVAILABLE',
      'Circuit open',
    );
    jest.spyOn(romotionService, 'getDiscounts').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            errors: [
              '{"type":"EE_API_UNAVAILABLE","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
            ],
            appliedDiscounts: [],
          },
          type: {
            key: 'eagleEye',
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
  });

  class CircuitBreakerError extends Error {
    constructor(public code: string) {
      super();
    }
  }

  it('should return EE_API_CIRCUIT_OPEN error in the cart custom type when the circuit breaker is open', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123' },
    };
    const error = new CircuitBreakerError('EOPENBREAKER');
    jest.spyOn(romotionService, 'getDiscounts').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response.actions).toHaveLength(2);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            errors: [
              '{"type":"EE_API_CIRCUIT_OPEN","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
            ],
            appliedDiscounts: [],
          },
          type: {
            key: 'eagleEye',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [],
        },
      ],
    });
  });

  it('should return EE_API_GENERIC_ERROR error in the cart custom type when any other error is thrown', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'cart', id: '123' },
    };
    const error = new Error('SOME_OTHER_ERROR');
    jest.spyOn(romotionService, 'getDiscounts').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response.actions).toHaveLength(2);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            errors: [
              '{"type":"EE_API_GENERIC_ERROR","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
            ],
            appliedDiscounts: [],
          },
          type: {
            key: 'eagleEye',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [],
        },
      ],
    });
  });

  it('should  return an empty action array if the request body is for an unsupported CT resource type', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: { typeId: 'product-type', id: '123' }, //invalid product-type
    };
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual({ actions: [] });
  });
});
