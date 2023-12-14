import { OrderPaymentStateChangedProcessor } from './order-payment-state-changed.processor';
import { ConfigService } from '@nestjs/config';
import { EagleEyeApiClient } from '../../../providers/eagleeye/eagleeye.provider';
import { CTCartToEEBasketMapper } from '../../../common/mappers/ctCartToEeBasket.mapper';
import { Commercetools } from '../../../providers/commercetools/commercetools.provider';
import { BasketStoreService } from '../../basket-store/basket-store.interface';
import { CircuitBreakerService } from '../../../providers/circuit-breaker/circuit-breaker.service';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { EagleEyePluginException } from '../../../common/exceptions/eagle-eye-plugin.exception';
import { OrderSettleService } from '../../order-settle/order-settle.service';

describe('OrderPaymentStateChangedProcessor', () => {
  let processor: OrderPaymentStateChangedProcessor;
  let message: MessageDeliveryPayload;
  let configService: ConfigService;
  let eagleEyeClient: EagleEyeApiClient;
  let cartToBasketMapper: CTCartToEEBasketMapper;
  let commercetools: Commercetools;
  let basketStoreService: BasketStoreService;
  let circuitBreakerService: CircuitBreakerService;
  let orderSettleService: OrderSettleService;

  beforeEach(() => {
    message = {
      resource: {
        id: 'order-id',
      },
    } as MessageDeliveryPayload;
    configService = {} as ConfigService;
    eagleEyeClient = {} as EagleEyeApiClient;
    cartToBasketMapper = {
      mapOrderToWalletSettlePayload: jest.fn(),
    } as unknown as CTCartToEEBasketMapper;
    commercetools = {
      getOrderById: jest.fn(),
      updateOrderById: jest.fn(),
    } as unknown as Commercetools;
    basketStoreService = {
      save: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      isEnabled: jest.fn(),
      hasSavedBasket: jest.fn(),
    } as BasketStoreService;
    circuitBreakerService = {
      fire: jest.fn(),
    } as unknown as CircuitBreakerService;
    orderSettleService = {
      settleTransactionFromOrder: jest.fn(),
    } as unknown as OrderSettleService;

    processor = new OrderPaymentStateChangedProcessor(
      message,
      configService,
      eagleEyeClient,
      cartToBasketMapper,
      commercetools,
      basketStoreService,
      circuitBreakerService,
      orderSettleService,
    );
    processor.logger = { log: jest.fn(), error: jest.fn() } as any;
  });

  describe('generateActions', () => {
    it('should generate actions correctly', async () => {
      const ctOrder = {
        cart: {
          id: 'cart-id',
        },
      };
      jest
        .spyOn(commercetools, 'getOrderById')
        .mockResolvedValue(ctOrder as any);
      jest
        .spyOn(orderSettleService, 'settleTransactionFromOrder')
        .mockResolvedValue([
          {
            action: 'setCustomField',
            name: 'settledStatus',
            value: 'settled',
          },
        ]);
      jest.spyOn(basketStoreService, 'hasSavedBasket').mockReturnValue(true);

      const actions = await processor.generateActions();
      const result = await actions[0]();

      expect(result).toBe(undefined);
    });

    it('should throw error if action fails', async () => {
      const ctOrder = {
        cart: {
          id: 'cart-id',
        },
      };
      jest
        .spyOn(commercetools, 'getOrderById')
        .mockResolvedValue(ctOrder as any);
      jest
        .spyOn(orderSettleService, 'settleTransactionFromOrder')
        .mockImplementationOnce(() => {
          throw new EagleEyePluginException('BASKET_STORE_DELETE', 'Example');
        });
      jest.spyOn(basketStoreService, 'hasSavedBasket').mockReturnValue(true);

      let error;
      try {
        const actions = await processor.generateActions();
        await actions[0]();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(EagleEyePluginException);
    });
  });

  describe('isValidState', () => {
    it('should return true if the order payment state is "Paid"', () => {
      const result = processor.isValidState('Paid');

      expect(result).toBe(true);
    });

    it('should return false if the order payment state is not "Paid"', () => {
      const result = processor.isValidState('OtherState');

      expect(result).toBe(false);
    });
  });

  describe('isValidMessageType', () => {
    it('should return true if the order payment state is valid"', () => {
      const result = processor.isValidMessageType('OrderPaymentStateChanged');

      expect(result).toBe(true);
    });

    it('should return false if the order message type state is invalid', () => {
      const result = processor.isValidMessageType('OrderFakeMessage');

      expect(result).toBe(false);
    });
  });
});
