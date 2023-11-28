import { Extension } from '@commercetools/platform-sdk';
import { Commercetools } from '../providers/commercetools/commercetools.provider';
import { ScriptConfigService } from '../config/configuration';
import { extensions } from '../common/commercetools';
import { Logger } from '@nestjs/common';

const logger = new Logger('Post-Deploy');
const configService = new ScriptConfigService();
const commercetools = new Commercetools(configService as any);

const run = async () => {
  await configureExtensions();
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

run();
