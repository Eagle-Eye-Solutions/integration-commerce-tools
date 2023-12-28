import { Test, TestingModule } from '@nestjs/testing';
import { CartExtensionService } from './cart-extension.service';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';
import { ExtensionInput } from '@commercetools/platform-sdk';
import { EagleEyeApiException } from '../../common/exceptions/eagle-eye-api.exception';
import { PromotionService } from '../../services/promotion/promotion.service';
import { BASKET_STORE_SERVICE } from '../../services/basket-store/basket-store.provider';
import { BasketStoreService } from '../../services/basket-store/basket-store.interface';
import { EagleEyePluginException } from '../../common/exceptions/eagle-eye-plugin.exception';
import { ConfigService } from '@nestjs/config';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../services/order-settle/order-settle.service';
import { CartTypeDefinition } from '../../providers/commercetools/custom-type/cart-type-definition';
import { LoyaltyService } from '../../services/loyalty/loyalty.service';

class CircuitBreakerError extends Error {
  constructor(public code: string) {
    super();
  }
}

describe('CartExtensionService', () => {
  let service: CartExtensionService;
  let circuitBreakerService: CircuitBreakerService;
  let promotionService: PromotionService;
  let basketStoreService: jest.Mocked<BasketStoreService>;
  let loyaltyService: LoyaltyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartExtensionService,
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
          provide: LoyaltyService,
          useValue: {
            getEarnAndCredits: jest.fn(),
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
        CartTypeDefinition,
        {
          provide: 'TypeDefinitions',
          useFactory: (cartTypeDefinition) => [cartTypeDefinition],
          inject: [CartTypeDefinition],
        },
      ],
    }).compile();

    service = module.get<CartExtensionService>(CartExtensionService);
    circuitBreakerService = module.get<CircuitBreakerService>(
      CircuitBreakerService,
    );
    promotionService = module.get<PromotionService>(PromotionService);
    basketStoreService = module.get(BASKET_STORE_SERVICE);
    loyaltyService = module.get<LoyaltyService>(LoyaltyService);
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
        obj: {
          lineItems: [],
        } as any,
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
    const loyaltyEarnAndCredits = {
      earn: {
        basket: {
          balance: 400,
          offers: [],
        },
      },
      credit: {
        basket: {
          balance: 0,
          offers: [],
        },
        items: {
          balance: 0,
          offers: [],
        },
      },
    };
    jest.spyOn(promotionService, 'getDiscounts').mockResolvedValueOnce({
      discounts: discountDrafts,
      discountDescriptions,
      errors: [],
    } as any);
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest
      .spyOn(loyaltyService, 'getEarnAndCredits')
      .mockResolvedValueOnce(loyaltyEarnAndCredits);
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': JSON.stringify(
              loyaltyEarnAndCredits,
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
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({
      status: 200,
      data: {},
    });
    const response = await service.handleCartExtensionRequest(body);
    expect(response).toEqual(result);
    expect(basketStoreService.save).toBeCalledTimes(1);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should not store the enriched basket if that option is not enabled', async () => {
    const body: ExtensionInput = {
      action: 'Create',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {
          lineItems: [],
        } as any,
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
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
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({
      status: 200,
      data: {},
    });
    const response = await service.handleCartExtensionRequest(body);
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
        obj: {
          lineItems: [],
        } as any,
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
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
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({
      status: 200,
      data: {},
    });
    const response = await service.handleCartExtensionRequest(body);
    expect(response).toEqual(result);
    expect(basketStoreService.save).toBeCalledTimes(1);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should return EE_API_UNAVAILABLE error in the cart custom type when the API request to EagleEye fails', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {
          lineItems: [],
        } as any,
      },
    };
    const error = new EagleEyeApiException(
      'EE_API_UNAVAILABLE',
      'The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated',
    );
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    jest.spyOn(circuitBreakerService, 'fire').mockRejectedValue(error);
    const response = await service.handleCartExtensionRequest(body);
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
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

  it('should return EE_IDENTITY_NOT_FOUND error custom type when identityValue is not found in EE and retry without it', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {
          lineItems: [],
          custom: {
            fields: {
              'eagleeye-identityValue': 'non_existant_identity',
            },
          },
        } as any,
      },
    };
    const error = new EagleEyeApiException(
      'EE_IDENTITY_NOT_FOUND',
      "The customer identity doesn't exist in EE AIR Platform",
    );
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest
      .spyOn(circuitBreakerService, 'fire')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        status: 200,
        data: {},
      });
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
    const response = await service.handleCartExtensionRequest(body);
    expect(response).toEqual({
      actions: [
        {
          action: 'setCustomType',
          type: {
            typeId: 'type',
            key: 'custom-cart-type',
          },
          fields: {
            'eagleeye-errors': [
              JSON.stringify({
                type: 'EE_API_CUSTOMER_NF',
                message: 'non_existant_identity - Customer identity not found',
                context: {
                  type: 'EE_IDENTITY_NOT_FOUND',
                },
              }),
            ],
            'eagleeye-basketStore': undefined,
            'eagleeye-basketUri': undefined,
            'eagleeye-identityValue': '',
            'eagleeye-appliedDiscounts': [
              'Example Discount',
              'Example Item Discount',
              'Example Shipping Discount',
            ],
            'eagleeye-voucherCodes': [],
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
          },
        },
        {
          action: 'setDirectDiscounts',
          discounts: [
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
          ],
        },
      ],
    });
    expect(response.actions).toHaveLength(2);
    expect(basketStoreService.save).toBeCalledTimes(1);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should throw error when the API request to EagleEye fails with any other error after retry', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {
          lineItems: [],
        } as any,
      },
    };
    const error = new EagleEyeApiException(
      'EE_IDENTITY_NOT_FOUND',
      "The customer identity doesn't exist in EE AIR Platform",
    );
    const unexpectedError = { type: 'EE_NOT_IDENTITY_NOT_FOUND_ERROR' };
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    jest
      .spyOn(circuitBreakerService, 'fire')
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(unexpectedError);
    const response = await service.handleCartExtensionRequest(body);
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
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
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({
      status: 200,
      data: {},
    });
    const response = await service.handleCartExtensionRequest(body);
    expect(response.actions).toHaveLength(2);

    expect(basketStoreService.save).toBeCalledTimes(0);
    expect(basketStoreService.delete).toBeCalledTimes(0);
  });

  it('should return EE_API_CIRCUIT_OPEN error in the cart custom type when the circuit breaker is open', async () => {
    const body: ExtensionInput = {
      action: 'Update',
      resource: {
        typeId: 'cart',
        id: '123',
        obj: {
          lineItems: [],
        } as any,
      },
    };
    const error = new CircuitBreakerError('EOPENBREAKER');
    jest.spyOn(promotionService, 'getDiscounts').mockRejectedValue(error);
    jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
    jest.spyOn(circuitBreakerService, 'fire').mockRejectedValue(error);
    const response = await service.handleCartExtensionRequest(body);
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
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
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({
      status: 200,
      data: {},
    });
    const response = await service.handleCartExtensionRequest(body);
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
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
    jest.spyOn(circuitBreakerService, 'fire').mockResolvedValue({
      status: 200,
      data: {},
    });
    const response = await service.handleCartExtensionRequest(body);
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
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
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
