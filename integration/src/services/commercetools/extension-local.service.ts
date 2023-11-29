import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { ConfigService } from '@nestjs/config';
import { Extension } from '@commercetools/platform-sdk';
import { extensions } from '../../common/commercetools';

let ngrok;
if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'test') {
  ngrok = require('ngrok');
}

@Injectable()
export class ExtensionLocalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExtensionLocalService.name);
  private extensionKey = this.configService.get('debug.extensionKey');
  private extensionTriggerCondition = this.configService.get(
    'debug.extensionTriggerCondition',
  );

  constructor(
    private commercetoolsService: Commercetools,
    private configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<any> {
    if (
      process.env.NODE_ENV === 'dev' &&
      this.configService.get('debug.ngrokEnabled')
    ) {
      const ngrokUrl = await ngrok.connect(
        parseInt(process.env.PORT, 10) || 8080,
      );
      this.logger.log(`Initialized ngrok at ${ngrokUrl}.`);
      this.logger.log('Creating debug commercetools extension...');
      const ctExtensions: Extension[] =
        await this.commercetoolsService.queryExtensions({
          queryArgs: {
            where: `key = "${this.extensionKey}"`,
          },
        });
      if (ctExtensions.length) {
        await this.commercetoolsService.updateExtension(this.extensionKey, {
          version: ctExtensions[0].version,
          actions: [
            {
              action: 'changeTriggers',
              triggers: extensions
                .map((ext) =>
                  ext.triggers.map((trigger) => {
                    return {
                      ...trigger,
                      condition: this.extensionTriggerCondition,
                    };
                  }),
                )
                .flat(),
            },
            {
              action: 'changeDestination',
              destination: {
                type: 'HTTP',
                url: ngrokUrl,
              },
            },
          ],
        });
      } else {
        await this.commercetoolsService.createExtension({
          key: this.extensionKey,
          destination: { type: 'HTTP', url: ngrokUrl },
          triggers: extensions
            .map((ext) =>
              ext.triggers.map((trigger) => {
                return {
                  ...trigger,
                  condition: this.extensionTriggerCondition,
                };
              }),
            )
            .flat(),
        });
        this.logger.log('Debug commercetools extension created.');
      }
    }
  }

  async onModuleDestroy(): Promise<any> {
    if (
      process.env.NODE_ENV === 'dev' &&
      this.configService.get('debug.ngrokEnabled')
    ) {
      this.logger.log(`Deleting debug commercetools extension...`);
      await this.commercetoolsService.deleteExtension(this.extensionKey, 1);
      this.logger.log(`Debug extension deleted.\n`);
    }
  }
}
