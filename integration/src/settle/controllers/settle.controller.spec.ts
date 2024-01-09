import { SettleController } from './settle.controller';
import { TestBed } from '@automock/jest';
import { OrderSubscriptionService } from '../services/order-subscription/order-subscription.service';

describe('SettleController', () => {
  let appController: SettleController;
  let orderSubscriptionService: jest.Mocked<OrderSubscriptionService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(SettleController).compile();
    appController = unit;
    orderSubscriptionService = unitRef.get<OrderSubscriptionService>(
      OrderSubscriptionService,
    );
  });

  describe('Subscription Event Handler', () => {
    it('should process POST requests received at root level', async () => {
      orderSubscriptionService.handleOrderSubscriptionEvents.mockReturnValueOnce(
        Promise.resolve({ status: '200' }),
      );
      expect(
        await appController.handleSubscriptionEvents({
          message: {
            data: 'e30=',
          },
        }),
      ).toEqual({
        status: '200',
      });
    });
  });
});
