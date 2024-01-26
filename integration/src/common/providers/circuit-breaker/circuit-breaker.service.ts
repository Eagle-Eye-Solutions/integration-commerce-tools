import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';
import { ConfigService } from '@nestjs/config';
import {
  CircuitBreakerInfo,
  CircuitBreakerState,
} from './interfaces/circuit-breaker-state.interface';
import { BreakableApi } from './interfaces/breakable-api.interface';
import { BREAKABLE_API } from './circuit-breaker.provider';
import { CIRCUIT_BREAKER_STATE_SERVICE_PROVIDER } from './interfaces/circuit-breaker-state.provider';

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private circuit: CircuitBreaker;
  private readonly logger = new Logger(CircuitBreakerService.name);

  constructor(
    @Inject(BREAKABLE_API) private readonly breakableApi: BreakableApi,
    @Inject(CIRCUIT_BREAKER_STATE_SERVICE_PROVIDER)
    private readonly circuitBreakerState: CircuitBreakerState,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    let initialState: CircuitBreakerInfo;
    const enabled = this.configService.get<boolean>('circuitBreaker.enabled');
    if (!enabled) {
      initialState = { state: { enabled: false } };
    } else {
      initialState = await this.circuitBreakerState.loadState();
    }

    const options: CircuitBreaker.Options = {
      ...initialState,
      errorThresholdPercentage: this.configService.get<number>(
        'circuitBreaker.errorThresholdPercentage',
      ),
      timeout: this.configService.get<number>('circuitBreaker.timeout', 1700),
      resetTimeout: this.configService.get<number>(
        'circuitBreaker.resetTimeout',
      ),
      errorFilter: (err) => {
        return err.type === 'EE_IDENTITY_NOT_FOUND';
      },
    };

    this.circuit = new CircuitBreaker(this.breakableApi.invoke, options);
    // Log circuit state
    this.logCircuitState();

    // Event listeners
    /* istanbul ignore next */
    this.circuit.on('open', async () => {
      this.logger.warn(
        'Circuit breaker is OPENED. Subsequent calls will fail immediately.',
      );
      await this.saveState();
    });

    /* istanbul ignore next */
    this.circuit.on('failure', (ex: any) => {
      this.logger.error('API call failed!', ex);
    });

    /* istanbul ignore next */
    this.circuit.on('fallback', () => {
      this.logger.error('API call failed! Fallback function called.');
    });

    /* istanbul ignore next */
    this.circuit.on('success', () => {
      this.logger.debug('API call was successful!');
    });

    /* istanbul ignore next */
    this.circuit.on('timeout', () => {
      this.logger.error('API call timed out!');
    });

    /* istanbul ignore next */
    this.circuit.on('reject', () => {
      this.logger.error('API call was rejected!');
    });

    /* istanbul ignore next */
    this.circuit.on('halfOpen', () => {
      this.logger.warn(
        'Circuit breaker is half open. The next call will define whether it fully opens or closes.',
      );
    });

    /* istanbul ignore next */
    this.circuit.on('close', async () => {
      this.logger.log(
        'Circuit breaker is closed. Calls will proceed as normal.',
      );
      await this.circuitBreakerState.deleteState();
    });
  }

  private logCircuitState() {
    if (!this.circuit.enabled) {
      this.logger.warn('Circuit breaker is DISABLED');
    } else if (this.circuit.opened) {
      this.logger.error(
        `Initialized circuit breaker. The circuit is OPEN! Requests are NOT sent to '${this.breakableApi.invoke.name}'`,
      );
    } else {
      this.logger.log(
        `Initialized circuit breaker. The circuit is closed all requests are sent to '${this.breakableApi.invoke.name}'`,
      );
    }
  }

  async saveState() {
    const circuitState = this.circuit.toJSON();
    const state = circuitState.state;
    this.logger.debug({ message: 'Saving circuit breaker state', state });
    await this.circuitBreakerState.saveState({ state }); //stats are not saved
  }

  async fire(...args) {
    return await this.circuit.fire(...args);
  }
}
