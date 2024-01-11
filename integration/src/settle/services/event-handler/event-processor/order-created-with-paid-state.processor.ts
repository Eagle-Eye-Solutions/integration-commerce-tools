import { AbstractEventProcessor } from './abstract-event.processor';
import { OrderCreatedMessage } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger, Injectable } from '@nestjs/common';
import { Commercetools } from '../../../../common/providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../../../settle/services/order-settle/order-settle.service';
import { FIELD_EAGLEEYE_SETTLED_STATUS } from '../../../../common/providers/commercetools/custom-type/cart-type-definition';

@Injectable()
export class OrderCreatedWithPaidStateProcessor extends AbstractEventProcessor {
  public logger: Logger = new Logger(this.constructor.name);
  private order: Order;

  constructor(
    configService: ConfigService,
    private commercetools: Commercetools,
    private orderSettleService: OrderSettleService,
  ) {
    super(configService);
    this.processorName = 'OrderCreatedWithPaidState';
  }

  async isEventValid(): Promise<boolean> {
    const orderCreatedMessage = this.message as unknown as OrderCreatedMessage;
    const isValid =
      orderCreatedMessage.resource.typeId === 'order' &&
      this.isValidMessageType(orderCreatedMessage.type) &&
      (await this.isValidState(orderCreatedMessage)) &&
      !this.isEventDisabled();
    this.logger.debug(
      `${OrderCreatedWithPaidStateProcessor.name} ${
        isValid ? 'IS' : 'NOT'
      } valid for message with resource ID: ${this.message.resource.id}`,
    );
    return isValid;
  }

  async generateActions(): Promise<(() => any)[]> {
    this.logger.debug({
      message: 'Generating actions',
      context: OrderCreatedWithPaidStateProcessor.name,
    });
    const actions = [];
    actions.push(async () => {
      const orderCreatedMessage = this
        .message as unknown as OrderCreatedMessage;
      let ctOrder: Order;
      if (orderCreatedMessage.order) {
        ctOrder = orderCreatedMessage.order;
      } else {
        ctOrder = this.order;
      }
      const updateActions =
        await this.orderSettleService.settleTransactionFromOrder(ctOrder);
      await this.commercetools.updateOrderById(ctOrder.id, {
        version: ctOrder.version,
        actions: updateActions,
      });
    });
    return actions;
  }

  public async isValidState(
    orderCreatedMessage: OrderCreatedMessage,
  ): Promise<boolean> {
    let orderPaymentState;
    let orderSettledStatus;
    if (orderCreatedMessage.order && orderCreatedMessage.order.custom?.fields) {
      orderPaymentState = orderCreatedMessage.order.paymentState;
      orderSettledStatus =
        orderCreatedMessage.order.custom?.fields[FIELD_EAGLEEYE_SETTLED_STATUS];
    } else {
      try {
        this.order = await this.commercetools.getOrderById(
          this.message.resource.id,
        );
        orderPaymentState = this.order.paymentState;
        if (this.order.custom?.fields) {
          orderSettledStatus =
            this.order.custom?.fields[FIELD_EAGLEEYE_SETTLED_STATUS];
        }
      } catch (err) {
        this.logger.warn(
          `Failed to get order ${this.message.resource.id} from CT to check paymentState`,
          err,
        );
        return false;
      }
    }
    return (
      Boolean(orderPaymentState === 'Paid') &&
      Boolean(orderSettledStatus !== 'SETTLED')
    );
  }

  public isValidMessageType(type: string): boolean {
    return Boolean(type === 'OrderCreated');
  }
}
