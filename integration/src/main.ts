import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { UnhandledExceptionsFilter } from './common/exceptions/unhandled-exception.filter';
import { DEFAULT_PORT } from './common/constants/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalFilters(app.get(UnhandledExceptionsFilter));
  await app.listen(parseInt(process.env.PORT, 10) || DEFAULT_PORT);
}

bootstrap();
