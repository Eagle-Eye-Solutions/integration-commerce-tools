import { Test, TestingModule } from '@nestjs/testing';
import { OrderSettleService } from './order-settle.service';
import { BasketStoreService } from '../../../common/services/basket-store/basket-store.interface';
import { EagleEyeApiClient } from '../../../common/providers/eagleeye/eagleeye.provider';
import { Commercetools } from '../../../common/providers/commercetools/commercetools.provider';
import { SettleMapper } from '../../mappers/settle.mapper';
import { CircuitBreakerService } from '../../../common/providers/circuit-breaker/circuit-breaker.service';
import { BASKET_STORE_SERVICE } from '../../../common/services/basket-store/basket-store.provider';
import { Order } from '@commercetools/platform-sdk';
import { EagleEyePluginException } from '../../../common/exceptions/eagle-eye-plugin.exception';
import { ConfigService } from '@nestjs/config';

describe('OrderSettleService', () => {
  let orderSettleService: OrderSettleService;
  let basketStoreService: BasketStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderSettleService,
        {
          provide: Commercetools,
          useValue: {
            getOrderById: jest.fn(),
            updateOrderById: jest.fn(),
          },
        },
        SettleMapper,
        {
          provide: EagleEyeApiClient,
          useValue: {
            wallet: {
              invoke: jest.fn(),
            },
          },
        },
        {
          provide: BASKET_STORE_SERVICE,
          useValue: {
            save: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            isEnabled: jest.fn(),
            hasSavedBasket: jest.fn(),
          },
        },
        { provide: CircuitBreakerService, useValue: { fire: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    orderSettleService = module.get<OrderSettleService>(OrderSettleService);
    basketStoreService = module.get<BasketStoreService>(BASKET_STORE_SERVICE);
  });

  describe('settleTransactionFromOrder', () => {
    it('should settle transaction from order and return actions', async () => {
      const ctOrder: Order = {
        id: 'order-id',
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {
            'eagleeye-action': 'EXAMPLE',
          },
        },
      } as any;
      const hasSavedBasketSpy = jest
        .spyOn(basketStoreService, 'hasSavedBasket')
        .mockReturnValue(true);
      const deleteBasketSpy = jest
        .spyOn(basketStoreService, 'delete')
        .mockResolvedValue(undefined);
      const getBasketSpy = jest
        .spyOn(basketStoreService, 'get')
        .mockResolvedValue({
          enrichedBasket: {
            contents: [],
          },
        });
      const walletSettleInvokeSpy = jest
        .spyOn(orderSettleService, 'walletSettleInvoke')
        .mockResolvedValueOnce({
          status: 200,
          data: {},
        });

      const result =
        await orderSettleService.settleTransactionFromOrder(ctOrder);

      expect(hasSavedBasketSpy).toHaveBeenCalledWith(ctOrder);
      expect(walletSettleInvokeSpy).toHaveBeenCalledWith(
        'settle',
        expect.anything(),
      );
      expect(deleteBasketSpy).toHaveBeenCalledWith(ctOrder.cart.id);
      expect(getBasketSpy).toHaveBeenCalled();
      expect(result).toEqual([
        {
          action: 'setCustomField',
          name: 'eagleeye-settledStatus',
          value: 'SETTLED',
        },
        {
          action: 'setCustomField',
          name: 'eagleeye-action',
        },
      ]);
    });

    it('should return error when transaction is settled but has status code 207', async () => {
      const ctOrder: Order = {
        id: 'order-id',
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {
            'eagleeye-action': 'EXAMPLE',
          },
        },
      } as any;
      const hasSavedBasketSpy = jest
        .spyOn(basketStoreService, 'hasSavedBasket')
        .mockReturnValue(true);
      const deleteBasketSpy = jest
        .spyOn(basketStoreService, 'delete')
        .mockResolvedValue(undefined);
      const getBasketSpy = jest
        .spyOn(basketStoreService, 'get')
        .mockResolvedValue({
          enrichedBasket: {
            contents: [],
          },
        });
      const walletSettleInvokeSpy = jest
        .spyOn(orderSettleService, 'walletSettleInvoke')
        .mockResolvedValueOnce({
          status: 207,
          data: {},
        });

      const result =
        await orderSettleService.settleTransactionFromOrder(ctOrder);

      expect(hasSavedBasketSpy).toHaveBeenCalledWith(ctOrder);
      expect(walletSettleInvokeSpy).toHaveBeenCalledWith(
        'settle',
        expect.anything(),
      );
      expect(deleteBasketSpy).toHaveBeenCalledWith(ctOrder.cart.id);
      expect(getBasketSpy).toHaveBeenCalled();
      expect(result).toEqual([
        {
          action: 'setCustomField',
          name: 'eagleeye-settledStatus',
          value: 'SETTLED',
        },
        {
          action: 'setCustomField',
          name: 'eagleeye-action',
        },
        {
          action: 'setCustomField',
          name: 'eagleeye-errors',
          value: [
            JSON.stringify({
              type: 'EE_API_SETTLE_POTENTIAL_ISSUES',
              message:
                'EagleEye transaction settle was processed successfully, but there might be issues.',
            }),
          ],
        },
      ]);
    });

    it('should return an empty array if no saved basket exists', async () => {
      const ctOrder: Order = {
        id: 'order-id',
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {},
        },
      } as any;
      const hasSavedBasketSpy = jest
        .spyOn(basketStoreService, 'hasSavedBasket')
        .mockReturnValue(false);

      const result =
        await orderSettleService.settleTransactionFromOrder(ctOrder);

      expect(hasSavedBasketSpy).toHaveBeenCalledWith(ctOrder);
      expect(result).toEqual([]);
    });

    it('should handle error when deleting basket', async () => {
      const ctOrder: Order = {
        id: 'order-id',
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {},
        },
      } as any;
      const hasSavedBasketSpy = jest
        .spyOn(basketStoreService, 'hasSavedBasket')
        .mockReturnValue(true);
      const deleteBasketSpy = jest
        .spyOn(basketStoreService, 'delete')
        .mockRejectedValue(
          new EagleEyePluginException('BASKET_STORE_DELETE', 'Example'),
        );
      const getBasketSpy = jest
        .spyOn(basketStoreService, 'get')
        .mockResolvedValue({
          enrichedBasket: {
            contents: [],
          },
        });
      const loggerErrorSpy = jest
        .spyOn(orderSettleService['logger'], 'error')
        .mockImplementation();
      const walletSettleInvokeSpy = jest
        .spyOn(orderSettleService, 'walletSettleInvoke')
        .mockResolvedValueOnce({
          status: 200,
          data: {},
        });

      const result =
        await orderSettleService.settleTransactionFromOrder(ctOrder);

      expect(hasSavedBasketSpy).toHaveBeenCalledWith(ctOrder);
      expect(deleteBasketSpy).toHaveBeenCalledWith(ctOrder.cart.id);
      expect(getBasketSpy).toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(walletSettleInvokeSpy).toHaveBeenCalledWith(
        'settle',
        expect.anything(),
      );
      expect(result).toEqual([
        {
          action: 'setCustomField',
          name: 'eagleeye-settledStatus',
          value: 'SETTLED',
        },
      ]);
    });
  });

  describe('getSettleErrorActions', () => {
    it('should return update actions based on order and error', () => {
      const ctOrder: Order = {
        id: 'order-id',
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {},
        },
      } as any;

      const result = orderSettleService.getSettleErrorActions(ctOrder, {
        message: 'Error message',
      });

      expect(result).toEqual([
        {
          action: 'setCustomField',
          name: 'eagleeye-settledStatus',
          value: 'ERROR',
        },
        {
          action: 'setCustomField',
          name: 'eagleeye-errors',
          value: [
            '{"type":"EE_API_SETTLE_ERROR","message":"EagleEye transaction could not be settled.","context":"{\\"message\\":\\"Error message\\"}"}',
          ],
        },
      ]);
    });
  });
});
