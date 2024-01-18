import { Test, TestingModule } from '@nestjs/testing';
import { PromotionService } from './promotion.service';
import { Commercetools } from '../../../common/providers/commercetools/commercetools.provider';
import { EagleEyeApiClient } from '../../../common/providers/eagleeye/eagleeye.provider';
import { ConfigService } from '@nestjs/config';
import { AdjudicationMapper } from '../../mappers/adjudication.mapper';
import { Logger } from '@nestjs/common';
import { BASKET_STORE_SERVICE } from '../../../common/services/basket-store/basket-store.provider';

describe('PromotionService', () => {
  let service: PromotionService;
  let configService: ConfigService;
  let commercetools: Commercetools;
  const walletOpenMock = jest.fn();
  const cartWithoutItems = {
    id: 'cartId',
    customerEmail: 'test@example.com',
    lineItems: [],
    totalPrice: {
      centAmount: 300,
      currencyCode: 'USD',
      type: 'centPrecision',
      fractionDigits: 2,
    },
  };
  const shippingMethodMapMock = [{ key: 'standard-key', upc: '245879' }];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionService,
        {
          provide: Commercetools,
          useValue: {
            getShippingMethods: jest.fn(),
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
        AdjudicationMapper,
        Logger,
        {
          provide: BASKET_STORE_SERVICE,
          useValue: {
            save: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            isEnabled: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PromotionService>(PromotionService);
    configService = module.get<ConfigService>(ConfigService);
    commercetools = module.get<Commercetools>(Commercetools);
  });

  describe('getDiscounts', () => {
    it('should return discounts and their descriptions', async () => {
      const cart = {
        id: 'cartId',
        customerEmail: 'test@example.com',
        lineItems: [
          {
            name: {
              en: 'Example Product',
            },
            variant: {
              sku: 'SKU123',
            },
            price: {
              value: {
                centAmount: 300,
                currencyCode: 'USD',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            },
            totalPrice: {
              centAmount: 300,
              currencyCode: 'USD',
              type: 'centPrecision',
              fractionDigits: 2,
            },
          },
        ],
        totalPrice: {
          centAmount: 300,
          currencyCode: 'USD',
          type: 'centPrecision',
          fractionDigits: 2,
        },
        shippingInfo: {
          shippingMethod: {
            id: 'some-id',
          },
          price: {
            centAmount: 300,
            currencyCode: 'USD',
            type: 'centPrecision',
            fractionDigits: 2,
          },
        },
      };
      const cartReference = { id: 'cartId', obj: cart };
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {
            summary: {
              totalDiscountAmount: {
                promotions: 10,
              },
              adjustmentResults: [
                {
                  resourceId: '1669988',
                  value: 10,
                },
              ],
            },
            contents: [
              {
                upc: 'SKU123',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 10,
                  },
                ],
              },
            ],
          },
          discount: [
            {
              campaignId: '1669988',
              campaignName: 'Example Discount',
            },
          ],
        },
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1')
        .mockReturnValueOnce(shippingMethodMapMock);

      jest
        .spyOn(commercetools, 'getShippingMethods')
        .mockResolvedValueOnce([{ key: 'standard-key' }] as any);

      const result = await service.getDiscounts(
        { status: 200, data: walletOpenResponse },
        cartReference as any,
      );

      expect(result).toEqual({
        discounts: service.adjudicationMapper
          .mapAdjustedBasketToCartDirectDiscounts(
            walletOpenResponse.analyseBasketResults.basket,
            cart as any,
          )
          .concat(
            service.adjudicationMapper.mapAdjustedBasketToItemDirectDiscounts(
              walletOpenResponse.analyseBasketResults.basket,
              cart as any,
            ),
          ),
        basketDiscountDescriptions: [{ description: 'Example Discount' }],
        lineItemsDiscountDescriptions: new Map(),
        errors: [],
        enrichedBasket: walletOpenResponse.analyseBasketResults.basket,
        voucherCodes: [],
        potentialVoucherCodes: [],
      });
    });

    it('should not return discounts and their descriptions when not found', async () => {
      const cartReference = { id: 'cartId', obj: cartWithoutItems };
      const walletOpenResponse = {
        analyseBasketResults: {
          discount: [],
        },
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const result = await service.getDiscounts(
        { status: 200, data: walletOpenResponse },
        cartReference as any,
      );

      expect(result).toEqual({
        discounts: [],
        enrichedBasket: undefined,
        basketDiscountDescriptions: [],
        lineItemsDiscountDescriptions: new Map(),
        errors: [],
        voucherCodes: [],
        potentialVoucherCodes: [],
      });
    });

    it('should return valid voucherCodes, potential voucherCodes and errors when provided by the EE API', async () => {
      const cartReference = {
        id: 'cartId',
        obj: {
          ...cartWithoutItems,
          custom: {
            type: {
              typeId: 'type',
              id: 'some-id',
            },
            fields: {
              'eagleeye-voucherCodes': [
                'not-found-code',
                'valid-code',
                'invalid-code',
              ],
            },
          },
        },
      };
      const walletOpenResponse = {
        analyseBasketResults: {
          discount: [],
        },
        examine: [
          {
            value: 'valid-code',
            resourceType: null,
            resourceId: null,
            errorCode: null,
            errorMessage: null,
          },
          {
            value: 'not-found-code',
            resourceType: null,
            resourceId: null,
            errorCode: 'PCEXNF',
            errorMessage: 'Voucher invalid: Failed to load token',
          },
          {
            value: 'invalid-code',
            resourceType: null,
            resourceId: null,
            errorCode: 'PCEXNV',
            errorMessage:
              'Voucher invalid: identity is required for a points based offering',
          },
        ],
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const result = await service.getDiscounts(
        { status: 200, data: walletOpenResponse },
        cartReference as any,
      );

      expect(result).toEqual({
        discounts: [],
        basketDiscountDescriptions: [],
        enrichedBasket: undefined,
        errors: [
          {
            type: 'EE_API_TOKEN_PCEXNF',
            message: 'Voucher invalid: Failed to load token',
            context: {
              value: 'not-found-code',
              resourceType: null,
              resourceId: null,
              errorCode: 'PCEXNF',
              errorMessage: 'Voucher invalid: Failed to load token',
            },
          },
          {
            type: 'EE_API_TOKEN_PCEXNV',
            message:
              'Voucher invalid: identity is required for a points based offering',
            context: {
              value: 'invalid-code',
              resourceType: null,
              resourceId: null,
              errorCode: 'PCEXNV',
              errorMessage:
                'Voucher invalid: identity is required for a points based offering',
            },
          },
        ],
        lineItemsDiscountDescriptions: new Map(),
        voucherCodes: ['valid-code'],
        potentialVoucherCodes: ['invalid-code'],
      });
    });
  });

  describe('getBasketLevelDiscounts', () => {
    it('should get basket level discounts and return discount drafts', async () => {
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {
            summary: {
              totalDiscountAmount: {
                promotions: 10,
              },
              adjustmentResults: [
                {
                  value: 10,
                },
              ],
            },
          },
          discount: [
            {
              campaignName: 'Example Discount',
            },
          ],
        },
      };

      const result = await service.getBasketLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartWithoutItems as any,
      );

      expect(result).toEqual([
        {
          target: { type: 'totalPrice' },
          value: {
            money: [
              {
                centAmount: 10,
                currencyCode: 'USD',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
            type: 'absolute',
          },
        },
      ]);
    });

    it('should not apply basket level discounts when no valid promotions are found', async () => {
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {},
          discount: [],
        },
      };

      const result = await service.getBasketLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartWithoutItems as any,
      );

      expect(result).toEqual([]);
    });
  });

  describe('getItemLevelDiscounts', () => {
    it('should get item level discounts and return discount drafts', async () => {
      const cart = {
        id: 'cartId',
        customerEmail: 'test@example.com',
        lineItems: [
          {
            name: {
              en: 'Example Product',
            },
            variant: {
              sku: 'SKU123',
            },
            price: {
              value: {
                centAmount: 300,
                currencyCode: 'USD',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            },
            totalPrice: {
              centAmount: 300,
              currencyCode: 'USD',
              type: 'centPrecision',
              fractionDigits: 2,
            },
          },
        ],
        totalPrice: {
          centAmount: 300,
          currencyCode: 'USD',
          type: 'centPrecision',
          fractionDigits: 2,
        },
      };
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {
            summary: {
              totalDiscountAmount: {
                promotions: 10,
              },
            },
            contents: [
              {
                upc: 'SKU123',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 10,
                  },
                ],
              },
            ],
          },
          discount: [
            {
              campaignName: 'Example Discount',
            },
          ],
        },
      };

      const result = await service.getItemLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cart as any,
      );

      expect(result).toEqual([
        {
          target: { predicate: 'sku="SKU123"', type: 'lineItems' },
          value: {
            money: [
              {
                centAmount: 10,
                currencyCode: 'USD',
                fractionDigits: 2,
                type: 'centPrecision',
              },
            ],
            type: 'absolute',
          },
        },
      ]);
    });

    it('should not apply item level discounts when no valid promotions are found', async () => {
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {},
          discount: [],
        },
      };

      const result = await service.getItemLevelDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartWithoutItems as any,
      );

      expect(result).toEqual([]);
    });
  });

  describe('getShippingDiscounts', () => {
    it('should get shipping discounts and return discount drafts', async () => {
      const cart = {
        id: 'cartId',
        customerEmail: 'test@example.com',
        lineItems: [],
        totalPrice: {
          centAmount: 300,
          currencyCode: 'USD',
          type: 'centPrecision',
          fractionDigits: 2,
        },
        shippingInfo: {
          shippingMethod: {
            id: 'some-id',
          },
          price: {
            centAmount: 300,
            currencyCode: 'USD',
            type: 'centPrecision',
            fractionDigits: 2,
          },
        },
      };
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {
            summary: {
              totalDiscountAmount: {
                promotions: 10,
              },
            },
            contents: [
              {
                upc: '245879',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 10,
                  },
                ],
              },
            ],
          },
          discount: [
            {
              campaignName: 'Example Shipping Discount',
            },
          ],
        },
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const result = await service.getShippingDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cart as any,
      );

      expect(result).toEqual([
        {
          target: { type: 'shipping' },
          value: {
            money: [
              {
                centAmount: 10,
                currencyCode: 'USD',
                type: 'centPrecision',
                fractionDigits: 2,
              },
            ],
            type: 'absolute',
          },
        },
      ]);
    });

    it('should not apply shipping discounts when no valid promotions are found', async () => {
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {},
          discount: [],
        },
      };

      const result = await service.getShippingDiscounts(
        walletOpenResponse.analyseBasketResults.basket,
        cartWithoutItems as any,
      );

      expect(result).toEqual([]);
    });
  });
});
