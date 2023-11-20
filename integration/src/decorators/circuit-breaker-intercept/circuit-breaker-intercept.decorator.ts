import { Inject, Logger } from '@nestjs/common';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';

export function CircuitBreakerIntercept() {
  const circuitBreakerService = Inject(CircuitBreakerService);
  const logger = new Logger('CircuitBreakerIntercept');
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Service injection
      circuitBreakerService(target, 'circuitBreaker');
      const circuitBreaker: CircuitBreakerService = this.circuitBreakerService;

      // Modify the arguments or perform any other actions
      try {
        const result = await circuitBreaker.fire(...args);
        logger.log(`Circuit breaker call result: `, result);
        return result;
      } catch (error) {
        logger.error('Error calling the circuit breaker API', error);
        throw error;
      }

      // Call the original method
      // return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
