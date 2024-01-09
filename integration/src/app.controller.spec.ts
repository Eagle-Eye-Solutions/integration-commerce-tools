import { AppController } from './app.controller';
import { TestBed } from '@automock/jest';
import { CartExtensionService } from './common/services/cart-extension/cart-extension.service';

describe('AppController', () => {
  let appController: AppController;
  let cartExtensionService: jest.Mocked<CartExtensionService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(AppController).compile();
    appController = unit;
    cartExtensionService =
      unitRef.get<CartExtensionService>(CartExtensionService);
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
});
