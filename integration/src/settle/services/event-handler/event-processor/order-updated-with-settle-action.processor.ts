import { AbstractEventProcessor } from './abstract-event.processor';
import {
  OrderCustomFieldAddedMessage,
  OrderCustomFieldChangedMessage,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger, Injectable } from '@nestjs/common';
import { Commercetools } from '../../../../common/providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../../../settle/services/order-settle/order-settle.service';
import { FIELD_EAGLEEYE_ACTION } from '../../../../common/providers/commercetools/custom-type/cart-type-definition';

@Injectable()
export class OrderUpdatedWithSettleActionProcessor extends AbstractEventProcessor {
  public logger: Logger = new Logger(this.constructor.name);
  private order: Order;

  constructor(
    configService: ConfigService,
    private commercetools: Commercetools,
    private orderSettleService: OrderSettleService,
  ) {
    super(configService);
    this.processorName = 'OrderUpdatedWithSettleAction';
  }

  async isEventValid(): Promise<boolean> {
    const orderMessage = this.message as unknown as
      | OrderCustomFieldAddedMessage
      | OrderCustomFieldChangedMessage;
    const isValid =
      orderMessage.resource.typeId === 'order' &&
      this.isValidMessageType(orderMessage.type) &&
      (await this.isValidState(orderMessage)) &&
      !this.isEventDisabled();
    this.logger.debug(
      `${OrderUpdatedWithSettleActionProcessor.name} ${
        isValid ? 'IS' : 'NOT'
      } valid for message with resource ID: ${this.message.resource.id}`,
    );
    return isValid;
  }

  async generateActions(): Promise<(() => any)[]> {
    this.logger.debug({
      message: 'Generating actions',
      context: OrderUpdatedWithSettleActionProcessor.name,
    });
    return await this.orderSettleService.getGenericSettleActions(
      this.order,
      this.commercetools,
    );
  }

  public async isValidState(
    orderMessage: OrderCustomFieldAddedMessage | OrderCustomFieldChangedMessage,
  ): Promise<boolean> {
    if (
      orderMessage.name === FIELD_EAGLEEYE_ACTION &&
      orderMessage.value === 'SETTLE'
    ) {
      try {
        this.order = await this.commercetools.getOrderById(
          this.message.resource.id,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to get order ${this.message.resource.id} from CT to check settle action/status`,
          err,
        );
        return false;
      }
      return this.orderSettleService.canBeSettled(
        this.order,
        this.processorName,
      );
    }
    return false;
  }

  public isValidMessageType(type: string): boolean {
    return Boolean(
      type === 'OrderCustomFieldAdded' || type === 'OrderCustomFieldChanged',
    );
  }
}
