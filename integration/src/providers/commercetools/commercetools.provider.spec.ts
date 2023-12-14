import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Commercetools } from './commercetools.provider';

jest.mock('@commercetools/platform-sdk', () => ({
  createApiBuilderFromCtpClient: jest.fn().mockReturnValue({
    withProjectKey: jest.fn().mockReturnValue(
      Object.fromEntries(
        ['extensions', 'subscriptions', 'shippingMethods', 'orders'].map(
          (element) => {
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
                  get: jest.fn().mockReturnValue({
                    execute: jest.fn().mockResolvedValue({}),
                  }),
                }),
                withId: jest.fn().mockReturnValue({
                  post: jest.fn().mockReturnValue({
                    execute: jest.fn().mockResolvedValue({}),
                  }),
                  delete: jest.fn().mockReturnValue({
                    execute: jest.fn().mockResolvedValue({}),
                  }),
                  get: jest.fn().mockReturnValue({
                    execute: jest.fn().mockResolvedValue({}),
                  }),
                }),
              }),
            ];
          },
        ),
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

      await commercetools.updateExtension(key, body as any);

      expect(
        commercetools.getApiRoot().extensions().withKey({ key: key }).post,
      ).toHaveBeenCalledWith({ body });
    });
  });

  describe('deleteExtension', () => {
    it('should update an extension', async () => {
      const key = 'TEST_EXTENSION_KEY';

      const extension = commercetools
        .getApiRoot()
        .extensions()
        .withKey({ key });

      jest
        .spyOn(extension.delete({ queryArgs: { version: 5 } }), 'execute')
        .mockResolvedValue({} as any);

      await commercetools.deleteExtension(key, 5);

      expect(
        commercetools.getApiRoot().extensions().withKey({ key: key }).delete,
      ).toHaveBeenCalledWith({ queryArgs: { version: 5 } });
    });
  });

  describe('querySubscriptions', () => {
    it('should query subscriptions and return the results', async () => {
      const methodArgs = {};
      const responseBody = {
        body: { results: ['subscription1', 'subscription2'] },
      };

      jest
        .spyOn(commercetools.getApiRoot().subscriptions().get(), 'execute')
        .mockResolvedValue(responseBody as any);

      const subscriptions = await commercetools.querySubscriptions(methodArgs);

      expect(subscriptions).toEqual(responseBody.body.results);
    });

    it('should query subscriptions without methodArgs', async () => {
      const responseBody = {
        body: { results: ['subscription1', 'subscription2'] },
      };

      jest
        .spyOn(commercetools.getApiRoot().subscriptions().get(), 'execute')
        .mockResolvedValue(responseBody as any);

      const subscriptions = await commercetools.querySubscriptions();

      expect(subscriptions).toEqual(responseBody.body.results);
    });
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const body = { key: 'my-subscription-key' };

      jest
        .spyOn(
          commercetools
            .getApiRoot()
            .subscriptions()
            .post({ body } as any),
          'execute',
        )
        .mockResolvedValue({} as any);

      await commercetools.createSubscription({ body } as any);

      expect(
        commercetools.getApiRoot().subscriptions().post,
      ).toHaveBeenCalledWith({ body });
    });
  });

  describe('updateSubscription', () => {
    it('should update an subscription', async () => {
      const key = 'TEST_SUBSCRIPTION_KEY';
      const version = 1;
      const body = {
        version,
        actions: ['action1', 'action2'],
      };

      const subscription = commercetools
        .getApiRoot()
        .subscriptions()
        .withKey({ key });

      jest
        .spyOn(subscription.post({ body } as any), 'execute')
        .mockResolvedValue({} as any);

      await commercetools.updateSubscription(key, body as any);

      expect(
        commercetools.getApiRoot().subscriptions().withKey({ key: key }).post,
      ).toHaveBeenCalledWith({ body });
    });
  });

  describe('deleteSubscription', () => {
    it('should update an subscription', async () => {
      const key = 'TEST_SUBSCRIPTION_KEY';
      const subscription = commercetools
        .getApiRoot()
        .subscriptions()
        .withKey({ key });

      jest
        .spyOn(subscription.delete({ queryArgs: { version: 5 } }), 'execute')
        .mockResolvedValue({} as any);

      await commercetools.deleteSubscription(key, 5);

      expect(
        commercetools.getApiRoot().subscriptions().withKey({ key: key }).delete,
      ).toHaveBeenCalledWith({ queryArgs: { version: 5 } });
    });
  });

  describe('getShippingMethods', () => {
    it('should query shipping methods and return the results', async () => {
      const methodArgs = {};
      const responseBody = {
        body: { results: ['shipping_method1', 'shipping_method2'] },
      };

      jest
        .spyOn(commercetools.getApiRoot().shippingMethods().get(), 'execute')
        .mockResolvedValue(responseBody as any);

      const shippingMethods =
        await commercetools.getShippingMethods(methodArgs);

      expect(shippingMethods).toEqual(responseBody.body.results);
    });
  });

  describe('getOrderById', () => {
    it('should get an order by its id', async () => {
      const id = 'ORDER_ID';
      const order = commercetools.getApiRoot().orders().withId({ ID: id });

      jest.spyOn(order.get(), 'execute').mockResolvedValue({
        id,
      } as any);

      await commercetools.getOrderById(id);

      expect(
        commercetools.getApiRoot().orders().withId({ ID: id }).get,
      ).toHaveBeenCalled();
    });
  });

  describe('updateOrderById', () => {
    it('should update an order', async () => {
      const id = 'TEST_ORDER_ID';
      const version = 1;
      const body = {
        version,
        actions: ['action1', 'action2'],
      };

      const order = commercetools.getApiRoot().orders().withId({ ID: id });

      jest
        .spyOn(order.post({ body } as any), 'execute')
        .mockResolvedValue({} as any);

      await commercetools.updateOrderById(id, body as any);

      expect(
        commercetools.getApiRoot().orders().withId({ ID: id }).post,
      ).toHaveBeenCalledWith({ body });
    });
  });
});
