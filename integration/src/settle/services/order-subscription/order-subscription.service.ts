import { Injectable, Logger } from '@nestjs/common';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { EventHandlerService } from '../../services/event-handler/event-handler.service';
import { isFulfilled } from '../../../common/helper/promise';

@Injectable()
export class OrderSubscriptionService {
  private readonly logger = new Logger(OrderSubscriptionService.name);

  constructor(private eventHandlerService: EventHandlerService) {}

  async handleOrderSubscriptionEvents(
    message: MessageDeliveryPayload,
  ): Promise<any> {
    try {
      const actionPromises =
        await this.eventHandlerService.processEvent(message);
      const response = this.eventHandlerService.handleProcessedEventResponse(
        actionPromises,
        message,
        true,
      );
      if (response.status != 'OK') {
        return this.getResponseWithStatus(response);
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
      const processedEventResult =
        this.eventHandlerService.handleProcessedEventResponse(results, message);
      return this.getResponseWithStatus(processedEventResult);
    } catch (e) {
      this.logger.error('Unknown OrderSubscription processing error:', e);
      return { statusCode: 500, result: e };
    }
  }

  private getResponseWithStatus(eventResult) {
    switch (eventResult.status) {
      case 'OK':
        return { statusCode: 200, result: eventResult };
      case '4xx':
        return { statusCode: 202, result: eventResult };
      default:
        return { statusCode: 202, result: eventResult };
    }
  }
}
