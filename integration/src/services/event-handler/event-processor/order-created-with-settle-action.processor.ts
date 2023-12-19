import { AbstractEventProcessor } from './abstract-event.processor';
import { OrderCreatedMessage } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger, Injectable } from '@nestjs/common';
import { Commercetools } from '../../../providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../order-settle/order-settle.service';
import {
  FIELD_EAGLEEYE_SETTLED_STATUS,
  FIELD_EAGLEEYE_ACTION,
} from '../../../providers/commercetools/custom-type/custom-type-definitions';

@Injectable()
export class OrderCreatedWithSettleActionProcessor extends AbstractEventProcessor {
  private readonly PROCESSOR_NAME = 'OrderCreatedWithSettleAction';
  public logger: Logger = new Logger(this.constructor.name);
  private order: Order;

  constructor(
    configService: ConfigService,
    private commercetools: Commercetools,
    private orderSettleService: OrderSettleService,
  ) {
    super(configService);
  }

  async isEventValid(): Promise<boolean> {
    const orderCreatedMessage = this.message as unknown as OrderCreatedMessage;
    return (
      orderCreatedMessage.resource.typeId === 'order' &&
      this.isValidMessageType(orderCreatedMessage.type) &&
      (await this.isValidState(orderCreatedMessage)) &&
      !this.isEventDisabled(this.PROCESSOR_NAME)
    );
  }

  async generateActions(): Promise<(() => any)[]> {
    const actions = [];
    actions.push(async () => {
      const orderCreatedMessage = this
        .message as unknown as OrderCreatedMessage;
      let ctOrder;
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
    let orderSettleAction;
    let orderSettledStatus;
    if (orderCreatedMessage.order && orderCreatedMessage.order.custom?.fields) {
      orderSettleAction =
        orderCreatedMessage.order.custom?.fields[FIELD_EAGLEEYE_ACTION];
      orderSettledStatus =
        orderCreatedMessage.order.custom?.fields[FIELD_EAGLEEYE_SETTLED_STATUS];
    } else {
      try {
        this.order = await this.commercetools.getOrderById(
          this.message.resource.id,
        );
        if (this.order.custom?.fields) {
          orderSettleAction = this.order.custom?.fields[FIELD_EAGLEEYE_ACTION];
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
      Boolean(orderSettleAction === 'SETTLE') &&
      Boolean(orderSettledStatus !== 'SETTLED')
    );
  }

  public isValidMessageType(type: string): boolean {
    return Boolean(type === 'OrderCreated');
  }
}
