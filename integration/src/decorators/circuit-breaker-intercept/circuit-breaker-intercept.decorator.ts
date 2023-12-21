import { Inject, Logger } from '@nestjs/common';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';

export function CircuitBreakerIntercept() {
  // NOTE: always inject CircuitBreakerService into any class using this decorator.
  const circuitBreakerService = Inject(CircuitBreakerService);
  const logger = new Logger('CircuitBreakerIntercept');
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: any[]) {
      circuitBreakerService(target, 'circuitBreaker');
      const circuitBreaker: CircuitBreakerService = this.circuitBreakerService;

      try {
        const result = await circuitBreaker.fire(...args);
        logger.log({
          message: `Circuit breaker call result: `,
          result: { status: result.status, data: result.data },
        });
        return result;
      } catch (error) {
        logger.error('Error calling the circuit breaker API', error);
        throw error;
      }
    };

    return descriptor;
  };
}
