import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import { ExtensionInput } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/extension';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';

describe('AppService', () => {
  let service: AppService;
  let circuitBreakerService: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: CircuitBreakerService, useValue: { fire: jest.fn() } },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    circuitBreakerService = module.get<CircuitBreakerService>(
      CircuitBreakerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle extension request', async () => {
    const body: ExtensionInput = {
      action: 'Create',
      resource: { typeId: 'cart', id: '123' },
    };
    const result = {
      actions: [
        {
          action: 'setCustomType',
          fields: {
            errors: [],
          },
          type: {
            key: 'eagleEye',
            typeId: 'type',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [
            {
              target: {
                predicate: '1=1',
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
          ],
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
    jest.spyOn(circuitBreakerService, 'fire').mockRejectedValue(error);
    const response = await service.handleExtensionRequest(body);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          fields: {
            errors: [
              '{"type":"EE_API_UNAVAILABLE","message":"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated"}',
            ],
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
    jest.spyOn(circuitBreakerService, 'fire').mockRejectedValue(error);
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
