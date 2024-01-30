import { AbstractEventProcessor } from './abstract-event.processor';
import { OrderCreatedMessage } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Logger, Injectable } from '@nestjs/common';
import { Commercetools } from '../../../../common/providers/commercetools/commercetools.provider';
import { OrderSettleService } from '../../../../settle/services/order-settle/order-settle.service';

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
    return await this.orderSettleService.getGenericSettleActions(
      this.order,
      this.commercetools,
    );
  }

  public async isValidState(): Promise<boolean> {
    try {
      this.order = await this.commercetools.getOrderById(
        this.message.resource.id,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to get order ${this.message.resource.id} from CT to check action/status`,
        err,
      );
      return false;
    }
    return this.orderSettleService.canBeSettled(this.order, this.processorName);
  }

  public isValidMessageType(type: string): boolean {
    return Boolean(type === 'OrderCreated');
  }
}
