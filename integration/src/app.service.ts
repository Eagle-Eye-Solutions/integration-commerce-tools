import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { CartCustomTypeActionBuilder } from './providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import { ExtensionInput } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/extension';
import {
  ActionsSupported,
  CTActionsBuilder,
} from './providers/commercetools/actions/ActionsBuilder';
import { CartDiscountActionBuilder } from './providers/commercetools/actions/cart-update/CartDiscountActionBuilder';
import { PromotionService } from './services/promotions/promotions.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private promotionService: PromotionService,
  ) {}

  async handleExtensionRequest(body: ExtensionInput): Promise<{
    actions: ActionsSupported[];
  }> {
    this.logger.log('Received body: ', body);
    const actionBuilder = new CTActionsBuilder();
    //todo move logic to guard
    if (body?.resource?.typeId !== 'cart') {
      return actionBuilder.build();
    }
    let extensionActions: {
      actions: ActionsSupported[];
    };
    try {
      const basketDiscounts = await this.promotionService.getDiscounts(
        body.resource,
      );
      actionBuilder.add(
        CartCustomTypeActionBuilder.addCustomType(
          [],
          [...basketDiscounts.discountDescriptions],
        ),
      );
      actionBuilder.add(
        CartDiscountActionBuilder.addDiscount([...basketDiscounts.discounts]),
      );
      extensionActions = actionBuilder.build();
    } catch (error) {
      this.logger.error(error, error.stack);
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
      // Discounts should be removed only if the basket was not persisted in AIR. See https://eagleeye.atlassian.net/browse/CTP-3
      actionBuilder.add(CartDiscountActionBuilder.removeDiscounts());
      extensionActions = actionBuilder.build();
    }
    this.logger.debug({
      message: `Returning ${extensionActions.actions.length} actions to commercetools`,
      extensionActions,
    });
    return extensionActions;
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
