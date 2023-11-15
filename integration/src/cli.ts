import { AppModule } from './app.module';
import { CommandFactory } from 'nest-commander';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  await CommandFactory.run(AppModule, new ConsoleLogger());
}

bootstrap();
