import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Commercetools } from './providers/commercetools/commercetools';
import { EagleEye } from './providers/eagleeye/eagleeye';
import { ConfigModule } from '@nestjs/config';
import { configuration, validateConfiguration } from './config/configuration';

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
export class AppModule {}
