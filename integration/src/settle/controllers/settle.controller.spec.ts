import { SettleController } from './settle.controller';
import { Mocked, TestBed } from '@suites/unit';
import { OrderSubscriptionService } from '../services/order-subscription/order-subscription.service';

describe('SettleController', () => {
  let appController: SettleController;
  let orderSubscriptionService: Mocked<OrderSubscriptionService>;

  beforeEach(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(SettleController).compile();
    appController = unit;
    orderSubscriptionService = unitRef.get<OrderSubscriptionService>(
      OrderSubscriptionService,
    );
  });

  describe('handleSubscriptionEvents', () => {
    it('should handle subscription events and return the result', async () => {
      const mockBody = { message: { data: 'e30=' } };
      const mockResponse = { status: jest.fn(), send: jest.fn() };
      const mockSubscriptionResult = {
        statusCode: 204,
      };

      jest
        .spyOn(orderSubscriptionService, 'handleOrderSubscriptionEvents')
        .mockResolvedValue(mockSubscriptionResult);

      const response = await appController.handleSubscriptionEvents(
        mockBody,
        mockResponse as any,
      );

      expect(
        orderSubscriptionService.handleOrderSubscriptionEvents,
      ).toHaveBeenCalledWith({});
      expect(mockResponse.status).toHaveBeenCalledWith(
        mockSubscriptionResult.statusCode,
      );
      expect(response).toEqual(undefined);
    });
  });
});
