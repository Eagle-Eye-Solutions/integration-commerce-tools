import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ConfigService } from '@nestjs/config';
import { BreakableApi } from './interfaces/breakable-api.interface';
import {
  CircuitBreakerInfo,
  CircuitBreakerState,
} from './interfaces/circuit-breaker-state.interface';
import * as CircuitBreaker from 'opossum';
import { mock } from 'jest-mock-extended';
import { BREAKABLE_API } from './circuit-breaker.provider';
import { CIRCUIT_BREAKER_STATE_SERVICE_PROVIDER } from './interfaces/circuit-breaker-state.provider';
import { Logger } from '@nestjs/common';

let enabledBreakerMock = true;
let openedBreakerMock = false;

jest.mock('opossum', () => {
  return jest.fn().mockImplementation(() => {
    return {
      fire: jest.fn(),
      on: jest.fn(),
      toJSON: jest.fn(),
      enabled: enabledBreakerMock,
      opened: openedBreakerMock,
    };
  });
});

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;
  let breakableApi: BreakableApi;
  let circuitBreakerState: jest.Mocked<CircuitBreakerState>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerService,
        {
          provide: BREAKABLE_API,
          useValue: {
            invoke: jest.fn(),
          },
        },
        {
          provide: CIRCUIT_BREAKER_STATE_SERVICE_PROVIDER,
          useValue: {
            loadState: jest.fn(),
            saveState: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValueOnce(true),
          },
        },
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
    breakableApi = module.get<BreakableApi>(BREAKABLE_API);
    circuitBreakerState = module.get(CIRCUIT_BREAKER_STATE_SERVICE_PROVIDER);
    configService = module.get(ConfigService);
    enabledBreakerMock = true;
    openedBreakerMock = false;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize circuit breaker on module init', async () => {
    const initialState = mock<CircuitBreakerInfo>();
    jest
      .spyOn(circuitBreakerState, 'loadState')
      .mockResolvedValue(initialState);
    await service.onModuleInit();
    expect(configService.get).toHaveBeenCalledWith(
      'circuitBreaker.timeout',
      1800,
    );

    expect(jest.spyOn(circuitBreakerState, 'loadState')).toBeCalledTimes(1);
    expect(CircuitBreaker).toHaveBeenCalledWith(
      breakableApi.invoke,
      expect.objectContaining(initialState),
    );
  });

  it('should not load the state from commercetools if the circuit breaker is disabled in the config', async () => {
    configService.get.mockReset();
    configService.get.mockReturnValue(false);
    enabledBreakerMock = false;
    await service.onModuleInit();

    expect(jest.spyOn(circuitBreakerState, 'loadState')).toBeCalledTimes(0);
  });

  it('should log error if the circuit breaker is open', async () => {
    configService.get.mockReset();
    configService.get.mockReturnValue(false);
    openedBreakerMock = true;
    await service.onModuleInit();

    expect(jest.spyOn(circuitBreakerState, 'loadState')).toBeCalledTimes(0);
  });

  it('should save state', async () => {
    const initialState: CircuitBreakerInfo = {
      state: {
        name: 'someName',
        enabled: true,
        closed: true,
        open: false,
        halfOpen: false,
        warmUp: false,
        shutdown: false,
        lastTimerAt: undefined,
      },
      stats: undefined,
    };
    circuitBreakerState.loadState.mockResolvedValue(initialState);

    await service.onModuleInit(); // Call onModuleInit manually

    jest.spyOn(service['circuit'], 'toJSON').mockReturnValue(initialState);
    await service.saveState();
    expect(circuitBreakerState.saveState).toHaveBeenCalledWith(initialState);
  });

  it('should fire circuit breaker', async () => {
    const args = ['arg1', 'arg2'];
    await service.onModuleInit();
    await service.fire(...args);
    expect(service['circuit'].fire).toHaveBeenCalledWith(...args);
  });
});
