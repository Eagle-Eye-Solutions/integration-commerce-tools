import { Inject, Injectable, Logger } from '@nestjs/common';
import { BasketStoreService } from '../../../common/services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from '../../../common/services/basket-store/basket-store.provider';
import { CartTypeDefinition } from '../../../common/providers/commercetools/custom-type/cart-type-definition';
import { LineItemTypeDefinition } from '../../../common/providers/commercetools/custom-type/line-item-type-definition';
import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
} from '../../../common/providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { EagleEyeApiException } from '../../../common/exceptions/eagle-eye-api.exception';
import { EagleEyePluginException } from '../../../common/exceptions/eagle-eye-plugin.exception';
import {
  Cart,
  CartReference,
  ExtensionInput,
} from '@commercetools/platform-sdk';
import { CTActionsBuilder } from '../../../common/providers/commercetools/actions/ActionsBuilder';
import { LineItemCustomTypeActionBuilder } from '../../../common/providers/commercetools/actions/cart-update/LineItemCustomTypeActionBuilder';
import { CartDiscountActionBuilder } from '../../../common/providers/commercetools/actions/cart-update/CartDiscountActionBuilder';

@Injectable()
export class CartErrorService {
  private readonly logger = new Logger(CartErrorService.name);

  constructor(
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
    private cartTypeDefinition: CartTypeDefinition,
    private lineItemTypeDefinition: LineItemTypeDefinition,
  ) {}

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

  async handleError(error, body: ExtensionInput, cart: Cart) {
    const errors: CustomFieldError[] = [];

    if (error) {
      this.logger.error(error, error.stack);
      errors.push(this.getErrorDetails(error));
    }

    if (this.basketStoreService.isEnabled(body.resource as CartReference)) {
      try {
        await this.basketStoreService.delete(body.resource.id);
      } catch (errorDelete) {
        this.logger.error('Error deleting stored enriched basket', errorDelete);
      }
    }

    const actionBuilder = new CTActionsBuilder();

    if (CartCustomTypeActionBuilder.checkResourceCustomType(cart)) {
      actionBuilder.addAll([
        ...CartCustomTypeActionBuilder.setCustomFields({
          errors,
          discountDescriptions: [],
        }),
        ...LineItemCustomTypeActionBuilder.setCustomFields(
          {},
          cart.lineItems.filter((lineItem) => lineItem.custom?.type),
        ),
        ...LineItemCustomTypeActionBuilder.addCustomType(
          {},
          cart.lineItems.filter((lineItem) => !lineItem.custom?.type),
          this.lineItemTypeDefinition.getTypeKey(),
        ),
      ]);
    } else {
      actionBuilder.addAll([
        CartCustomTypeActionBuilder.addCustomType(
          { errors },
          this.cartTypeDefinition.getTypeKey(),
        ),
        ...LineItemCustomTypeActionBuilder.setCustomFields(
          {},
          cart.lineItems.filter((lineItem) => lineItem.custom?.type),
        ),
        ...LineItemCustomTypeActionBuilder.addCustomType(
          {},
          cart.lineItems.filter((lineItem) => !lineItem.custom?.type),
          this.lineItemTypeDefinition.getTypeKey(),
        ),
      ]);
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
