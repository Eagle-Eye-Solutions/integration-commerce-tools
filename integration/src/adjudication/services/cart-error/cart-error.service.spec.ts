import { Test, TestingModule } from '@nestjs/testing';
import { CartErrorService } from './cart-error.service';
import { BasketStoreService } from '../../../common/services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from '../../../common/services/basket-store/basket-store.provider';
import { CartTypeDefinition } from '../../../common/providers/commercetools/custom-type/cart-type-definition';
import { LineItemTypeDefinition } from '../../../common/providers/commercetools/custom-type/line-item-type-definition';
import { Logger } from '@nestjs/common';
import { EagleEyeApiException } from '../../../common/exceptions/eagle-eye-api.exception';
import { ConfigService } from '@nestjs/config';

describe('CartErrorService', () => {
  let service: CartErrorService;
  let basketStoreService: BasketStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartErrorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
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
        CartTypeDefinition,
        LineItemTypeDefinition,
        {
          provide: 'TypeDefinitions',
          useFactory: (cartTypeDefinition, lineItemTypeDefinition) => [
            cartTypeDefinition,
            lineItemTypeDefinition,
          ],
          inject: [CartTypeDefinition, LineItemTypeDefinition],
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CartErrorService>(CartErrorService);
    basketStoreService = module.get<BasketStoreService>(BASKET_STORE_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleError', () => {
    it('should handle error and return extension actions', async () => {
      const error = new Error('Test error');
      const cart = {
        lineItems: [
          {
            id: '123',
            custom: {
              type: {
                typeId: 'type',
                key: 'line-item-type',
              },
              fields: {},
            },
          },
        ],
        custom: {
          type: { typeId: 'type', key: 'custom-cart-type' },
          fields: {},
        },
      };
      const body = { resource: { id: '123', typeId: 'cart', obj: cart } };

      jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
      jest.spyOn(basketStoreService, 'delete').mockResolvedValue(undefined);

      const result = await service.handleError(error, body as any, cart as any);
      expect(result).toEqual({
        actions: [
          {
            action: 'setCustomField',
            name: 'eagleeye-errors',
            value: [
              '{"type":"EE_API_GENERIC_ERROR","message":"Unexpected error with getting the promotions and loyalty points"}',
            ],
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-appliedDiscounts',
            value: [],
          },
          { action: 'setCustomField', name: 'eagleeye-basketStore', value: '' },
          { action: 'setCustomField', name: 'eagleeye-basketUri', value: '' },
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
          { action: 'setCustomField', name: 'eagleeye-action', value: '' },
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
            action: 'setLineItemCustomField',
            lineItemId: '123',
            name: 'eagleeye-loyaltyCredits',
            value: '',
          },
          {
            action: 'setLineItemCustomField',
            lineItemId: '123',
            name: 'eagleeye-appliedDiscounts',
            value: [],
          },

          { action: 'setDirectDiscounts', discounts: [] },
        ],
      });
      expect(basketStoreService.delete).toHaveBeenCalledWith(body.resource.id);
    });

    it('should handle EagleEyeApiException and return extension actions', async () => {
      const error = new EagleEyeApiException(
        'EE_API_UNAVAILABLE',
        'Error message',
      );
      const cart = {
        lineItems: [
          {
            id: '123',
            custom: {
              type: {
                typeId: 'type',
                key: 'line-item-type',
              },
              fields: {},
            },
          },
        ],
      };
      const body = { resource: { id: '123', typeId: 'cart', obj: cart } };

      jest.spyOn(basketStoreService, 'isEnabled').mockReturnValue(true);
      jest.spyOn(basketStoreService, 'delete').mockResolvedValue(undefined);

      const result = await service.handleError(error, body as any, cart as any);

      expect(result).toEqual({
        actions: [
          {
            action: 'setCustomType',
            type: { typeId: 'type', key: 'custom-cart-type' },
            fields: {
              'eagleeye-errors': [
                '{"type":"EE_API_UNAVAILABLE","message":"Error message"}',
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
          },
          {
            action: 'setLineItemCustomField',
            lineItemId: '123',
            name: 'eagleeye-loyaltyCredits',
            value: '',
          },
          {
            action: 'setLineItemCustomField',
            lineItemId: '123',
            name: 'eagleeye-appliedDiscounts',
            value: [],
          },

          { action: 'setDirectDiscounts', discounts: [] },
        ],
      });
      expect(basketStoreService.delete).toHaveBeenCalledWith(body.resource.id);
    });
  });
});
