import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Commercetools } from './commercetools.provider';
import { MockLogger } from '../../../test/utils/mocks/MockLogger';
import { Logger } from '@nestjs/common';

jest.mock('@commercetools/platform-sdk', () => ({
  createApiBuilderFromCtpClient: jest.fn().mockReturnValue({
    withProjectKey: jest.fn().mockReturnValue(
      Object.fromEntries(
        ['extensions'].map((element) => {
          return [
            element,
            jest.fn().mockReturnValue({
              get: jest.fn().mockReturnValue({
                execute: jest.fn().mockResolvedValue({}),
              }),
              post: jest.fn().mockReturnValue({
                execute: jest.fn().mockResolvedValue({}),
              }),
              withKey: jest.fn().mockReturnValue({
                post: jest.fn().mockReturnValue({
                  execute: jest.fn().mockResolvedValue({}),
                }),
                delete: jest.fn().mockReturnValue({
                  execute: jest.fn().mockResolvedValue({}),
                }),
              }),
            }),
          ];
        }),
      ),
    ),
  }),
}));

describe('Commercetools', () => {
  let commercetools: Commercetools;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: Logger, useValue: new MockLogger() },
        Commercetools,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    commercetools = module.get<Commercetools>(Commercetools);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(commercetools).toBeDefined();
  });

  describe('getApiRoot', () => {
    it('should return the existing root if already set', () => {
      const root = jest.fn();
      commercetools['root'] = root as any;

      const result = commercetools.getApiRoot();

      expect(result).toBe(root);
    });

    it('should create a new root and return it if not set', () => {
      const projectKey = 'TEST_PROJECT_KEY';
      jest.spyOn(configService, 'get').mockReturnValue(projectKey);

      const root = commercetools.getApiRoot();

      expect(root).toBeDefined();
      expect(commercetools['root']).toBe(root);
    });
  });

  describe('queryExtensions', () => {
    it('should query extensions and return the results', async () => {
      const methodArgs = {};
      const responseBody = { body: { results: ['extension1', 'extension2'] } };

      jest
        .spyOn(commercetools.getApiRoot().extensions().get(), 'execute')
        .mockResolvedValue(responseBody as any);

      const extensions = await commercetools.queryExtensions(methodArgs);

      expect(extensions).toEqual(responseBody.body.results);
    });
  });

  describe('createExtension', () => {
    it('should create a new extension', async () => {
      const body = { key: 'my-extension-key' };

      jest
        .spyOn(
          commercetools
            .getApiRoot()
            .extensions()
            .post({ body } as any),
          'execute',
        )
        .mockResolvedValue({} as any);

      await commercetools.createExtension({ body } as any);

      expect(commercetools.getApiRoot().extensions().post).toHaveBeenCalledWith(
        { body },
      );
    });
  });

  describe('updateExtension', () => {
    it('should update an extension', async () => {
      const key = 'TEST_EXTENSION_KEY';
      const version = 1;
      const body = {
        version,
        actions: ['action1', 'action2'],
      };

      const extension = commercetools
        .getApiRoot()
        .extensions()
        .withKey({ key });

      jest
        .spyOn(extension.post({ body } as any), 'execute')
        .mockResolvedValue({} as any);

      await commercetools.createExtension(body as any);

      expect(commercetools.getApiRoot().extensions().post).toHaveBeenCalledWith(
        { body },
      );
    });
  });
});
