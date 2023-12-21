import { AbstractEventProcessor } from './abstract-event.processor';
import { OrderPaymentStateChangedMessage } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { PaymentState, Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger, Injectable } from '@nestjs/common';
import { Commercetools } from '../../../providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../order-settle/order-settle.service';
import { FIELD_EAGLEEYE_SETTLED_STATUS } from '../../../providers/commercetools/custom-type/cart-type-definition';

@Injectable()
export class OrderPaymentStateChangedProcessor extends AbstractEventProcessor {
  public logger: Logger = new Logger(this.constructor.name);

  constructor(
    configService: ConfigService,
    private commercetools: Commercetools,
    private orderSettleService: OrderSettleService,
  ) {
    super(configService);
    this.processorName = 'OrderPaymentStateChanged';
  }

  async isEventValid(): Promise<boolean> {
    const orderPaymentStateChangedMessage = this
      .message as unknown as OrderPaymentStateChangedMessage;
    const isValid =
      orderPaymentStateChangedMessage.resource.typeId === 'order' &&
      this.isValidMessageType(orderPaymentStateChangedMessage.type) &&
      this.isValidState(orderPaymentStateChangedMessage.paymentState) &&
      !this.isEventDisabled();
    this.logger.debug(
      `${OrderPaymentStateChangedProcessor.name} ${
        isValid ? 'IS' : 'NOT'
      } valid for message with resource ID: ${this.message.resource.id}`,
    );
    return isValid;
  }

  async generateActions(): Promise<(() => any)[]> {
    this.logger.debug({
      message: 'Generating actions',
      context: OrderPaymentStateChangedProcessor.name,
    });
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
