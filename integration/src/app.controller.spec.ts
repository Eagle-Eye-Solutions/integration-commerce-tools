import { AppController } from './app.controller';
import { TestBed } from '@automock/jest';
import { CartExtensionService } from './services/cart-extension/cart-extension.service';
import { OrderSubscriptionService } from './services/order-subscription/order-subscription.service';

describe('AppController', () => {
  let appController: AppController;
  let cartExtensionService: jest.Mocked<CartExtensionService>;
  let orderSubscriptionService: jest.Mocked<OrderSubscriptionService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(AppController).compile();
    appController = unit;
    cartExtensionService =
      unitRef.get<CartExtensionService>(CartExtensionService);
    orderSubscriptionService = unitRef.get<OrderSubscriptionService>(
      OrderSubscriptionService,
    );
  });

  describe('Extension Request Handler', () => {
    it('should process POST requests received at root level', async () => {
      cartExtensionService.handleCartExtensionRequest.mockReturnValueOnce({
        actions: [],
      } as any);
      expect(await appController.handleExtensionRequest({})).toEqual({
        actions: [],
      });
    });
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
