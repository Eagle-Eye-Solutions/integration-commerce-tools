import { Extension } from '@commercetools/platform-sdk';
import { Commercetools } from '../providers/commercetools/commercetools.provider';
import { ScriptConfigService } from '../config/configuration';
import { extensions } from '../common/commercetools';
import { Logger } from '@nestjs/common';

const logger = new Logger('Pre-Undeploy');
const configService = new ScriptConfigService();
const commercetools = new Commercetools(configService as any);

const run = async () => {
  await deleteExtensions();
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

run();
