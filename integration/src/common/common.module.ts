import { Module, Global } from '@nestjs/common';
import { Commercetools } from './providers/commercetools/commercetools.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, validateConfiguration } from './config/configuration';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import { CustomObjectService } from './providers/commercetools/custom-object/custom-object.service';
import { CustomTypeService } from './providers/commercetools/custom-type/custom-type.service';
import { EagleEyeApiCircuitBreakerProvider } from './providers/circuit-breaker/circuit-breaker.provider';
import { CircuitBreakerSateServiceProvider } from './providers/circuit-breaker/interfaces/circuit-breaker-state.provider';
import { CustomTypeCommand } from '../scripts/custom-type.command';
import { HttpModule } from '@nestjs/axios';
import { EagleEyeApiClient } from './providers/eagleeye/eagleeye.provider';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './config/logger.config';
import { BasketStoreServiceProvider } from './services/basket-store/basket-store.provider';
import { UnhandledExceptionsFilter } from './exceptions/unhandled-exception.filter';
import { CartTypeDefinition } from './providers/commercetools/custom-type/cart-type-definition';
import { LineItemTypeDefinition } from './providers/commercetools/custom-type/line-item-type-definition';

const providers = [
  Commercetools,
  CircuitBreakerService,
  EagleEyeApiCircuitBreakerProvider,
  CircuitBreakerSateServiceProvider,
  CustomObjectService,
  CustomTypeService,
  CustomTypeCommand,
  EagleEyeApiClient,
  BasketStoreServiceProvider,
  UnhandledExceptionsFilter,
  CartTypeDefinition,
  LineItemTypeDefinition,
  {
    provide: 'TypeDefinitions',
    useFactory: (cartTypeDefinition, lineItemTypeDefinition) => [
      cartTypeDefinition,
      lineItemTypeDefinition,
    ],
    inject: [CartTypeDefinition, LineItemTypeDefinition],
  },
];

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validate: validateConfiguration,
      cache: true,
    }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('eagleEye.apiClientTimeout'),
      }),
      inject: [ConfigService],
    }),
    WinstonModule.forRoot(loggerConfig),
  ],
  controllers: [],
  providers: providers,
  exports: providers,
})
export class CommonModule {}
