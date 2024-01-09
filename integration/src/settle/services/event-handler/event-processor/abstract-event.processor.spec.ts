import { ConfigService } from '@nestjs/config';
import { AbstractEventProcessor } from './abstract-event.processor';

class ConcreteEventProcessor extends AbstractEventProcessor {
  constructor(configService: ConfigService, processorName: string) {
    super(configService);
    this.processorName = processorName;
  }

  async isEventValid(): Promise<boolean> {
    return true;
  }

  generateActions(): Promise<any[]> {
    return Promise.resolve([]);
  }
}

describe('AbstractEventProcessor', () => {
  let configService: ConfigService;
  let eventProcessor: ConcreteEventProcessor;

  beforeEach(() => {
    configService = new ConfigService();
  });

  describe('isEventDisabled', () => {
    it('should return true if the event is disabled', async () => {
      configService.get = jest.fn().mockReturnValue(['event1', 'event2']);
      eventProcessor = new ConcreteEventProcessor(configService, 'event1');
      const result = eventProcessor.isEventDisabled();
      expect(result).toBe(true);
    });

    it('should return false if the event is not disabled', () => {
      configService.get = jest.fn().mockReturnValue(['event1', 'event2']);
      eventProcessor = new ConcreteEventProcessor(configService, 'event3');
      const result = eventProcessor.isEventDisabled();
      expect(result).toBe(false);
    });

    it('should return false if the disabledEvents config is not set', () => {
      configService.get = jest.fn().mockReturnValue(undefined);
      eventProcessor = new ConcreteEventProcessor(configService, 'event1');
      const result = eventProcessor.isEventDisabled();
      expect(result).toBe(false);
    });
  });
});
