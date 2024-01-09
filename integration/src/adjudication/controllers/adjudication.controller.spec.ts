import { AdjudicationController } from './adjudication.controller';
import { TestBed } from '@automock/jest';
import { CartExtensionService } from '../services/cart-extension/cart-extension.service';

describe('AdjudicationController', () => {
  let adjudicationController: AdjudicationController;
  let cartExtensionService: jest.Mocked<CartExtensionService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(AdjudicationController).compile();
    adjudicationController = unit;
    cartExtensionService =
      unitRef.get<CartExtensionService>(CartExtensionService);
  });

  describe('Extension Request Handler', () => {
    it('should process POST requests received at root level', async () => {
      cartExtensionService.handleCartExtensionRequest.mockReturnValueOnce({
        actions: [],
      } as any);
      expect(await adjudicationController.handleExtensionRequest({})).toEqual({
        actions: [],
      });
    });
  });
});
