import { Injectable, Inject } from '@nestjs/common';
import { Order } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { BasketStoreService } from '../../common/services/basket-store/basket-store.interface';
import { BASKET_STORE_SERVICE } from '../../common/services/basket-store/basket-store.provider';

@Injectable()
export class SettleMapper {
  constructor(
    readonly configService: ConfigService,
    @Inject(BASKET_STORE_SERVICE)
    private readonly basketStoreService: BasketStoreService,
  ) {}

  async mapOrderToWalletSettlePayload(order: Order) {
    const configIncomingIdentifier = this.configService.get(
      'eagleEye.incomingIdentifier',
    );
    const configParentIncomingIdentifier = this.configService.get(
      'eagleEye.parentIncomingIdentifier',
    );
    const incomingIdentifier = order.custom?.fields
      ? order.custom?.fields['eagleeye-incomingIdentifier'] ||
        configIncomingIdentifier
      : configIncomingIdentifier;
    const parentIncomingIdentifier = order.custom?.fields
      ? order.custom?.fields['eagleeye-parentIncomingIdentifier'] ||
        configParentIncomingIdentifier
      : configParentIncomingIdentifier;

    const identity = order.custom?.fields['eagleeye-identityValue'];

    const enrichedBasket = (await this.basketStoreService.get(order.cart.id))
      .enrichedBasket;

    return {
      mode: 'ACTIVE',
      reference: order.cart.id,
      ...(identity ? { identity: { identityValue: identity } } : {}),
      location: {
        incomingIdentifier,
        ...(parentIncomingIdentifier && { parentIncomingIdentifier }),
      },
      basket: enrichedBasket,
    };
  }
}
