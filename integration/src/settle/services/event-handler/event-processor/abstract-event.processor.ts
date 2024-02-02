import { DeliveryPayload } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';

export abstract class AbstractEventProcessor {
  message: DeliveryPayload;
  processorName: string;

  protected constructor(protected readonly configService: ConfigService) {}

  setMessage(message): this {
    this.message = message;
    return this;
  }

  abstract isEventValid(): Promise<boolean>;

  abstract generateActions(): Promise<(() => any)[]>;

  isEventDisabled(): boolean {
    const disabledEvents =
      this.configService.get<string[]>('eventHandler.disabledEvents') ?? [];
    return disabledEvents.includes(this.processorName);
  }
}
