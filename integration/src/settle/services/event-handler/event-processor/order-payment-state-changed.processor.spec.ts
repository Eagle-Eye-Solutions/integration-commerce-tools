import { OrderPaymentStateChangedProcessor } from './order-payment-state-changed.processor';
import { ConfigService } from '@nestjs/config';
import { Commercetools } from '../../../../common/providers/commercetools/commercetools.provider';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { OrderSettleService } from '../../../../settle/services/order-settle/order-settle.service';
import {
  FIELD_EAGLEEYE_ERRORS,
  FIELD_EAGLEEYE_SETTLED_STATUS,
} from '../../../../common/providers/commercetools/custom-type/cart-type-definition';

describe('OrderPaymentStateChangedProcessor', () => {
  let processor: OrderPaymentStateChangedProcessor;
  let message: MessageDeliveryPayload;
  let configService: ConfigService;
  let commercetools: Commercetools;
  let orderSettleService: OrderSettleService;

  beforeEach(() => {
    message = {
      resource: {
        id: 'order-id',
      },
    } as MessageDeliveryPayload;
    configService = { get: jest.fn() } as unknown as ConfigService;
    commercetools = {
      getOrderById: jest.fn(),
      updateOrderById: jest.fn(),
    } as unknown as Commercetools;
    orderSettleService = {
      settleTransactionFromOrder: jest.fn(),
      getSettleErrorActions: jest.fn(),
    } as unknown as OrderSettleService;

    processor = new OrderPaymentStateChangedProcessor(
      configService,
      commercetools,
      orderSettleService,
    );
    processor.setMessage(message);
    processor.logger = {
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;
  });

  describe('generateActions', () => {
    it('should generate actions correctly', async () => {
      const ctOrder = {
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {},
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

      const actions = await processor.generateActions();
      const result = await actions[0]();

      expect(result).toBe(undefined);
    });

    it('should throw error and set custom fields if action fails', async () => {
      const ctOrder = {
        id: 'order-id',
        version: 1,
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {},
        },
      };
      jest
        .spyOn(commercetools, 'getOrderById')
        .mockResolvedValue(ctOrder as any);

      const fakeError = { message: 'Example error' };
      jest
        .spyOn(orderSettleService, 'settleTransactionFromOrder')
        .mockImplementationOnce(() => {
          throw fakeError;
        });
      jest
        .spyOn(orderSettleService, 'getSettleErrorActions')
        .mockReturnValueOnce([
          {
            action: 'setCustomField',
            name: FIELD_EAGLEEYE_SETTLED_STATUS,
            value: 'ERROR',
          },
          {
            action: 'setCustomField',
            name: FIELD_EAGLEEYE_ERRORS,
            value: [
              JSON.stringify({
                type: 'EE_API_SETTLE_ERROR',
                message: 'EagleEye transaction could not be settled.',
                context: JSON.stringify(
                  fakeError,
                  Object.getOwnPropertyNames(fakeError),
                ),
              }),
            ],
          },
        ]);

      const updateOrderSpy = jest.spyOn(commercetools, 'updateOrderById');

      let error;
      try {
        const actions = await processor.generateActions();
        await actions[0]();
      } catch (err) {
        error = err;
      }

      expect(updateOrderSpy).toHaveBeenCalledWith('order-id', {
        actions: [
          {
            action: 'setCustomField',
            name: 'eagleeye-settledStatus',
            value: 'ERROR',
          },
          {
            action: 'setCustomField',
            name: 'eagleeye-errors',
            value: [
              '{"type":"EE_API_SETTLE_ERROR","message":"EagleEye transaction could not be settled.","context":"{\\"message\\":\\"Example error\\"}"}',
            ],
          },
        ],
        version: 1,
      });
      expect(error).toBeDefined();
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
    it('should return true if the order message type is valid"', () => {
      const result = processor.isValidMessageType('OrderPaymentStateChanged');

      expect(result).toBe(true);
    });

    it('should return false if the order message type is invalid', () => {
      const result = processor.isValidMessageType('OrderFakeMessage');

      expect(result).toBe(false);
    });
  });

  describe('isEventDisabled', () => {
    it('should return true if the event processing is disabled in the env variable CTP_DISABLED_EVENTS"', () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValue(['AnotherEvent', 'OrderPaymentStateChanged']);
      const result = processor.isEventDisabled();

      expect(result).toBe(true);
    });
    it('should return false if the event processing is not disabled in the env variable CTP_DISABLED_EVENTS"', () => {
      jest.spyOn(configService, 'get').mockReturnValue(['AnotherEvent']);
      const result = processor.isEventDisabled();

      expect(result).toBe(false);
    });
  });
});
