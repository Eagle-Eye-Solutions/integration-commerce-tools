import { OrderCreatedWithPaidStateProcessor } from './order-created-with-paid-state.processor';
import { ConfigService } from '@nestjs/config';
import { Commercetools } from '../../../../common/providers/commercetools/commercetools.provider';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { EagleEyePluginException } from '../../../../common/exceptions/eagle-eye-plugin.exception';
import { OrderSettleService } from '../../../../settle/services//order-settle/order-settle.service';

describe('OrderCreatedWithPaidStateProcessor', () => {
  let processor: OrderCreatedWithPaidStateProcessor;
  let message: MessageDeliveryPayload;
  let configService: ConfigService;
  let commercetools: Commercetools;
  let orderSettleService: OrderSettleService;

  beforeEach(() => {
    message = {
      resource: { id: 'some-id', typeId: 'order' },
    } as MessageDeliveryPayload;
    configService = {} as ConfigService;
    commercetools = {
      getOrderById: jest.fn(),
      updateOrderById: jest.fn(),
    } as unknown as Commercetools;
    orderSettleService = {
      settleTransactionFromOrder: jest.fn(),
    } as unknown as OrderSettleService;

    processor = new OrderCreatedWithPaidStateProcessor(
      configService,
      commercetools,
      orderSettleService,
    );
    processor.setMessage(message);
    processor.logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
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
          fields: {
            'eagleeye-settledStatus': '',
          },
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
      await processor.isValidState({} as any);
      const actions = await processor.generateActions();
      const result = await actions[0]();

      expect(result).toBe(undefined);
    });

    it('should throw error if action fails', async () => {
      processor.setMessage({
        resource: { id: 'some-id', typeId: 'order' },
        order: {
          id: 'order-id',
          custom: {
            fields: {},
          },
        },
      } as any);
      jest
        .spyOn(orderSettleService, 'settleTransactionFromOrder')
        .mockImplementationOnce(() => {
          throw new EagleEyePluginException('BASKET_STORE_DELETE', 'Example');
        });

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
    it('should return true if the order payment state is "Paid"', async () => {
      const result = await processor.isValidState({
        resource: { id: 'some-id', typeId: 'order' },
        order: {
          paymentState: 'Paid',
          custom: {
            fields: {
              'eagleeye-settledStatus': '',
            },
          },
        },
      } as any);

      expect(result).toBe(true);
    });

    it('should return false if the order payment state is not "Paid"', async () => {
      const result = await processor.isValidState({
        resource: { id: 'some-id', typeId: 'order' },
        order: {
          paymentState: 'OtherState',
          custom: {
            fields: {
              'eagleeye-settledStatus': '',
            },
          },
        },
      } as any);

      expect(result).toBe(false);
    });

    it('should get the order from commercetools to check paymentState if missing from the message', async () => {
      const ctOrder = {
        cart: {
          id: 'cart-id',
        },
        custom: {
          fields: {
            'eagleeye-settledStatus': '',
          },
        },
        paymentState: 'Paid',
      };
      jest
        .spyOn(commercetools, 'getOrderById')
        .mockResolvedValue(ctOrder as any);
      const result = await processor.isValidState({
        resource: { id: 'some-id', typeId: 'order' },
      } as any);

      expect(result).toBe(true);
    });

    it('should return false if getOrderById fails', async () => {
      jest.spyOn(commercetools, 'getOrderById').mockImplementationOnce(() => {
        throw Error;
      });
      const result = await processor.isValidState({
        resource: { id: 'some-id', typeId: 'order' },
      } as any);

      expect(result).toBe(false);
    });
  });

  describe('isValidMessageType', () => {
    it('should return true if the order message type is valid"', () => {
      const result = processor.isValidMessageType('OrderCreated');

      expect(result).toBe(true);
    });

    it('should return false if the order message type is invalid', () => {
      const result = processor.isValidMessageType('OrderFakeMessage');

      expect(result).toBe(false);
    });
  });
});
