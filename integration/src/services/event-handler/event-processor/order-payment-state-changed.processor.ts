import { AbstractEventProcessor } from './abstract-event.processor';
import { OrderPaymentStateChangedMessage } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { PaymentState, Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger, Injectable } from '@nestjs/common';
import { Commercetools } from '../../../providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../order-settle/order-settle.service';
import { FIELD_EAGLEEYE_SETTLED_STATUS } from '../../../providers/commercetools/custom-type/custom-type-definitions';

@Injectable()
export class OrderPaymentStateChangedProcessor extends AbstractEventProcessor {
  private readonly PROCESSOR_NAME = 'OrderPaymentStateChanged';
  public logger: Logger;

  constructor(
    configService: ConfigService,
    private commercetools: Commercetools,
    private orderSettleService: OrderSettleService,
  ) {
    super(configService);
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
