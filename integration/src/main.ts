import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DEFAULT_PORT } from './common/constants/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  await app.listen(parseInt(process.env.PORT, 10) || DEFAULT_PORT);
}

bootstrap();
