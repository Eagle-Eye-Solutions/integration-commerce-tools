import { Injectable, Logger } from '@nestjs/common';
import { CartCustomTypeActionBuilder } from './providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import { ExtensionInput } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/extension';
import {
  ActionsSupported,
  CTActionsBuilder,
} from './providers/commercetools/actions/ActionsBuilder';
import { CartDiscountActionBuilder } from './providers/commercetools/actions/cart-update/CartDiscountActionBuilder';
import { PromotionsService } from './services/promotions/promotions.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private promotionsService: PromotionsService) {}

  async handleExtensionRequest(body: ExtensionInput): Promise<{
    actions: ActionsSupported[];
  }> {
    this.logger.debug('Received body: ', body);
    const actionBuilder = new CTActionsBuilder();
    //todo move logic to guard
    if (body?.resource?.typeId !== 'cart') {
      return actionBuilder.build();
    }
    try {
      const basketDiscounts = await this.promotionsService.getDiscounts(
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
      return actionBuilder.build();
    } catch (error) {
      this.logger.error(error);
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
      return actionBuilder.build();
    }
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
