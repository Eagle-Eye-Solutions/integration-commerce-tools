import { Inject, Injectable, Logger } from '@nestjs/common';
import { MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { isFulfilled, isRejected } from '../../../common/helper/promise';
import { AbstractEventProcessor } from './event-processor/abstract-event.processor';

type ProcessingResult = {
  status: 'OK' | '4xx';
};

@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger(EventHandlerService.name);

  constructor(
    @Inject('EventProcessors')
    private eventProcessors: AbstractEventProcessor[],
  ) {}

  async processEvent(message: MessageDeliveryPayload) {
    this.logger.log(
      `Processing commercetools message type '${message.notificationType}', resource type '${message.resource.typeId}', ID: ${message.resource.id}`,
    );
    this.logger.debug({
      message: 'Event message payload',
      context: EventHandlerService.name,
      messagePayload: message,
    });
    const validProcessors = await this.filterValidProcessors(message);

    return await Promise.allSettled(
      validProcessors.map(async (eventProcessor) =>
        eventProcessor.generateActions(),
      ),
    );
  }

  private async filterValidProcessors(message: MessageDeliveryPayload) {
    const processorsValidity = await Promise.allSettled(
      this.eventProcessors.map((eventProcessor) => {
        eventProcessor.setMessage(message);
        return eventProcessor.isEventValid();
      }),
    );
    return this.eventProcessors.filter((eventProcessor, index) => {
      const result = processorsValidity[index];
      if (result.status === 'fulfilled') {
        return result.value;
      } else if (result.status === 'rejected') {
        this.logger.error(
          `Error evaluating the processor validity for ${eventProcessor.processorName}. ${result.reason}`,
        );
      }
      return false;
    });
  }

  handleProcessedEventResponse(
    results: Array<PromiseSettledResult<Awaited<Promise<any>>>>,
    message: MessageDeliveryPayload,
    logEventStats = true,
  ): ProcessingResult {
    const rejected = results.filter(isRejected);
    const fulfilled = results.filter(isFulfilled);

    if (results.length === 0 && logEventStats) {
      this.logger.warn(
        `No processor found to handle the message. Message with notification type ${message.notificationType} and resource type '${message.resource.typeId}' ignored`,
      );
    }
    if (results.length > 0 && logEventStats) {
      this.logger.log(`Actions to be performed: ${results.length}`);
      this.logger.log(`Actions performed successfully: ${fulfilled.length}`);
    }
    if (rejected.length > 0) {
      let _5xxError = false;
      this.logger.error(`Events failed: ${rejected.length}`);
      rejected.forEach((error, index) => {
        this.logger.error(`Request ${index + 1} failed with error`, error);
        if (error?.reason?.status >= 400 && error.reason?.status < 500) {
          this.logger.error(
            `Request ${index + 1} returned with status code ${
              error.reason.status
            } needs manual intervention.`,
          );
        } else if (error?.reason?.status >= 500) {
          _5xxError = true;
          this.logger.error(
            `Request failed with a 5xx status code ${error?.reason?.status}.`,
            error,
          );
        } else {
          this.logger.error(
            `Request failed with a status code ${error?.reason?.status}.`,
            error,
          );
        }
      });
      if (_5xxError) {
        this.logger.error(
          'One or more requests failed with error 5xx, sending message back to queue for retry or manual intervention.',
        );
        throw new Error(`Failed to process request for message: ${message.id}`);
      }
      return {
        status: '4xx',
      };
    }
    return {
      status: 'OK',
    };
  }
}
