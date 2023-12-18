import { Test, TestingModule } from '@nestjs/testing';
import { PromotionService } from './promotions.service';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { ConfigService } from '@nestjs/config';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import { Logger } from '@nestjs/common';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';
import { BASKET_STORE_SERVICE } from '../basket-store/basket-store.provider';

describe('PromotionService', () => {
  let service: PromotionService;
  let circuitBreakerService: CircuitBreakerService;
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
        CTCartToEEBasketMapper,
        { provide: CircuitBreakerService, useValue: { fire: jest.fn() } },
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
    circuitBreakerService = module.get<CircuitBreakerService>(
      CircuitBreakerService,
    );
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
              campaignName: 'Example Discount',
            },
          ],
        },
      };

      const cbFireMock = jest
        .spyOn(circuitBreakerService, 'fire')
        .mockResolvedValue({ status: 200, data: walletOpenResponse });

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1')
        .mockReturnValueOnce(shippingMethodMapMock);

      jest
        .spyOn(commercetools, 'getShippingMethods')
        .mockResolvedValueOnce([{ key: 'standard-key' }] as any);

      const result = await service.getDiscounts(cartReference as any);

      expect(cbFireMock).toHaveBeenCalled();
      expect(result).toEqual({
        discounts: service.cartToBasketMapper
          .mapAdjustedBasketToCartDirectDiscounts(
            walletOpenResponse.analyseBasketResults.basket,
            cart as any,
          )
          .concat(
            service.cartToBasketMapper.mapAdjustedBasketToItemDirectDiscounts(
              walletOpenResponse.analyseBasketResults.basket,
              cart as any,
            ),
          ),
        discountDescriptions:
          service.cartToBasketMapper.mapBasketDiscountsToDiscountDescriptions(
            walletOpenResponse.analyseBasketResults.discount,
          ),
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

      const cbFireMock = jest
        .spyOn(circuitBreakerService, 'fire')
        .mockResolvedValue({ status: 200, data: walletOpenResponse });

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const result = await service.getDiscounts(cartReference as any);

      expect(cbFireMock).toHaveBeenCalled();
      expect(result).toEqual({
        discounts: [],
        enrichedBasket: undefined,
        discountDescriptions: [],
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

      const cbFireMock = jest
        .spyOn(circuitBreakerService, 'fire')
        .mockResolvedValue({ status: 200, data: walletOpenResponse });

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const result = await service.getDiscounts(cartReference as any);

      expect(cbFireMock).toHaveBeenCalled();
      expect(result).toEqual({
        discounts: [],
        discountDescriptions: [],
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
        voucherCodes: ['valid-code'],
        potentialVoucherCodes: ['invalid-code'],
      });
    });

    it('should add identity not found error when provided by the EE API', async () => {
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
              'eagleeye-identityValue': '1234590',
            },
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
              adjustmentResults: [
                {
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
              campaignName: 'Example Discount',
            },
          ],
        },
      };

      const cbFireMock = jest
        .spyOn(circuitBreakerService, 'fire')
        .mockRejectedValueOnce({ type: 'EE_IDENTITY_NOT_FOUND' })
        .mockResolvedValueOnce({ status: 200, data: walletOpenResponse });

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const result = await service.getDiscounts(cartReference as any);
      expect(cbFireMock).toHaveBeenCalled();
      expect(result).toEqual({
        discounts: [
          {
            value: {
              type: 'absolute',
              money: [
                {
                  centAmount: 10,
                  currencyCode: 'USD',
                  type: 'centPrecision',
                  fractionDigits: 2,
                },
              ],
            },
            target: { type: 'totalPrice' },
          },
        ],
        discountDescriptions: [{ description: 'Example Discount' }],
        errors: [
          {
            type: 'EE_API_CUSTOMER_NF',
            message: '1234590 - Customer identity not found',
            context: { type: 'EE_IDENTITY_NOT_FOUND' },
          },
        ],
        voucherCodes: [],
        potentialVoucherCodes: [],
        enrichedBasket: {
          summary: {
            totalDiscountAmount: { promotions: 10 },
            adjustmentResults: [{ value: 10 }],
          },
          contents: [
            { upc: 'SKU123', adjustmentResults: [{ totalDiscountAmount: 10 }] },
          ],
        },
      });
    });

    it('should throw error when received any other error apart from identity not found during the wallet open call', async () => {
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
              'eagleeye-identityValue': '1234590',
            },
          },
        },
      };

      const cbFireMock = jest
        .spyOn(circuitBreakerService, 'fire')
        .mockRejectedValue({ type: 'EE_NOT_IDENTITY_NOT_FOUND_ERROR' });

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      let expectFlag: boolean = false;
      try {
        await service.getDiscounts(cartReference as any);
      } catch (error) {
        expectFlag = true;
      }
      expect(cbFireMock).toHaveBeenCalled();
      expect(expectFlag).toBeTruthy;
    });

    it('should throw error when 2nd wallet open call returns an error as well in the identity not found scenario', async () => {
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
              'eagleeye-identityValue': '1234590',
            },
          },
        },
      };

      const cbFireMock = jest
        .spyOn(circuitBreakerService, 'fire')
        .mockImplementationOnce(() => {
          throw {
            type: 'EE_IDENTITY_NOT_FOUND',
          };
        })
        .mockImplementationOnce(() => {
          throw new Error();
        });

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      let expectFlag: boolean = false;
      try {
        await service.getDiscounts(cartReference as any);
      } catch (error) {
        expectFlag = true;
      }

      expect(cbFireMock).toHaveBeenCalled();
      expect(expectFlag).toBeTruthy;
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

  describe('getBasketDiscountDescriptions', () => {
    it('should return descriptions for applied discounts', async () => {
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

      const result = await service.getBasketDiscountDescriptions(
        walletOpenResponse.analyseBasketResults.discount,
      );

      expect(result).toEqual([
        {
          description: 'Example Discount',
        },
      ]);
    });

    it('should not get descriptions when no valid promotions are found', async () => {
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {},
          discount: [],
        },
      };

      const result = await service.getBasketDiscountDescriptions(
        walletOpenResponse.analyseBasketResults.discount,
      );

      expect(result).toEqual([]);
    });
  });
});
