import { DeliveryPayload } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';

export abstract class AbstractEventProcessor {
  message: DeliveryPayload;
  constructor(protected readonly configService: ConfigService) {}

  setMessage(message): AbstractEventProcessor {
    this.message = message;
    return this;
  }

  abstract isEventValid(): Promise<boolean>;

  abstract generateActions(): Promise<(() => any)[]>;

  isEventDisabled(PROCESSOR_NAME: string): boolean {
    const disabledEvents =
      this.configService.get<string[]>('eventHandler.disabledEvents') ?? [];
    return disabledEvents.includes(PROCESSOR_NAME);
  }
}
