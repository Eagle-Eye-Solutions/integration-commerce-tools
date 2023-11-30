import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
} from './providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import { ExtensionInput } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/extension';
import {
  ActionsSupported,
  CTActionsBuilder,
} from './providers/commercetools/actions/ActionsBuilder';
import { CartDiscountActionBuilder } from './providers/commercetools/actions/cart-update/CartDiscountActionBuilder';
import { PromotionService } from './services/promotions/promotions.service';
import { CartReference } from '@commercetools/platform-sdk';
import { BasketStoreService } from './services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from './services/basket-store/basket-store.provider';
import { EagleEyePluginException } from './common/exceptions/eagle-eye-plugin.exception';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private promotionService: PromotionService,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
  ) {}

  async handleExtensionRequest(body: ExtensionInput): Promise<{
    actions: ActionsSupported[];
  }> {
    this.logger.log({
      message: 'Received body: ',
      context: AppService.name,
      body,
    });
    //todo move logic to guard
    if (body?.resource?.typeId !== 'cart') {
      return new CTActionsBuilder().build();
    }

    try {
      const basketDiscounts = await this.promotionService.getDiscounts(
        body.resource as CartReference, //checked in the ExtensionTypeMiddleware
      );

      //store basket
      let basketLocation = null;
      if (this.basketStoreService.isEnabled(body?.resource?.obj)) {
        basketLocation = await this.basketStoreService.save(
          basketDiscounts.enrichedBasket,
          body.resource.id,
        );
      }

      const actionBuilder = new CTActionsBuilder();
      if (
        CartCustomTypeActionBuilder.checkResourceCustomType(body?.resource?.obj)
      ) {
        actionBuilder.addAll(
          CartCustomTypeActionBuilder.setCustomFields(
            basketDiscounts.errors,
            [...basketDiscounts.discountDescriptions],
            basketLocation,
          ),
        );
      } else {
        actionBuilder.add(
          CartCustomTypeActionBuilder.addCustomType(
            basketDiscounts.errors,
            [...basketDiscounts.discountDescriptions],
            basketLocation,
          ),
        );
      }
      actionBuilder.add(
        CartDiscountActionBuilder.addDiscount([...basketDiscounts.discounts]),
      );
      const extensionActions = actionBuilder.build();
      this.logger.debug({
        message: `Returning ${extensionActions.actions.length} actions to commercetools`,
        extensionActions,
      });
      return extensionActions;
    } catch (error) {
      this.logger.error(error, error.stack);

      const errors: CustomFieldError[] = [];

      errors.push(this.getErrorDetails(error));

      //delete basket store
      if (this.basketStoreService.isEnabled(body?.resource?.obj)) {
        try {
          await this.basketStoreService.delete(body.resource.id);
        } catch (errorDelete) {
          // we don't want to propagate the basket delete error otherwise it will be catched by the global error handler
          // and the original error will be hidden
          if (errorDelete instanceof EagleEyePluginException) {
            const { type, message } = errorDelete;
            errors.push({ type, message });
          }
        }
      }

      const actionBuilder = new CTActionsBuilder();

      if (
        CartCustomTypeActionBuilder.checkResourceCustomType(body?.resource?.obj)
      ) {
        actionBuilder.addAll(
          CartCustomTypeActionBuilder.setCustomFields(errors, [], null),
        );
      } else {
        actionBuilder.add(CartCustomTypeActionBuilder.addCustomType(errors));
      }
      // Discounts should be removed only if the basket was not persisted in AIR. See https://eagleeye.atlassian.net/browse/CTP-3
      actionBuilder.add(CartDiscountActionBuilder.removeDiscounts());

      const extensionActions = actionBuilder.build();
      this.logger.debug({
        message: `Returning ${extensionActions.actions.length} actions to commercetools`,
        extensionActions,
      });
      return extensionActions;
    }
  }

  private getErrorDetails(error: any): CustomFieldError {
    if (
      error instanceof EagleEyeApiException ||
      error instanceof EagleEyePluginException
    ) {
      return {
        type: error.type,
        message: error.message,
      };
    } else if (error.code === 'EOPENBREAKER') {
      return {
        type: 'EE_API_CIRCUIT_OPEN',
        message:
          'The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated',
      };
    } else {
      return {
        type: 'EE_API_GENERIC_ERROR',
        message:
          'Unexpected error with getting the promotions and loyalty points',
      };
    }
  }
}
