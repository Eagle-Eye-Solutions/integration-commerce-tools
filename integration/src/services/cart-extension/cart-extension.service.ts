import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
} from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { EagleEyeApiException } from '../../common/exceptions/eagle-eye-api.exception';
import {
  ActionsSupported,
  CTActionsBuilder,
} from '../../providers/commercetools/actions/ActionsBuilder';
import { CartDiscountActionBuilder } from '../../providers/commercetools/actions/cart-update/CartDiscountActionBuilder';
import { PromotionService } from '../promotion/promotion.service';
import {
  Cart,
  CartReference,
  ExtensionInput,
} from '@commercetools/platform-sdk';
import { BasketStoreService } from '../../services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from '../../services/basket-store/basket-store.provider';
import { EagleEyePluginException } from '../../common/exceptions/eagle-eye-plugin.exception';
import { CartTypeDefinition } from '../../providers/commercetools/custom-type/cart-type-definition';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import { CircuitBreakerIntercept } from '../../decorators/circuit-breaker-intercept/circuit-breaker-intercept.decorator';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';
import { LoyaltyService } from '../../services/loyalty/loyalty.service';
import { LineItemCustomTypeActionBuilder } from '../../providers/commercetools/actions/cart-update/LineItemCustomTypeActionBuilder';
import { LineItemTypeDefinition } from '../../providers/commercetools/custom-type/line-item-type-definition';

@Injectable()
export class CartExtensionService {
  private readonly logger = new Logger(CartExtensionService.name);

  constructor(
    private promotionService: PromotionService,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
    private cartTypeDefinition: CartTypeDefinition,
    private lineItemTypeDefinition: LineItemTypeDefinition,
    readonly cartToBasketMapper: CTCartToEEBasketMapper,
    readonly circuitBreakerService: CircuitBreakerService,
    private loyaltyService: LoyaltyService,
  ) {}

  async handleCartExtensionRequest(body: ExtensionInput): Promise<{
    actions: ActionsSupported[];
  }> {
    this.logger.log({
      message: 'Received body: ',
      context: CartExtensionService.name,
      body,
    });
    const cartReference: CartReference = body?.resource as any;
    const cart: Cart = cartReference?.obj;

    try {
      const actionBuilder = new CTActionsBuilder();
      await this.applyCartExtensionUpdates(actionBuilder, cartReference);
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

  async applyCartExtensionUpdates(
    actionBuilder: CTActionsBuilder,
    cartReference: CartReference,
  ) {
    const resourceObj = cartReference.obj;
    const walletOpenResponse = await this.attemptToOpenWallet(cartReference);
    const basketDiscounts = await this.promotionService.getDiscounts(
      walletOpenResponse.payload,
      cartReference,
    );
    const loyaltyEarnAndCredits = await this.loyaltyService.getEarnAndCredits(
      walletOpenResponse.payload,
    );

    let basketLocation = null;
    if (this.basketStoreService.isEnabled(cartReference as CartReference)) {
      basketLocation = await this.basketStoreService.save(
        basketDiscounts.enrichedBasket,
        cartReference.id,
      );
    }

    if (CartCustomTypeActionBuilder.checkResourceCustomType(resourceObj)) {
      actionBuilder.addAll([
        ...CartCustomTypeActionBuilder.setCustomFields({
          errors: [...walletOpenResponse.errors, ...basketDiscounts.errors],
          discountDescriptions: [...basketDiscounts.discountDescriptions],
          voucherCodes: basketDiscounts.voucherCodes,
          potentialVoucherCodes: basketDiscounts.potentialVoucherCodes,
          basketLocation,
          loyaltyEarnAndCredits: {
            earn: loyaltyEarnAndCredits.earn,
            credit: { basket: loyaltyEarnAndCredits.credit.basket },
          },
        }),
        ...LineItemCustomTypeActionBuilder.setCustomFields(
          { loyaltyCredits: loyaltyEarnAndCredits.credit.items },
          resourceObj.lineItems,
        ),
      ]);
    } else {
      actionBuilder.addAll([
        CartCustomTypeActionBuilder.addCustomType(
          {
            errors: [...walletOpenResponse.errors, ...basketDiscounts.errors],
            discountDescriptions: [...basketDiscounts.discountDescriptions],
            voucherCodes: basketDiscounts.voucherCodes,
            potentialVoucherCodes: basketDiscounts.potentialVoucherCodes,
            basketLocation,
            loyaltyEarnAndCredits: {
              earn: loyaltyEarnAndCredits.earn,
              credit: { basket: loyaltyEarnAndCredits.credit.basket },
            },
          },
          this.cartTypeDefinition.getTypeKey(),
        ),
        ...LineItemCustomTypeActionBuilder.addCustomType(
          { loyaltyCredits: loyaltyEarnAndCredits.credit.items },
          resourceObj.lineItems,
          this.lineItemTypeDefinition.getTypeKey(),
        ),
      ]);
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

  async attemptToOpenWallet(cartReference: CartReference) {
    let walletOpenResponse;
    let eeWalletOpenRequest;
    const errors = [];
    try {
      eeWalletOpenRequest =
        await this.cartToBasketMapper.mapCartToWalletOpenPayload(
          cartReference.obj,
          true,
        );
      this.logger.debug({
        message: 'Sending open request to EagleEye with body',
        eeWalletOpenRequest,
      });
      walletOpenResponse = await this.walletInvoke('open', eeWalletOpenRequest);
    } catch (error) {
      this.logger.warn('Error while opening the wallet', error);
      if (error.type === 'EE_IDENTITY_NOT_FOUND') {
        const errorMessage =
          cartReference.obj.custom?.fields['eagleeye-identityValue'] +
          ' - Customer identity not found';

        this.logger.warn(errorMessage);
        const unidentifiedCustomerError: CustomFieldError = {
          type: 'EE_API_CUSTOMER_NF',
          message: errorMessage,
          context: error,
        };
        errors.push(unidentifiedCustomerError);
        try {
          this.logger.warn(
            'Attempting to fetch open promotions without identity',
          );
          eeWalletOpenRequest =
            await this.cartToBasketMapper.mapCartToWalletOpenPayload(
              cartReference.obj,
              false,
            );
          this.logger.debug({
            message: 'Sending open request to EagleEye with body',
            eeWalletOpenRequest,
          });
          walletOpenResponse = await this.walletInvoke(
            'open',
            eeWalletOpenRequest,
          );
        } catch (error) {
          throw error;
        }
      } else {
        throw error;
      }
    }
    return { payload: walletOpenResponse, errors };
  }

  @CircuitBreakerIntercept()
  async walletInvoke(method, args): Promise<any> {
    // Call will be rewriten by CircuitBreakerIntercept, output doesn't matter
    return { method, args };
  }
}
