import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Commercetools } from './providers/commercetools/commercetools.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, validateConfiguration } from './config/configuration';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import { CustomObjectService } from './providers/commercetools/custom-object/custom-object.service';
import { CustomTypeService } from './providers/commercetools/custom-type/custom-type.service';
import { EagleEyeApiCircuitBreakerProvider } from './providers/circuit-breaker/circuit-breaker.provider';
import { CircuitBreakerSateServiceProvider } from './providers/circuit-breaker/interfaces/circuit-breaker-state.provider';
import { OrderCustomTypeCommand } from './scripts/order-custom-type.command';
import { HttpModule } from '@nestjs/axios';
import { PromotionService } from './services/promotions/promotions.service';
import { EagleEyeApiClient } from './providers/eagleeye/eagleeye.provider';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './config/logger.config';
import { CTCartToEEBasketMapper } from './common/mappers/ctCartToEeBasket.mapper';
import { ExtensionLocalService } from './services/commercetools/extension-local.service';
import { BasketStoreServiceProvider } from './services/basket-store/basket-store.provider';
import { EventHandlerService } from './services/event-handler/event-handler.service';
import { OrderSettleService } from './services/order-settle/order-settle.service';
import { OrderPaymentStateChangedProcessor } from './services/event-handler/event-processor/order-payment-state-changed.processor';
import { UnidentifiedCustomerMiddleware } from './common/middlewares/unidentified-customer/unidentified-customer.middleware';
import { OrderCreatedWithPaidStateProcessor } from './services/event-handler/event-processor/order-created-with-paid-state.processor';
import { OrderCreatedWithSettleActionProcessor } from './services/event-handler/event-processor/order-created-with-settle-action.processor';
import { OrderUpdatedWithSettleActionProcessor } from './services/event-handler/event-processor/order-updated-with-settle-action.processor';
import { ExtensionTypeMiddleware } from './common/middlewares/extension-type/extension-type.middleware';

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
  controllers: [AppController],
  providers: [
    AppService,
    Commercetools,
    CircuitBreakerService,
    EagleEyeApiCircuitBreakerProvider,
    CircuitBreakerSateServiceProvider,
    CustomObjectService,
    CustomTypeService,
    OrderCustomTypeCommand,
    PromotionService,
    EagleEyeApiClient,
    CTCartToEEBasketMapper,
    ExtensionLocalService,
    BasketStoreServiceProvider,
    EventHandlerService,
    OrderSettleService,
    OrderPaymentStateChangedProcessor,
    OrderCreatedWithPaidStateProcessor,
    OrderCreatedWithSettleActionProcessor,
    OrderUpdatedWithSettleActionProcessor,
    {
      provide: 'EventProcessors',
      useFactory: (
        orderPaymentStateChanged,
        orderUpdatedWithSettleAction,
        orderCreatedWithSettleAction,
        orderCreatedWithPaidState,
      ) => [
        orderPaymentStateChanged,
        orderUpdatedWithSettleAction,
        orderCreatedWithSettleAction,
        orderCreatedWithPaidState,
      ],
      inject: [
        OrderPaymentStateChangedProcessor,
        OrderUpdatedWithSettleActionProcessor,
        OrderCreatedWithSettleActionProcessor,
        OrderCreatedWithPaidStateProcessor,
      ],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(ExtensionTypeMiddleware, UnidentifiedCustomerMiddleware)
      .forRoutes({ path: 'service', method: RequestMethod.POST });
  }
}
