import { AbstractEventProcessor } from './abstract-event.processor';
import { OrderCreatedMessage } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger, Injectable } from '@nestjs/common';
import { Commercetools } from '../../../../common/providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../../../settle/services/order-settle/order-settle.service';
import {
  FIELD_EAGLEEYE_SETTLED_STATUS,
  FIELD_EAGLEEYE_ACTION,
} from '../../../../common/providers/commercetools/custom-type/cart-type-definition';

@Injectable()
export class OrderCreatedWithSettleActionProcessor extends AbstractEventProcessor {
  public logger: Logger = new Logger(this.constructor.name);
  private order: Order;

  constructor(
    configService: ConfigService,
    private commercetools: Commercetools,
    private orderSettleService: OrderSettleService,
  ) {
    super(configService);
    this.processorName = 'OrderCreatedWithSettleAction';
  }

  async isEventValid(): Promise<boolean> {
    const orderCreatedMessage = this.message as unknown as OrderCreatedMessage;
    const isValid =
      orderCreatedMessage.resource.typeId === 'order' &&
      this.isValidMessageType(orderCreatedMessage.type) &&
      (await this.isValidState()) &&
      !this.isEventDisabled();
    this.logger.debug(
      `${OrderCreatedWithSettleActionProcessor.name} ${
        isValid ? 'IS' : 'NOT'
      } valid for message with resource ID: ${this.message.resource.id}`,
    );
    return isValid;
  }

  async generateActions(): Promise<(() => any)[]> {
    this.logger.debug({
      message: `Generating actions for ${OrderCreatedWithSettleActionProcessor.name}`,
      context: OrderCreatedWithSettleActionProcessor.name,
    });
    const actions = [];
    actions.push(async () => {
      let updateActions = [];
      let settleError;
      try {
        updateActions =
          await this.orderSettleService.settleTransactionFromOrder(this.order);
      } catch (err) {
        updateActions = this.orderSettleService.getSettleErrorActions(
          this.order,
          err,
        );
        settleError = err;
      }
      await this.commercetools.updateOrderById(this.order.id, {
        version: this.order.version,
        actions: updateActions,
      });
      if (settleError !== undefined) {
        throw settleError;
      }
    });
    return actions;
  }

  public async isValidState(): Promise<boolean> {
    let orderSettleAction;
    let orderSettledStatus;
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
        `Failed to get order ${this.message.resource.id} from CT to check action/status`,
        err,
      );
      return false;
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
