import {
  CircuitBreakerInfo,
  CircuitBreakerState,
} from './interfaces/circuit-breaker-state.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
  CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
} from '../../common/constants/constants';
import { CustomObjectService } from '../commercetools/custom-object/custom-object.service';

@Injectable()
export class CommercetoolsCircuitBreakerStateService
  implements CircuitBreakerState
{
  private readonly logger = new Logger(
    CommercetoolsCircuitBreakerStateService.name,
  );

  constructor(private readonly customObjectService: CustomObjectService) {}

  async loadState(): Promise<CircuitBreakerInfo> {
    try {
      const {
        body: { value },
      } = await this.customObjectService.getCustomObject(
        CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
        CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
      );
      this.logger.log('Retrieved circuit breaker state');
      this.logger.debug({ message: 'Circuit breaker state', value });
      return value as CircuitBreakerInfo;
    } catch (e) {
      if (e.code === 404) {
        this.logger.log(
          `No circuit breaker state found in commercetools custom object. ${e.message})`,
        );
        return undefined;
      } else {
        this.logger.error(
          'Error circuit breaker loading state from commercetools ',
          e,
        );
      }
    }
  }

  async saveState(info: CircuitBreakerInfo): Promise<void> {
    try {
      this.logger.log(
        `Saving circuit breaker state in CT custom object. Open: ${info?.state?.open}`,
      );
      await this.customObjectService.saveCustomObject(
        CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
        CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
        info,
      );
      this.logger.log('Circuit breaker state saved');
    } catch (e) {
      this.logger.error(
        'Error saving circuit breaker state into commercetools custom object',
        e,
      );
    }
  }

  async deleteState(): Promise<void> {
    try {
      await this.customObjectService.deleteCustomObject(
        CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
        CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
      );
    } catch (e) {
      this.logger.warn(
        'Error deleting circuit breaker state in commercetools custom objects',
        e,
      );
    }
  }
}
