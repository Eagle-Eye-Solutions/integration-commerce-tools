import { Extension, Subscription } from '@commercetools/platform-sdk';
import { Commercetools } from '../providers/commercetools/commercetools.provider';
import { ScriptConfigService } from '../config/configuration';
import { extensions, subscriptions } from '../common/commercetools';
import { Logger } from '@nestjs/common';

const logger = new Logger('Pre-Undeploy');
const configService = new ScriptConfigService();
const commercetools = new Commercetools(configService as any);

const run = async () => {
  if (process.env.INTEGRATION_MODE === 'events') {
    await deleteSubscriptions();
  } else if (process.env.INTEGRATION_MODE === 'service') {
    await deleteExtensions();
  }
};

const deleteExtensions = async () => {
  const ctExtensions: Extension[] = await commercetools.queryExtensions({
    queryArgs: {
      where: `key = "${extensions.map((ext) => ext.key).join('" or key = "')}"`,
    },
  });

  extensions.forEach(async (ext) => {
    const existingExtension = ctExtensions.find((s) => s.key === ext.key);
    if (existingExtension) {
      try {
        await commercetools.deleteExtension(ext.key, existingExtension.version);
      } catch (error) {
        logger.error(
          `PreUndeploy: Failed to delete ${ext.key} extension: ${error.message}`,
          error,
        );
      }
    }
  });
};

const deleteSubscriptions = async () => {
  const ctSubscriptions: Subscription[] =
    await commercetools.querySubscriptions();

  subscriptions.forEach(async (sub) => {
    const existingSubscription = ctSubscriptions.find((s) => s.key === sub.key);
    if (existingSubscription) {
      try {
        await commercetools.deleteSubscription(
          sub.key,
          existingSubscription.version,
        );
      } catch (error) {
        logger.error(
          `PreUndeploy: Failed to delete ${sub.key} subscription: ${error.message}`,
          error,
        );
      }
    }
  });
};

run();
