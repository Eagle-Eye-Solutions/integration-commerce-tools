import { AbstractEventProcessor } from './abstract-event.processor';
import {
  OrderCustomFieldAddedMessage,
  OrderCustomFieldChangedMessage,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
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
export class OrderUpdatedWithSettleActionProcessor extends AbstractEventProcessor {
  private readonly PROCESSOR_NAME = 'OrderUpdatedWithSettleActionProcessor';
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
    const orderMessage = this.message as unknown as
      | OrderCustomFieldAddedMessage
      | OrderCustomFieldChangedMessage;
    return (
      orderMessage.resource.typeId === 'order' &&
      this.isValidMessageType(orderMessage.type) &&
      (await this.isValidState(orderMessage)) &&
      !this.isEventDisabled(this.PROCESSOR_NAME)
    );
  }

  async generateActions(): Promise<(() => any)[]> {
    const actions = [];
    actions.push(async () => {
      const updateActions =
        await this.orderSettleService.settleTransactionFromOrder(this.order);
      await this.commercetools.updateOrderById(this.order.id, {
        version: this.order.version,
        actions: updateActions,
      });
    });
    return actions;
  }

  public async isValidState(
    orderMessage: OrderCustomFieldAddedMessage | OrderCustomFieldChangedMessage,
  ): Promise<boolean> {
    let orderSettleAction;
    let orderSettledStatus;
    if (
      orderMessage.name === FIELD_EAGLEEYE_ACTION &&
      orderMessage.value === 'SETTLE'
    ) {
      orderSettleAction = orderMessage.value;
      try {
        this.order = await this.commercetools.getOrderById(
          this.message.resource.id,
        );
        orderSettledStatus =
          this.order.custom.fields[FIELD_EAGLEEYE_SETTLED_STATUS];
      } catch (err) {
        this.logger.warn(
          `Failed to get order ${this.message.resource.id} from CT to check settle action/status`,
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
    return Boolean(
      type === 'OrderCustomFieldAdded' || type === 'OrderCustomFieldChanged',
    );
  }
}