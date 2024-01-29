import { Inject, Injectable, Logger } from '@nestjs/common';
import { SettleMapper } from '../../mappers/settle.mapper';
import { EagleEyeApiClient } from '../../../common/providers/eagleeye/eagleeye.provider';
import { Order, OrderUpdateAction } from '@commercetools/platform-sdk';
import { BASKET_STORE_SERVICE } from '../../../common/services/basket-store/basket-store.provider';
import { BasketStoreService } from '../../../common/services/basket-store/basket-store.interface';
import { EagleEyePluginException } from '../../../common/exceptions/eagle-eye-plugin.exception';
import {
  FIELD_EAGLEEYE_ACTION,
  FIELD_EAGLEEYE_BASKET_STORE,
  FIELD_EAGLEEYE_BASKET_URI,
  FIELD_EAGLEEYE_ERRORS,
  FIELD_EAGLEEYE_SETTLED_STATUS,
} from '../../../common/providers/commercetools/custom-type/cart-type-definition';
import { Commercetools } from '../../../common/providers/commercetools/commercetools.provider';

@Injectable()
export class OrderSettleService {
  private readonly logger = new Logger(OrderSettleService.name);

  constructor(
    readonly settleMapper: SettleMapper,
    readonly eagleEyeClient: EagleEyeApiClient,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
  ) {}

  async settleTransactionFromOrder(
    ctOrder: Order,
  ): Promise<OrderUpdateAction[]> {
    this.logger.log(
      `Attempting to settle transaction for order ${ctOrder.id} / cart ${ctOrder.cart.id}.`,
    );
    // Delete basket custom object after transaction is settled successfully
    if (this.basketStoreService.hasSavedBasket(ctOrder)) {
      const walletSettleResponse = await this.walletSettleInvoke(
        'settle',
        await this.settleMapper.mapOrderToWalletSettlePayload(ctOrder),
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
      if (walletSettleResponse.status === 207) {
        const currentErrors =
          ctOrder.custom?.fields[FIELD_EAGLEEYE_ERRORS] || [];
        actions.push({
          action: 'setCustomField',
          name: FIELD_EAGLEEYE_ERRORS,
          value: [
            ...currentErrors,
            JSON.stringify({
              type: 'EE_API_SETTLE_POTENTIAL_ISSUES',
              message:
                'EagleEye transaction settle was processed successfully, but there might be issues.',
            }),
          ],
        });
      }
      return actions;
    }
    this.logger.log(
      `Transaction for order ${ctOrder.id} / cart ${ctOrder.cart.id} is already settled.`,
    );
    return [];
  }

  getSettleErrorActions(ctOrder: Order, error: any): OrderUpdateAction[] {
    const currentErrors = ctOrder.custom?.fields[FIELD_EAGLEEYE_ERRORS] || [];
    return [
      {
        action: 'setCustomField',
        name: FIELD_EAGLEEYE_SETTLED_STATUS,
        value: 'ERROR',
      },
      {
        action: 'setCustomField',
        name: FIELD_EAGLEEYE_ERRORS,
        value: [
          ...currentErrors,
          JSON.stringify({
            type: 'EE_API_SETTLE_ERROR',
            message: 'EagleEye transaction could not be settled.',
            context: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          }),
        ],
      },
    ];
  }

  canBeSettled(order: Order, processor: string): boolean {
    let orderSettleAction;
    let orderSettledStatus;
    const orderPaymentState = order.paymentState;
    if (order.custom?.fields) {
      orderSettleAction = order.custom?.fields[FIELD_EAGLEEYE_ACTION];
      orderSettledStatus = order.custom?.fields[FIELD_EAGLEEYE_SETTLED_STATUS];
    }
    switch (processor) {
      case 'OrderCreatedWithPaidState':
        return (
          Boolean(orderPaymentState === 'Paid') &&
          Boolean(orderSettledStatus !== 'SETTLED')
        );
      case 'OrderCreatedWithSettleAction':
      case 'OrderUpdatedWithSettleAction':
        return (
          Boolean(orderSettleAction === 'SETTLE') &&
          Boolean(orderSettledStatus !== 'SETTLED')
        );
      default:
        return false;
    }
  }

  async getGenericSettleActions(
    order: Order,
    commercetools: Commercetools,
  ): Promise<(() => any)[]> {
    const actions = [];
    actions.push(async () => {
      let updateActions = [];
      let settleError;
      try {
        updateActions = await this.settleTransactionFromOrder(order);
      } catch (err) {
        updateActions = this.getSettleErrorActions(order, err);
        settleError = err;
      }
      await commercetools.updateOrderById(order.id, {
        version: order.version,
        actions: updateActions,
      });
      if (settleError !== undefined) {
        throw settleError;
      }
    });
    return actions;
  }

  async walletSettleInvoke(method, args) {
    return await this.eagleEyeClient.wallet.invoke(method, args);
  }
}
