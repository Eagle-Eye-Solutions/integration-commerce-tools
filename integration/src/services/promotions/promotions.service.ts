import { Injectable, Logger } from '@nestjs/common';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { Reference, DirectDiscountDraft } from '@commercetools/platform-sdk';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { ConfigService } from '@nestjs/config';
import { CartToBasketMapper } from '../../common/mappers/cartToBasket.mapper';
import { CircuitBreakerIntercept } from '../../decorators/circuit-breaker-intercept/circuit-breaker-intercept.decorator';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';
import { DiscountDescription } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';

@Injectable()
export class PromotionsService {
  public basketMapper = new CartToBasketMapper();

  constructor(
    private configService: ConfigService,
    private commercetools: Commercetools,
    private eagleEyeClient: EagleEyeApiClient,
    readonly circuitBreakerService: CircuitBreakerService,
    private logger: Logger,
  ) {}

  async getBasketLevelDiscounts(cartReference: Reference): Promise<{
    discounts: DirectDiscountDraft[];
    discountDescriptions: DiscountDescription[];
  }> {
    const discountDrafts: DirectDiscountDraft[] = [];
    let discountDescriptions: DiscountDescription[] = [];

    const cart = (cartReference as any).obj;

    // Get a default identity to open the wallet
    // TODO: make configurable on a per-merchant basis
    const identities = [];
    if (cart.customerEmail) {
      identities.push({
        type: 'CUSTOMER_ID',
        value: cart.customerEmail,
      });
    }

    const walletOpenResponse = await this.walletInvoke('open', {
      reference: cart.id,
      identity: identities[0]
        ? {
            identityValue: identities[0].value,
          }
        : undefined,
      lock: false,
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      options: {
        adjustBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
        analyseBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
      },
      basket: {
        type: 'STANDARD',
        summary: {
          redemptionChannel: 'Online',
          totalDiscountAmount: {
            general: null,
            staff: null,
            promotions: 0,
          },
          totalItems: cart.lineItems.length,
          totalBasketValue: cart.totalPrice.centAmount,
        },
        contents: this.basketMapper.mapCartLineItemsToBasketContent(
          cart.lineItems,
        ),
      },
    });
    if (
      walletOpenResponse.analyseBasketResults?.basket?.summary
        ?.totalDiscountAmount
    ) {
      if (
        walletOpenResponse.analyseBasketResults?.basket.summary
          .totalDiscountAmount.promotions
      ) {
        const cartDiscount =
          this.basketMapper.mapAdjustedBasketToCartDirectDiscount(
            walletOpenResponse.analyseBasketResults?.basket,
            cart,
          );
        discountDrafts.push(cartDiscount);
        if (walletOpenResponse.analyseBasketResults.discount?.length) {
          const descriptions =
            this.basketMapper.mapBasketDiscountsToDiscountDescriptions(
              walletOpenResponse.analyseBasketResults.discount,
            );
          discountDescriptions = discountDescriptions.concat(descriptions);
        }
      }

      // const itemDiscounts =
      //   this.basketMapper.mapAdjustedBasketToItemDirectDiscounts(
      //     walletOpenResponse.analyseBasketResults?.basket,
      //     cart,
      //   );
      // if (itemDiscounts.length) {
      //   discountDrafts = discountDrafts.concat(itemDiscounts);
      // }
    }

    return {
      discounts: discountDrafts,
      discountDescriptions,
    };
  }

  @CircuitBreakerIntercept()
  async walletInvoke(method, args) {
    return await this.eagleEyeClient.wallet.invoke(method, args);
  }
}
