import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Commercetools } from '../commercetools.provider';
import { subscriptions } from '../../../constants/commercetools';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let commercetools: Commercetools;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: Commercetools,
          useValue: {
            getSubscriptionByKey: jest.fn(),
            createSubscription: jest.fn(),
            updateSubscription: jest.fn(),
            querySubscriptions: jest.fn(),
            deleteSubscription: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    commercetools = module.get<Commercetools>(Commercetools);
  });

  describe('createUpdateAllSubscriptions', () => {
    it('should create/update all subscriptions', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      const createUpdateSubscriptionSpy = jest
        .spyOn(service, 'createUpdateSubscription')
        .mockResolvedValueOnce([]);

      await service.createUpdateAllSubscriptions();

      expect(loggerSpy).toHaveBeenCalledTimes(subscriptions.length);
      expect(createUpdateSubscriptionSpy).toHaveBeenCalledTimes(
        subscriptions.length,
      );
    });
  });

  describe('createUpdateSubscription', () => {
    it('should create a new subscription if it does not exist', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      const createSubscriptionSpy = jest.spyOn(
        commercetools,
        'createSubscription',
      );
      (commercetools.getSubscriptionByKey as jest.Mock).mockRejectedValue({
        statusCode: 404,
      });

      const subscription = {
        key: 'testKey',
        resource: 'testResource',
        types: ['testType'],
        changes: ['testChange'],
      };

      await service.createUpdateSubscription(subscription);

      expect(loggerSpy).toHaveBeenCalledWith(
        `No subscription found with key "${subscription.key}", creating.`,
      );
      expect(createSubscriptionSpy).toHaveBeenCalledWith({
        key: subscription.key,
        destination: {
          type: 'GoogleCloudPubSub',
          topic: process.env.CONNECT_GCP_TOPIC_NAME,
          projectId: process.env.CONNECT_GCP_PROJECT_ID,
        },
        messages: [
          {
            resourceTypeId: subscription.resource,
            types: subscription.types,
          },
        ],
        changes: [
          {
            resourceTypeId: subscription.changes[0],
          },
        ],
      });
    });

    it('should update an existing subscription', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');
      const updateSubscriptionSpy = jest.spyOn(
        commercetools,
        'updateSubscription',
      );
      (commercetools.getSubscriptionByKey as jest.Mock).mockResolvedValue({
        key: 'testKey',
        version: 1,
      });

      const existingSubscription = {
        key: 'testKey',
        version: 1,
      };

      const subscription = {
        key: 'testKey',
        resource: 'testResource',
        types: ['testType'],
        changes: ['testChange'],
      };

      await service.createUpdateSubscription(subscription);

      expect(loggerSpy).toHaveBeenLastCalledWith({
        msg: 'Subscription with key "testKey" updated',
        type: ['testType'],
      });
      expect(updateSubscriptionSpy).toHaveBeenCalledWith(
        existingSubscription.key,
        {
          version: existingSubscription.version,
          actions: [
            {
              action: 'setMessages',
              messages: [
                {
                  resourceTypeId: subscription.resource,
                  types: subscription.types,
                },
              ],
            },
            {
              action: 'setChanges',
              changes: [
                {
                  resourceTypeId: subscription.changes[0],
                },
              ],
            },
            {
              action: 'changeDestination',
              destination: {
                type: 'GoogleCloudPubSub',
                topic: process.env.CONNECT_GCP_TOPIC_NAME,
                projectId: process.env.CONNECT_GCP_PROJECT_ID,
              },
            },
          ],
        },
      );
    });
  });

  describe('deleteAllSubscriptions', () => {
    it('should delete all existing subscriptions', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const querySubscriptionsSpy = jest.spyOn(
        commercetools,
        'querySubscriptions',
      );
      const deleteSubscriptionSpy = jest.spyOn(
        commercetools,
        'deleteSubscription',
      );

      const existingSubscriptions = subscriptions.map((subscription) => ({
        key: subscription.key,
        version: 1,
      }));

      (commercetools.querySubscriptions as jest.Mock).mockResolvedValue(
        existingSubscriptions,
      );

      await service.deleteAllSubscriptions();

      expect(querySubscriptionsSpy).toHaveBeenCalled();
      expect(deleteSubscriptionSpy).toHaveBeenCalledTimes(
        existingSubscriptions.length,
      );
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should log an error if deletion fails for any subscription', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      const querySubscriptionsSpy = jest.spyOn(
        commercetools,
        'querySubscriptions',
      );
      const deleteSubscriptionSpy = jest.spyOn(
        commercetools,
        'deleteSubscription',
      );

      const existingSubscriptions = subscriptions.map((subscription) => ({
        key: subscription.key,
        version: 1,
      }));

      (commercetools.querySubscriptions as jest.Mock).mockResolvedValue(
        existingSubscriptions,
      );
      (commercetools.deleteSubscription as jest.Mock).mockRejectedValue(
        new Error('Deletion failed'),
      );

      await service.deleteAllSubscriptions();

      expect(querySubscriptionsSpy).toHaveBeenCalled();
      expect(deleteSubscriptionSpy).toHaveBeenCalledTimes(
        existingSubscriptions.length,
      );
      expect(loggerSpy).toHaveBeenCalledTimes(existingSubscriptions.length);
    });
  });
});
