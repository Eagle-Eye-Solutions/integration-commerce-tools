import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { Commercetools } from './common/providers/commercetools/commercetools.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  configuration,
  validateConfiguration,
} from './common/config/configuration';
import { CircuitBreakerService } from './common/providers/circuit-breaker/circuit-breaker.service';
import { CustomObjectService } from './common/providers/commercetools/custom-object/custom-object.service';
import { CustomTypeService } from './common/providers/commercetools/custom-type/custom-type.service';
import { SubscriptionService } from './common/providers/commercetools/subscription/subscription.service';
import { ExtensionService } from './common/providers/commercetools/extension/extension.service';
import { EagleEyeApiCircuitBreakerProvider } from './common/providers/circuit-breaker/circuit-breaker.provider';
import { CircuitBreakerSateServiceProvider } from './common/providers/circuit-breaker/interfaces/circuit-breaker-state.provider';
import { CustomTypeCommand } from './scripts/custom-type.command';
import { SubscriptionsCommand } from './scripts/subscriptions.command';
import { ExtensionsCommand } from './scripts/extensions.command';
import { HttpModule } from '@nestjs/axios';
import { EagleEyeApiClient } from './common/providers/eagleeye/eagleeye.provider';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './common/config/logger.config';
import { CTCartToEEBasketMapper } from './common/mappers/ctCartToEeBasket.mapper';
import { ExtensionLocalService } from './common/services/commercetools/extension-local.service';
import { BasketStoreServiceProvider } from './common/services/basket-store/basket-store.provider';
import { EventHandlerService } from './common/services/event-handler/event-handler.service';
import { OrderPaymentStateChangedProcessor } from './common/services/event-handler/event-processor/order-payment-state-changed.processor';
import { UnidentifiedCustomerMiddleware } from './common/middlewares/unidentified-customer/unidentified-customer.middleware';
import { OrderCreatedWithPaidStateProcessor } from './common/services/event-handler/event-processor/order-created-with-paid-state.processor';
import { OrderCreatedWithSettleActionProcessor } from './common/services/event-handler/event-processor/order-created-with-settle-action.processor';
import { OrderUpdatedWithSettleActionProcessor } from './common/services/event-handler/event-processor/order-updated-with-settle-action.processor';
import { ExtensionTypeMiddleware } from './common/middlewares/extension-type/extension-type.middleware';
import { CartTypeDefinition } from './common/providers/commercetools/custom-type/cart-type-definition';
import { LineItemTypeDefinition } from './common/providers/commercetools/custom-type/line-item-type-definition';
import { UnhandledExceptionsFilter } from './common/exceptions/unhandled-exception.filter';
import { CartExtensionService } from './common/services/cart-extension/cart-extension.service';
import { OrderSubscriptionService } from './common/services/order-subscription/order-subscription.service';
import { PromotionModule } from './promotion/promotion.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { SettleModule } from './settle/settle.module';

const providers = [
  CartExtensionService,
  OrderSubscriptionService,
  Commercetools,
  CircuitBreakerService,
  EagleEyeApiCircuitBreakerProvider,
  CircuitBreakerSateServiceProvider,
  CustomObjectService,
  CustomTypeService,
  SubscriptionService,
  ExtensionService,
  CustomTypeCommand,
  SubscriptionsCommand,
  ExtensionsCommand,
  EagleEyeApiClient,
  CTCartToEEBasketMapper,
  ExtensionLocalService,
  BasketStoreServiceProvider,
  EventHandlerService,
  UnhandledExceptionsFilter,
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
    PromotionModule,
    LoyaltyModule,
    SettleModule,
  ],
  controllers: [AppController],
  providers: providers,
  exports: providers,
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(ExtensionTypeMiddleware, UnidentifiedCustomerMiddleware)
      .forRoutes({ path: '/cart/service', method: RequestMethod.POST });
  }
}
