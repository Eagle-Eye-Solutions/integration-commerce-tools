import CircuitBreaker from 'opossum';

export type CircuitBreakerInfo = {
  state: CircuitBreaker.State;
  stats?: CircuitBreaker.Stats;
};

export interface CircuitBreakerState {
  saveState(info: CircuitBreakerInfo): Promise<void>;

  loadState(): Promise<CircuitBreakerInfo | undefined>;

  deleteState(): Promise<void>;
}
