import { CommercetoolsCircuitBreakerStateService } from '../commercetools-circuit-breaker-state.service';
import { Provider } from '@nestjs/common';

export const CIRCUIT_BREAKER_STATE_SERVICE_PROVIDER = Symbol(
  'CircuitBreakerStateService',
);

export const CircuitBreakerSateServiceProvider: Provider = {
  provide: CIRCUIT_BREAKER_STATE_SERVICE_PROVIDER,
  useClass: CommercetoolsCircuitBreakerStateService,
};
