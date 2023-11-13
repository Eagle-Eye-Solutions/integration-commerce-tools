import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, ConfigService, Logger],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('Extension Request Handler', () => {
    it('should process POST requests received at root level', () => {
      expect(appController.handleExtensionRequest()).toEqual({ actions: [] });
    });
  });
});
