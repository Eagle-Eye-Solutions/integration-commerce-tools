import { AdjudicationController } from './adjudication.controller';
import { TestBed } from '@automock/jest';
import { CartExtensionService } from '../services/cart-extension/cart-extension.service';
import { BasketCleanupService } from '../services/basket-cleanup-service/basket-cleanup.service';

describe('AdjudicationController', () => {
  let adjudicationController: AdjudicationController;
  let cartExtensionService: jest.Mocked<CartExtensionService>;
  let basketCleanupService: jest.Mocked<BasketCleanupService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(AdjudicationController).compile();
    adjudicationController = unit;
    cartExtensionService =
      unitRef.get<CartExtensionService>(CartExtensionService);
    basketCleanupService =
      unitRef.get<BasketCleanupService>(BasketCleanupService);
  });

  describe('Extension Request Handler', () => {
    it('should process POST requests received at /cart-service', async () => {
      cartExtensionService.handleCartExtensionRequest.mockReturnValueOnce({
        actions: [],
      } as any);
      expect(await adjudicationController.handleExtensionRequest({})).toEqual({
        actions: [],
      });
    });
  });

  describe('Stored Basket Cleanup', () => {
    it('should process POST requests received at /jobs-stored-basket-cleanup', async () => {
      basketCleanupService.clearOldBaskets.mockResolvedValueOnce({
        results: { successful: [], failed: [] },
      });
      expect(await adjudicationController.handleStoredBaskedCleanup()).toEqual({
        results: { successful: [], failed: [] },
      });
    });
  });
});
