import { ConfigService } from '@nestjs/config';
import { AbstractEventProcessor } from './abstract-event.processor';

class ConcreteEventProcessor extends AbstractEventProcessor {
  isEventValid(): boolean {
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
    eventProcessor = new ConcreteEventProcessor(configService);
  });

  describe('isEventDisabled', () => {
    it('should return true if the event is disabled', () => {
      configService.get = jest.fn().mockReturnValue(['event1', 'event2']);
      const result = eventProcessor.isEventDisabled('event1');
      expect(result).toBe(true);
    });

    it('should return false if the event is not disabled', () => {
      configService.get = jest.fn().mockReturnValue(['event1', 'event2']);
      const result = eventProcessor.isEventDisabled('event3');
      expect(result).toBe(false);
    });

    it('should return false if the disabledEvents config is not set', () => {
      configService.get = jest.fn().mockReturnValue(undefined);
      const result = eventProcessor.isEventDisabled('event1');
      expect(result).toBe(false);
    });
  });
});
