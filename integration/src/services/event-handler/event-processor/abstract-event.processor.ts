import { DeliveryPayload } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';

export abstract class AbstractEventProcessor {
  constructor(
    protected readonly message: DeliveryPayload,
    protected readonly configService: ConfigService,
  ) {}

  abstract isEventValid(): boolean;

  abstract generateActions(): Promise<any[]>;

  isEventDisabled(PROCESSOR_NAME: string): boolean {
    const disabledEvents =
      this.configService.get<string[]>('eventHandler.disabledEvents') ?? [];
    return disabledEvents.includes(PROCESSOR_NAME);
  }
}
