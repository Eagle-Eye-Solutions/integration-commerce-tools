import { Injectable, Inject, Logger } from '@nestjs/common';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { CTCartToEEBasketMapper } from '../../common/mappers/ctCartToEeBasket.mapper';
import { CircuitBreakerIntercept } from '../../decorators/circuit-breaker-intercept/circuit-breaker-intercept.decorator';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { Order, OrderUpdateAction } from '@commercetools/platform-sdk';
import { BASKET_STORE_SERVICE } from '../basket-store/basket-store.provider';
import { BasketStoreService } from '../basket-store/basket-store.interface';
import { EagleEyePluginException } from '../../common/exceptions/eagle-eye-plugin.exception';
import {
  FIELD_EAGLEEYE_ACTION,
  FIELD_EAGLEEYE_BASKET_STORE,
  FIELD_EAGLEEYE_BASKET_URI,
  FIELD_EAGLEEYE_SETTLED_STATUS,
} from '../../providers/commercetools/custom-type/custom-type-definitions';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';

@Injectable()
export class OrderSettleService {
  private readonly logger = new Logger(OrderSettleService.name);

  constructor(
    readonly commercetools: Commercetools,
    readonly cartToBasketMapper: CTCartToEEBasketMapper,
    readonly eagleEyeClient: EagleEyeApiClient,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
    private circuitBreakerService: CircuitBreakerService,
  ) {}

  async settleTransactionFromOrder(
    ctOrder: Order,
  ): Promise<OrderUpdateAction[]> {
    this.logger.log(
      `Attempting to settle transaction for order ${ctOrder.id} / cart ${ctOrder.cart.id}.`,
    );
    // Delete basket custom object after transaction is settled successfully
    if (this.basketStoreService.hasSavedBasket(ctOrder)) {
      // TODO: handle known settle errors returned with 2XX responses
      await this.walletSettleInvoke(
        'settle',
        await this.cartToBasketMapper.mapOrderToWalletSettlePayload(
          ctOrder.cart.id,
        ),
      );
      try {
        this.logger.log(
          `Attempting to delete stored basket for order ${ctOrder.id} / cart ${ctOrder.cart.id}..`,
        );
        await this.basketStoreService.delete(ctOrder.cart.id);
      } catch (errorDelete) {
        if (errorDelete instanceof EagleEyePluginException) {
          const { type, message } = errorDelete;
          this.logger.error({ type, message });
        }
      }

      // Mark as settled and remove action/stored basket
      // Attempt to remove fields conditionally.
      // Trying to remove non-existant fields throws InvalidOperation error.
      const actions: any = [
        {
          action: 'setCustomField',
          name: FIELD_EAGLEEYE_SETTLED_STATUS,
          value: 'SETTLED',
        },
      ];
      const fieldsToRemove = [
        FIELD_EAGLEEYE_ACTION,
        FIELD_EAGLEEYE_BASKET_STORE,
        FIELD_EAGLEEYE_BASKET_URI,
      ];
      fieldsToRemove.forEach((field) => {
        if (ctOrder.custom.fields[field]) {
          actions.push({
            action: 'setCustomField',
            name: field,
          });
        }
      });
      return actions;
    }
    this.logger.log(
      `Transaction for order ${ctOrder.id} / cart ${ctOrder.cart.id} is already settled.`,
    );
    return [];
  }

  @CircuitBreakerIntercept()
  async walletSettleInvoke(method, args) {
    return await this.eagleEyeClient.wallet.invoke(method, args);
  }
}