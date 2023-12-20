import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
} from './providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { EagleEyeApiException } from './common/exceptions/eagle-eye-api.exception';
import {
  ActionsSupported,
  CTActionsBuilder,
} from './providers/commercetools/actions/ActionsBuilder';
import { CartDiscountActionBuilder } from './providers/commercetools/actions/cart-update/CartDiscountActionBuilder';
import { PromotionService } from './services/promotions/promotions.service';
import {
  CartReference,
  ExtensionInput,
  MessageDeliveryPayload,
} from '@commercetools/platform-sdk';
import { BasketStoreService } from './services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from './services/basket-store/basket-store.provider';
import { EagleEyePluginException } from './common/exceptions/eagle-eye-plugin.exception';
import { EventHandlerService } from './services/event-handler/event-handler.service';
import { isFulfilled } from './common/helper/promise';
import { CartTypeDefinition } from './providers/commercetools/custom-type/cart-type-definition';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private promotionService: PromotionService,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
    private eventHandlerService: EventHandlerService,
    private cartTypeDefinition: CartTypeDefinition,
  ) {}

  async handleExtensionRequest(body: ExtensionInput): Promise<{
    actions: ActionsSupported[];
  }> {
    this.logger.log({
      message: 'Received body: ',
      context: AppService.name,
      body,
    });
    const resourceObj = (body?.resource as any)?.obj;

    try {
      const actionBuilder = new CTActionsBuilder();
      await this.applyCartExtensionUpdates(actionBuilder, body);
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
      if (this.basketStoreService.isEnabled(body.resource as CartReference)) {
        try {
          await this.basketStoreService.delete(body.resource.id);
        } catch (errorDelete) {
          this.logger.error(
            'Error deleting stored enriched basket',
            errorDelete,
          );
        }
      }

      const actionBuilder = new CTActionsBuilder();

      if (CartCustomTypeActionBuilder.checkResourceCustomType(resourceObj)) {
        actionBuilder.addAll(
          CartCustomTypeActionBuilder.setCustomFields({
            errors,
            discountDescriptions: [],
          }),
        );
      } else {
        actionBuilder.add(
          CartCustomTypeActionBuilder.addCustomType(
            { errors },
            this.cartTypeDefinition.getTypeKey(),
          ),
        );
      }
      // Discount removal should only be done for carts. This action is not valid for orders.
      if (body.resource.typeId === 'cart') {
        // Discounts should be removed only if the basket was not persisted in AIR. See https://eagleeye.atlassian.net/browse/CTP-3
        actionBuilder.add(CartDiscountActionBuilder.removeDiscounts());
      }

      const extensionActions = actionBuilder.build();
      this.logger.debug({
        message: `Returning ${extensionActions.actions.length} actions to commercetools`,
        extensionActions,
      });
      return extensionActions;
    }
  }

  async handleSubscriptionEvents(
    message: MessageDeliveryPayload,
  ): Promise<any> {
    const actionPromises = await this.eventHandlerService.processEvent(message);
    const response = this.eventHandlerService.handleProcessedEventResponse(
      actionPromises,
      message,
      true,
    );
    if (response.status != 'OK') {
      return response;
    }
    const validRequests = actionPromises
      .filter(isFulfilled)
      .map((done) => done.value)
      .filter((value) => value)
      .flat();
    const eagleeyeActionPromises = validRequests.map(async (actionPromise) =>
      actionPromise(),
    );
    const results = await Promise.allSettled(eagleeyeActionPromises);
    return this.eventHandlerService.handleProcessedEventResponse(
      results,
      message,
    );
  }

  async applyCartExtensionUpdates(
    actionBuilder: CTActionsBuilder,
    body: ExtensionInput,
  ) {
    const resourceObj = (body?.resource as any)?.obj;
    const basketDiscounts = await this.promotionService.getDiscounts(
      body.resource as CartReference, //checked in the ExtensionTypeMiddleware
    );

    //store basket
    let basketLocation = null;
    if (this.basketStoreService.isEnabled(body.resource as CartReference)) {
      basketLocation = await this.basketStoreService.save(
        basketDiscounts.enrichedBasket,
        body.resource.id,
      );
    }

    if (CartCustomTypeActionBuilder.checkResourceCustomType(resourceObj)) {
      actionBuilder.addAll(
        CartCustomTypeActionBuilder.setCustomFields({
          errors: basketDiscounts.errors,
          discountDescriptions: [...basketDiscounts.discountDescriptions],
          voucherCodes: basketDiscounts.voucherCodes,
          potentialVoucherCodes: basketDiscounts.potentialVoucherCodes,
          basketLocation,
        }),
      );
    } else {
      actionBuilder.add(
        CartCustomTypeActionBuilder.addCustomType(
          {
            errors: basketDiscounts.errors,
            discountDescriptions: [...basketDiscounts.discountDescriptions],
            voucherCodes: basketDiscounts.voucherCodes,
            potentialVoucherCodes: basketDiscounts.potentialVoucherCodes,
            basketLocation,
          },
          this.cartTypeDefinition.getTypeKey(),
        ),
      );
    }
    actionBuilder.add(
      CartDiscountActionBuilder.addDiscount([...basketDiscounts.discounts]),
    );
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
