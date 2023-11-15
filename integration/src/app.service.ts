import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerService } from './providers/circuit-breaker/circuit-breaker.service';
import { CartCustomTypeActionBuilder } from './providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import { ExtensionInput } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/extension';
import {
  ActionsSupported,
  CTActionsBuilder,
} from './providers/commercetools/actions/ActionsBuilder';
import { CartDiscountActionBuilder } from './providers/commercetools/actions/cart-update/CartDiscountActionBuilder';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  handleExtensionRequest(body: ExtensionInput): {
    actions: ActionsSupported[];
  } {
    this.logger.debug('Received body: ', body);
    const actionBuilder = new CTActionsBuilder();
    //todo move logic to guard
    if (body?.resource?.typeId !== 'cart') {
      return actionBuilder.build();
    }
    return this.circuitBreakerService
      .fire({})
      .then((result: any) => {
        this.logger.log(`Circuit breaker call result: `, result);
        actionBuilder.add(CartCustomTypeActionBuilder.addCustomType([]));
        actionBuilder.add(CartDiscountActionBuilder.addDiscount());
        return actionBuilder.build();
      })
      .catch((error: any) => {
        this.logger.error('Error calling the circuit breaker API', error);

        const type = this.getErrorTypeCode(error);
        actionBuilder.add(
          CartCustomTypeActionBuilder.addCustomType([
            {
              type,
              message:
                'The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated',
            },
          ]),
        );
        // Discounts should be removed only if the basked was not persisted in AIR. See https://eagleeye.atlassian.net/browse/CTP-3
        actionBuilder.add(CartDiscountActionBuilder.removeDiscounts());
        return actionBuilder.build();
      });
  }

  private getErrorTypeCode(error: any) {
    if (error instanceof EagleEyeApiException) {
      return error.type;
    } else if (error.code === 'EOPENBREAKER') {
      return 'EE_API_CIRCUIT_OPEN';
    } else {
      return 'EE_API_GENERIC_ERROR';
    }
  }
}
