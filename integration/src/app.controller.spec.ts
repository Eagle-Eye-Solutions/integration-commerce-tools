import { AppController } from './app.controller';
import { TestBed } from '@automock/jest';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(AppController).compile();
    appController = unit;
    appService = unitRef.get<AppService>(AppService);
  });

  describe('Extension Request Handler', () => {
    it('should process POST requests received at root level', async () => {
      appService.handleExtensionRequest.mockReturnValueOnce({
        actions: [],
      } as any);
      expect(await appController.handleExtensionRequest({})).toEqual({
        actions: [],
      });
    });
  });
});
