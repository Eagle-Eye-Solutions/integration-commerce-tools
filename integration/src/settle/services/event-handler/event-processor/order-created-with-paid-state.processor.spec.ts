import { OrderCreatedWithPaidStateProcessor } from './order-created-with-paid-state.processor';
import { ConfigService } from '@nestjs/config';
import { Commercetools } from '../../../../common/providers/commercetools/commercetools.provider';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { OrderSettleService } from '../../../../settle/services//order-settle/order-settle.service';
import {
  FIELD_EAGLEEYE_ERRORS,
  FIELD_EAGLEEYE_SETTLED_STATUS,
} from '../../../../common/providers/commercetools/custom-type/cart-type-definition';

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
      getSettleErrorActions: jest.fn(),
      canBeSettled: jest.fn(),
      getGenericSettleActions: jest.fn(),
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
        id: 'order-id',
        version: 1,
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
      jest
        .spyOn(orderSettleService, 'getGenericSettleActions')
        .mockResolvedValueOnce([() => {}]);
      await processor.isValidState();
      const actions = await processor.generateActions();
      const result = await actions[0]();

      expect(result).toBe(undefined);
    });

    it('should throw error and set custom fields if action fails', async () => {
      processor.setMessage({
        resource: { id: 'some-id', typeId: 'order' },
        order: {
          id: 'order-id',
          version: 1,
          custom: {
            fields: {},
          },
        },
      } as any);

      const ctOrder = {
        id: 'order-id',
        version: 1,
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

      let error;
      try {
        await processor.isValidState();
        const actions = await processor.generateActions();
        await actions[0]();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('isValidState', () => {
    it('should return true if the order payment state is "Paid"', async () => {
      const ctOrder = {
        id: 'order-id',
        version: 1,
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
      jest.spyOn(orderSettleService, 'canBeSettled').mockReturnValueOnce(true);
      const result = await processor.isValidState();

      expect(result).toBe(true);
    });

    it('should return false if the order payment state is not "Paid"', async () => {
      jest.spyOn(orderSettleService, 'canBeSettled').mockReturnValueOnce(false);
      const result = await processor.isValidState();

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
      jest.spyOn(orderSettleService, 'canBeSettled').mockReturnValueOnce(true);
      const result = await processor.isValidState();

      expect(result).toBe(true);
    });

    it('should return false if getOrderById fails', async () => {
      jest.spyOn(commercetools, 'getOrderById').mockImplementationOnce(() => {
        throw Error;
      });
      const result = await processor.isValidState();

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
