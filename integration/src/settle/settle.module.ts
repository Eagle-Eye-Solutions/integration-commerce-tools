import { Module } from '@nestjs/common';
import { OrderSettleService } from './services/order-settle/order-settle.service';
import { SettleController } from './controllers/settle.controller';
import { SubscriptionsCommand } from '../scripts/subscriptions.command';
import { SubscriptionService } from './services/subscription/subscription.service';
import { EventHandlerService } from './services/event-handler/event-handler.service';
import { OrderPaymentStateChangedProcessor } from './services/event-handler/event-processor/order-payment-state-changed.processor';
import { OrderCreatedWithPaidStateProcessor } from './services/event-handler/event-processor/order-created-with-paid-state.processor';
import { OrderCreatedWithSettleActionProcessor } from './services/event-handler/event-processor/order-created-with-settle-action.processor';
import { OrderUpdatedWithSettleActionProcessor } from './services/event-handler/event-processor/order-updated-with-settle-action.processor';
import { OrderSubscriptionService } from './services/order-subscription/order-subscription.service';
import { SettleMapper } from './mappers/settle.mapper';

@Module({
  imports: [],
  controllers: [SettleController],
  providers: [
    OrderSettleService,
    SettleMapper,
    EventHandlerService,
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
    OrderSubscriptionService,
    SubscriptionsCommand,
    SubscriptionService,
  ],
  exports: [],
})
export class SettleModule {}
