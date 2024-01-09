import { Injectable, Logger } from '@nestjs/common';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { EventHandlerService } from '../../services/event-handler/event-handler.service';
import { isFulfilled } from '../../helper/promise';

@Injectable()
export class OrderSubscriptionService {
  private readonly logger = new Logger(OrderSubscriptionService.name);

  constructor(private eventHandlerService: EventHandlerService) {}

  async handleOrderSubscriptionEvents(
    message: MessageDeliveryPayload,
  ): Promise<any> {
    const actionPromises = await this.eventHandlerService.processEvent(message);
    const response = this.eventHandlerService.handleProcessedEventResponse(
      actionPromises,
      message,
      true,
    );
    if (response.status != 'OK') {
      return response;
    }
    const validRequests = actionPromises
      .filter(isFulfilled)
      .map((done) => done.value)
      .filter((value) => value)
      .flat();
    const eagleeyeActionPromises = validRequests.map(async (actionPromise) =>
      actionPromise(),
    );
    const results = await Promise.allSettled(eagleeyeActionPromises);
    return this.eventHandlerService.handleProcessedEventResponse(
      results,
      message,
    );
  }
}
