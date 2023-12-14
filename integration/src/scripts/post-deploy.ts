import { Extension, Subscription } from '@commercetools/platform-sdk';
import { Commercetools } from '../providers/commercetools/commercetools.provider';
import { ScriptConfigService } from '../config/configuration';
import { extensions, subscriptions } from '../common/commercetools';
import { Logger } from '@nestjs/common';

const logger = new Logger('Post-Deploy');
const configService = new ScriptConfigService();
const commercetools = new Commercetools(configService as any);

const run = async () => {
  if (process.env.INTEGRATION_MODE === 'events') {
    await configureSubscriptions();
  } else if (process.env.INTEGRATION_MODE === 'service') {
    await configureExtensions();
  }
};

const configureExtensions = async () => {
  const ctExtensions: Extension[] = await commercetools.queryExtensions({
    queryArgs: {
      where: `key = "${extensions.map((ext) => ext.key).join('" or key = "')}"`,
    },
  });

  extensions.forEach(async (ext) => {
    const existingExtension = ctExtensions.find((s) => s.key === ext.key);
    try {
      if (existingExtension) {
        await commercetools.updateExtension(ext.key, {
          version: existingExtension.version,
          actions: [
            {
              action: 'changeTriggers',
              triggers: ext.triggers,
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
      } else {
        await commercetools.createExtension({
          key: ext.key,
          destination: {
            type: 'HTTP',
            url: process.env.CONNECT_SERVICE_URL,
          },
          triggers: ext.triggers,
        });
      }
    } catch (error) {
      logger.error(
        `PostDeploy: Failed to ${existingExtension ? 'update' : 'create'} ${
          ext.key
        } extension: ${error.message}`,
        error,
      );
    }
  });
};

const configureSubscriptions = async () => {
  const ctSubscriptions: Subscription[] =
    await commercetools.querySubscriptions();

  subscriptions.forEach(async (sub) => {
    const existingSubscription = ctSubscriptions.find((s) => s.key === sub.key);
    try {
      if (existingSubscription) {
        await commercetools.updateSubscription(sub.key, {
          version: existingSubscription.version,
          actions: [
            {
              action: 'setMessages',
              messages: [
                {
                  resourceTypeId: sub.resource,
                  types: sub.types,
                },
              ],
            },
            {
              action: 'setChanges',
              changes: sub.changes.map((c) => {
                return {
                  resourceTypeId: c,
                };
              }),
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
        });
      } else {
        await commercetools.createSubscription({
          key: sub.key,
          destination: {
            type: 'GoogleCloudPubSub',
            topic: process.env.CONNECT_GCP_TOPIC_NAME,
            projectId: process.env.CONNECT_GCP_PROJECT_ID,
          },
          messages: [
            {
              resourceTypeId: sub.resource,
              types: sub.types,
            },
          ],
          changes: sub.changes.map((c) => {
            return {
              resourceTypeId: c,
            };
          }),
        });
      }
    } catch (error) {
      logger.error(
        `PostDeploy: Failed to ${existingSubscription ? 'update' : 'create'} ${
          sub.key
        } subscription: ${error.message}`,
        error,
      );
    }
  });
};

run();
