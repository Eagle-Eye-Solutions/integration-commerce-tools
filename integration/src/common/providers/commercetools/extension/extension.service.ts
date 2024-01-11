import { Injectable, Logger } from '@nestjs/common';
import { Commercetools } from '../commercetools.provider';
import { Extension } from '@commercetools/platform-sdk';
import { extensions } from '../../../constants/commercetools';

@Injectable()
export class ExtensionService {
  private readonly logger = new Logger(ExtensionService.name);
  private updatedExtensions: Extension[] = [];

  constructor(private readonly commercetools: Commercetools) {}

  async createUpdateAllExtensions(): Promise<any> {
    for (const extension of extensions) {
      this.logger.log(
        `Creating/Updating "${extension.triggers
          .map((t) => t.resourceTypeId)
          .join(',')}" extension with key: ${extension.key}`,
      );
      await this.createUpdateExtension(extension);
    }
  }

  async createUpdateExtension(extension) {
    let getExtension: Extension;
    try {
      getExtension = await this.commercetools.getExtensionByKey(extension.key);
    } catch (e) {
      if (e.statusCode) {
        this.logger.log(
          `No extension found with key "${extension.key}", creating.`,
        );
        let newExtension;
        try {
          newExtension = await this.commercetools.createExtension({
            key: extension.key,
            destination: {
              type: 'HTTP',
              url: process.env.CONNECT_SERVICE_URL,
            },
            triggers: extension.triggers,
          });

          this.logger.debug({
            message: `Extension with key "${extension.key}" created`,
            body: newExtension,
          });

          return newExtension;
        } catch (err) {
          const errorMsg = `Extension with key "${extension.key}" could not be created`;
          this.logger.error({
            msg: errorMsg,
            statusCode: err.statusCode,
            body: err.body,
          });
          throw new Error(errorMsg);
        }
      }
    }

    const existingExtension = getExtension;
    try {
      const updatedExtension = await this.commercetools.updateExtension(
        existingExtension.key,
        {
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
        },
      );
      this.updatedExtensions.push(updatedExtension);
      this.logger.log({
        msg: `Extension with key "${extension.key}" updated`,
        type: extension.triggers.map((t) => t.resourceTypeId).join(','),
      });
    } catch (err) {
      const errorMsg = `Extension with key "${extension.key}" could not be updated`;
      this.logger.error({
        msg: errorMsg,
        statusCode: err.statusCode,
        body: err.body,
      });
      throw new Error(errorMsg);
    }

    return this.updatedExtensions;
  }

  async deleteAllExtensions(): Promise<any> {
    const ctExtensions: Extension[] = await this.commercetools.queryExtensions({
      queryArgs: {
        where: `key = "${extensions
          .map((ext) => ext.key)
          .join('" or key = "')}"`,
      },
    });

    extensions.forEach(async (ext) => {
      const existingExtension = ctExtensions.find((e) => e.key === ext.key);
      if (existingExtension) {
        try {
          await this.commercetools.deleteExtension(
            ext.key,
            existingExtension.version,
          );
        } catch (error) {
          this.logger.error(
            `Failed to delete ${ext.key} extension: ${error.message}`,
          );
        }
      }
    });
  }
}
