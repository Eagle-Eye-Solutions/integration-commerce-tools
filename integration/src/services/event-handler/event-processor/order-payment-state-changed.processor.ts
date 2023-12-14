import { AbstractEventProcessor } from './abstract-event.processor';
import { OrderPaymentStateChangedMessage } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { PaymentState, Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { EagleEyeApiClient } from '../../../providers/eagleeye/eagleeye.provider';
import { CTCartToEEBasketMapper } from '../../../common/mappers/ctCartToEeBasket.mapper';
import { Commercetools } from '../../../providers/commercetools/commercetools.provider';
import { BasketStoreService } from '../../basket-store/basket-store.interface';
import { CircuitBreakerService } from '../../../providers/circuit-breaker/circuit-breaker.service';
import { OrderSettleService } from '../../order-settle/order-settle.service';
import { FIELD_EAGLEEYE_SETTLED_STATUS } from '../../../providers/commercetools/custom-type/custom-type-definitions';

export class OrderPaymentStateChangedProcessor extends AbstractEventProcessor {
  private readonly PROCESSOR_NAME = 'OrderPaymentStateChanged';
  public logger: Logger;

  constructor(
    message: MessageDeliveryPayload,
    configService: ConfigService,
    private eagleEyeClient: EagleEyeApiClient,
    private cartToBasketMapper: CTCartToEEBasketMapper,
    private commercetools: Commercetools,
    private basketStoreService: BasketStoreService,
    readonly circuitBreakerService: CircuitBreakerService,
    private orderSettleService: OrderSettleService,
  ) {
    super(message, configService);
  }

  isEventValid(): boolean {
    const orderPaymentStateChangedMessage = this
      .message as unknown as OrderPaymentStateChangedMessage;
    return (
      orderPaymentStateChangedMessage.resource.typeId === 'order' &&
      this.isValidMessageType(orderPaymentStateChangedMessage.type) &&
      this.isValidState(orderPaymentStateChangedMessage.paymentState) &&
      !this.isEventDisabled(this.PROCESSOR_NAME)
    );
  }

  async generateActions(): Promise<(() => any)[]> {
    const actions = [];
    actions.push(async () => {
      const ctOrder: Order = await this.commercetools.getOrderById(
        this.message.resource.id,
      );
      if (
        ctOrder.custom.fields &&
        ctOrder.custom.fields[FIELD_EAGLEEYE_SETTLED_STATUS] !== 'SETTLED'
      ) {
        const updateActions =
          await this.orderSettleService.settleTransactionFromOrder(ctOrder);
        await this.commercetools.updateOrderById(ctOrder.id, {
          version: ctOrder.version,
          actions: updateActions,
        });
      }
    });
    return actions;
  }

  public isValidState(orderPaymentState: PaymentState): boolean {
    return Boolean(orderPaymentState === 'Paid');
  }

  public isValidMessageType(type: string): boolean {
    return Boolean(type === 'OrderPaymentStateChanged');
  }
}
