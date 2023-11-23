import { Test, TestingModule } from '@nestjs/testing';
import { ExtensionLocalService } from './extension-local.service';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { MockLogger } from '../../../test/utils/mocks/MockLogger';

jest.mock('ngrok');

describe('ExtensionLocalService', () => {
  let service: ExtensionLocalService;
  let mockCommercetoolsService: Partial<Commercetools>;
  let mockConfigService: Partial<ConfigService>;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy

    mockCommercetoolsService = {
      queryExtensions: jest.fn(),
      updateExtension: jest.fn(),
      createExtension: jest.fn(),
      deleteExtension: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => key),
    };

    process.env.NODE_ENV = 'dev';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtensionLocalService,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: new MockLogger() },
        { provide: Commercetools, useValue: mockCommercetoolsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ExtensionLocalService>(ExtensionLocalService);
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to ngrok and create extension if NODE_ENV is dev and ngrok is enabled', async () => {
      process.env.NODE_ENV = 'dev';
      jest.requireMock('ngrok').connect = jest
        .fn()
        .mockResolvedValue('http://localhost:8080');
      mockConfigService.get = jest.fn().mockReturnValue(true);
      mockCommercetoolsService.queryExtensions = jest
        .fn()
        .mockResolvedValue([]);

      await service.onModuleInit();

      expect(mockCommercetoolsService.createExtension).toHaveBeenCalled();
    });

    it('should not connect to ngrok if NODE_ENV is not dev', async () => {
      process.env.NODE_ENV = 'prod';

      await service.onModuleInit();

      expect(jest.requireMock('ngrok').connect).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should delete extension if NODE_ENV is dev and ngrok is enabled', async () => {
      process.env.NODE_ENV = 'dev';
      mockConfigService.get = jest.fn().mockReturnValue(true);

      await service.onModuleDestroy();

      expect(mockCommercetoolsService.deleteExtension).toHaveBeenCalled();
    });

    it('should not delete extension if NODE_ENV is not dev', async () => {
      process.env.NODE_ENV = 'prod';

      await service.onModuleDestroy();

      expect(mockCommercetoolsService.deleteExtension).not.toHaveBeenCalled();
    });
  });
});
