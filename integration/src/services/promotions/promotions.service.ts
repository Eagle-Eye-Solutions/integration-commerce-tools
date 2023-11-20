import { Injectable } from '@nestjs/common';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { Reference, DirectDiscountDraft } from '@commercetools/platform-sdk';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import { CircuitBreakerIntercept } from '../../decorators/circuit-breaker-intercept/circuit-breaker-intercept.decorator';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';
import { DiscountDescription } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';

@Injectable()
export class PromotionsService {
  public cartToBasketMapper = new CTCartToEEBasketMapper();

  constructor(
    private eagleEyeClient: EagleEyeApiClient,
    readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  async getBasketLevelDiscounts(cartReference: Reference): Promise<{
    discounts: DirectDiscountDraft[];
    discountDescriptions: DiscountDescription[];
  }> {
    const discountDrafts: DirectDiscountDraft[] = [];
    let discountDescriptions: DiscountDescription[] = [];

    const cart = (cartReference as any).obj;

    const walletOpenResponse = await this.walletInvoke(
      'open',
      this.cartToBasketMapper.mapCartToWalletOpenPayload(cart),
    );
    if (
      walletOpenResponse.analyseBasketResults?.basket?.summary
        ?.totalDiscountAmount &&
      walletOpenResponse.analyseBasketResults?.basket.summary
        .totalDiscountAmount.promotions
    ) {
      const cartDiscount =
        this.cartToBasketMapper.mapAdjustedBasketToCartDirectDiscount(
          walletOpenResponse.analyseBasketResults?.basket,
          cart,
        );
      discountDrafts.push(cartDiscount);
      if (walletOpenResponse.analyseBasketResults.discount?.length) {
        const descriptions =
          this.cartToBasketMapper.mapBasketDiscountsToDiscountDescriptions(
            walletOpenResponse.analyseBasketResults.discount,
          );
        discountDescriptions = discountDescriptions.concat(descriptions);
      }
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
