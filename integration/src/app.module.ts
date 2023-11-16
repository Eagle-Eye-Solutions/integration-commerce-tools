import { Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Commercetools } from './providers/commercetools/commercetools.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, validateConfiguration } from './config/configuration';
import { extensions } from './common/commercetools';
import { Extension } from '@commercetools/platform-sdk';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import { CustomObjectService } from './providers/commercetools/custom-object/custom-object.service';
import { CustomTypeService } from './providers/commercetools/custom-type/custom-type.service';
import { EagleEyeApiCircuitBreakerProvider } from './providers/circuit-breaker/circuit-breaker.provider';
import { CircuitBreakerSateServiceProvider } from './providers/circuit-breaker/interfaces/circuit-breaker-state.provider';
import { OrderCustomTypeCommand } from './scripts/order-custom-type.command';
import { HttpModule } from '@nestjs/axios';
import { PromotionsService } from './services/promotions/promotions.service';
import { EagleEyeApiClient } from './providers/eagleeye/eagleeye.provider';

let ngrok;
if (process.env.NODE_ENV === 'dev') {
  ngrok = require('ngrok');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validate: validateConfiguration,
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Commercetools,
    CircuitBreakerService,
    EagleEyeApiCircuitBreakerProvider,
    CircuitBreakerSateServiceProvider,
    CustomObjectService,
    CustomTypeService,
    Logger,
    OrderCustomTypeCommand,
    PromotionsService,
    EagleEyeApiClient,
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private extensionKey = this.configService.get('debug.extensionKey');

  constructor(
    private commercetoolsService: Commercetools,
    private configService: ConfigService,
    private logger: Logger,
  ) {}

  async onModuleInit(): Promise<any> {
    if (
      process.env.NODE_ENV === 'dev' &&
      this.configService.get('debug.ngrokEnabled')
    ) {
      const ngrokUrl = await ngrok.connect(
        parseInt(process.env.PORT, 10) || 8080,
      );
      this.logger.log(`Initialized ngrok at ${ngrokUrl}.`, AppModule.name);
      this.logger.log(
        'Creating debug commercetools extension...',
        AppModule.name,
      );
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
              triggers: extensions.map((ext) => ext.triggers).flat(),
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
          triggers: extensions.map((ext) => ext.triggers).flat(),
        });
        this.logger.log(
          'Debug commercetools extension created.',
          AppModule.name,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<any> {
    if (
      process.env.NODE_ENV === 'dev' &&
      this.configService.get('debug.ngrokEnabled')
    ) {
      this.logger.log(
        `Deleting debug commercetools extension...`,
        AppModule.name,
      );
      await this.commercetoolsService.deleteExtension(this.extensionKey, 1);
      this.logger.log(`Debug extension deleted.\n`, AppModule.name);
    }
  }
}
