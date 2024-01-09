import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { Commercetools } from '../commercetools.provider';
import { extensions } from '../../../constants/commercetools';

describe('ExtensionService', () => {
  let service: ExtensionService;
  let commercetools: Commercetools;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtensionService,
        {
          provide: Commercetools,
          useValue: {
            getExtensionByKey: jest.fn(),
            createExtension: jest.fn(),
            updateExtension: jest.fn(),
            queryExtensions: jest.fn(),
            deleteExtension: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExtensionService>(ExtensionService);
    commercetools = module.get<Commercetools>(Commercetools);
  });

  describe('createUpdateAllExtensions', () => {
    it('should create/update all extensions', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      const createUpdateExtensionSpy = jest
        .spyOn(service, 'createUpdateExtension')
        .mockResolvedValueOnce([]);

      await service.createUpdateAllExtensions();

      expect(loggerSpy).toHaveBeenCalledTimes(extensions.length);
      expect(createUpdateExtensionSpy).toHaveBeenCalledTimes(extensions.length);
    });
  });

  describe('createUpdateExtension', () => {
    it('should create a new extension if it does not exist', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      const createExtensionSpy = jest.spyOn(commercetools, 'createExtension');
      (commercetools.getExtensionByKey as jest.Mock).mockRejectedValue({
        statusCode: 404,
      });

      const extension = {
        key: 'my-extension',
        triggers: [{ resourceTypeId: 'cart', actions: ['Create', 'Update'] }],
      };

      await service.createUpdateExtension(extension);

      expect(loggerSpy).toHaveBeenCalledWith(
        `No extension found with key "${extension.key}", creating.`,
      );
      expect(createExtensionSpy).toHaveBeenCalledWith({
        key: extension.key,
        destination: {
          type: 'HTTP',
          url: process.env.CONNECT_SERVICE_URL,
        },
        triggers: extension.triggers,
      });
    });

    it('should update an existing extension', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      const updateExtensionSpy = jest.spyOn(commercetools, 'updateExtension');
      (commercetools.getExtensionByKey as jest.Mock).mockResolvedValue({
        key: 'testKey',
        version: 1,
      });

      const existingExtension = {
        key: 'testKey',
        version: 1,
      };

      const extension = {
        key: 'my-extension',
        triggers: [{ resourceTypeId: 'cart', actions: ['Create', 'Update'] }],
      };

      await service.createUpdateExtension(extension);

      expect(loggerSpy).toHaveBeenLastCalledWith({
        msg: 'Extension with key "my-extension" updated',
        type: 'cart',
      });
      expect(updateExtensionSpy).toHaveBeenCalledWith(existingExtension.key, {
        version: existingExtension.version,
        actions: [
          {
            action: 'changeTriggers',
            triggers: extension.triggers,
          },
          {
            action: 'changeDestination',
            destination: {
              type: 'HTTP',
              url: process.env.CONNECT_SERVICE_URL,
            },
          },
        ],
      });
    });
  });

  describe('deleteAllExtensions', () => {
    it('should delete all existing extensions', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const queryExtensionsSpy = jest.spyOn(commercetools, 'queryExtensions');
      const deleteExtensionSpy = jest.spyOn(commercetools, 'deleteExtension');

      const existingExtensions = extensions.map((extension) => ({
        key: extension.key,
        version: 1,
      }));

      (commercetools.queryExtensions as jest.Mock).mockResolvedValue(
        existingExtensions,
      );

      await service.deleteAllExtensions();

      expect(queryExtensionsSpy).toHaveBeenCalled();
      expect(deleteExtensionSpy).toHaveBeenCalledTimes(
        existingExtensions.length,
      );
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should log an error if deletion fails for any extension', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const queryExtensionsSpy = jest.spyOn(commercetools, 'queryExtensions');
      const deleteExtensionSpy = jest.spyOn(commercetools, 'deleteExtension');

      const existingExtensions = extensions.map((extension) => ({
        key: extension.key,
        version: 1,
      }));

      (commercetools.queryExtensions as jest.Mock).mockResolvedValue(
        existingExtensions,
      );
      (commercetools.deleteExtension as jest.Mock).mockRejectedValue(
        new Error('Deletion failed'),
      );

      await service.deleteAllExtensions();

      expect(queryExtensionsSpy).toHaveBeenCalled();
      expect(deleteExtensionSpy).toHaveBeenCalledTimes(
        existingExtensions.length,
      );
      expect(loggerSpy).toHaveBeenCalledTimes(existingExtensions.length);
    });
  });
});
