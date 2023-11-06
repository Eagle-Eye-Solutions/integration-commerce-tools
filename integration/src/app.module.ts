import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Commercetools } from './providers/commercetools/commercetools';
import { EagleEye } from './providers/eagleeye/eagleeye';
import { ConfigModule } from '@nestjs/config';
import { configuration, validateConfiguration } from './config/configuration';
import { connect } from 'ngrok';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validate: validateConfiguration,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, Commercetools, EagleEye],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private extensionKey = this.configService.get('debug.extensionKey');

  constructor(
    private commercetoolsService: Commercetools,
    private configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<any> {
    if (
      process.env.NODE_ENV === 'dev' &&
      this.configService.get('debug.ngrokEnabled')
    ) {
      const ngrokUrl = await connect(parseInt(process.env.PORT, 10) || 8080);
      console.log(`Initialized ngrok at ${ngrokUrl}.`);
      console.log('Creating debug commercetools extension...');
      await this.commercetoolsService.createExtension({
        key: this.extensionKey,
        destination: { type: 'HTTP', url: ngrokUrl },
        triggers: [{ resourceTypeId: 'cart', actions: ['Create', 'Update'] }],
      });
      console.log('Debug commercetools extension created.');
    }
  }

  async onModuleDestroy(): Promise<any> {
    if (
      process.env.NODE_ENV === 'dev' &&
      this.configService.get('debug.ngrokEnabled')
    ) {
      console.log(`Deleting debug commercetools extension...`);
      await this.commercetoolsService.deleteExtension(this.extensionKey);
      console.log(`Debug extension deleted.`);
    }
  }
}
