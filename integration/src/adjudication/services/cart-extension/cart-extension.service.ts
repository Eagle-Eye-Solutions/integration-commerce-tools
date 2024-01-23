import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
} from '../../../common/providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import {
  ActionsSupported,
  CTActionsBuilder,
} from '../../../common/providers/commercetools/actions/ActionsBuilder';
import { CartDiscountActionBuilder } from '../../../common/providers/commercetools/actions/cart-update/CartDiscountActionBuilder';
import { PromotionService } from '../promotion/promotion.service';
import {
  Cart,
  CartReference,
  ExtensionInput,
} from '@commercetools/platform-sdk';
import { BasketStoreService } from '../../../common/services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from '../../../common/services/basket-store/basket-store.provider';
import { CartTypeDefinition } from '../../../common/providers/commercetools/custom-type/cart-type-definition';
import { AdjudicationMapper } from '../../mappers/adjudication.mapper';
import { CircuitBreakerIntercept } from '../../../common/decorators/circuit-breaker-intercept/circuit-breaker-intercept.decorator';
import { CircuitBreakerService } from '../../../common/providers/circuit-breaker/circuit-breaker.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LineItemCustomTypeActionBuilder } from '../../../common/providers/commercetools/actions/cart-update/LineItemCustomTypeActionBuilder';
import { LineItemTypeDefinition } from '../../../common/providers/commercetools/custom-type/line-item-type-definition';
import { CartErrorService } from '../cart-error/cart-error.service';

@Injectable()
export class CartExtensionService {
  private readonly logger = new Logger(CartExtensionService.name);

  constructor(
    private promotionService: PromotionService,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
    private cartTypeDefinition: CartTypeDefinition,
    private lineItemTypeDefinition: LineItemTypeDefinition,
    readonly adjudicationMapper: AdjudicationMapper,
    readonly circuitBreakerService: CircuitBreakerService,
    private loyaltyService: LoyaltyService,
    private cartErrorService: CartErrorService,
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
      return await this.cartErrorService.handleError(error, body, cart);
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
          discountDescriptions: [...basketDiscounts.basketDiscountDescriptions],
          voucherCodes: basketDiscounts.voucherCodes,
          potentialVoucherCodes: basketDiscounts.potentialVoucherCodes,
          basketLocation,
          loyaltyEarnAndCredits: {
            earn: loyaltyEarnAndCredits.earn,
            credit: { basket: loyaltyEarnAndCredits.credit.basket },
          },
        }),
        ...LineItemCustomTypeActionBuilder.setCustomFields(
          {
            loyaltyCredits: loyaltyEarnAndCredits.credit.items,
            promotions: {
              appliedDiscounts: basketDiscounts.lineItemsDiscountDescriptions,
            },
          },
          resourceObj.lineItems.filter((lineItem) => lineItem.custom?.type),
        ),
        ...LineItemCustomTypeActionBuilder.addCustomType(
          {
            loyaltyCredits: loyaltyEarnAndCredits.credit.items,
            promotions: {
              appliedDiscounts: basketDiscounts.lineItemsDiscountDescriptions,
            },
          },
          resourceObj.lineItems.filter((lineItem) => !lineItem.custom?.type),
          this.lineItemTypeDefinition.getTypeKey(),
        ),
      ]);
    } else {
      actionBuilder.addAll([
        CartCustomTypeActionBuilder.addCustomType(
          {
            errors: [...walletOpenResponse.errors, ...basketDiscounts.errors],
            discountDescriptions: [
              ...basketDiscounts.basketDiscountDescriptions,
            ],
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
        ...LineItemCustomTypeActionBuilder.setCustomFields(
          {
            loyaltyCredits: loyaltyEarnAndCredits.credit.items,
            promotions: {
              appliedDiscounts: basketDiscounts.lineItemsDiscountDescriptions,
            },
          },
          resourceObj.lineItems.filter((lineItem) => lineItem.custom?.type),
        ),
        ...LineItemCustomTypeActionBuilder.addCustomType(
          {
            loyaltyCredits: loyaltyEarnAndCredits.credit.items,
            promotions: {
              appliedDiscounts: basketDiscounts.lineItemsDiscountDescriptions,
            },
          },
          resourceObj.lineItems.filter((lineItem) => !lineItem.custom?.type),
          this.lineItemTypeDefinition.getTypeKey(),
        ),
      ]);
    }
    actionBuilder.add(
      CartDiscountActionBuilder.addDiscount([...basketDiscounts.discounts]),
    );
  }

  async attemptToOpenWallet(cartReference: CartReference) {
    let walletOpenResponse;
    let eeWalletOpenRequest;
    const errors = [];
    try {
      eeWalletOpenRequest =
        await this.adjudicationMapper.mapCartToWalletOpenPayload(
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
            await this.adjudicationMapper.mapCartToWalletOpenPayload(
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
