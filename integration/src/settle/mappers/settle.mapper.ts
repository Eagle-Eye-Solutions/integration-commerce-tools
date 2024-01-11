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
    const incomingIdentifier = this.configService.get(
      'eagleEye.incomingIdentifier',
    );
    const parentIncomingIdentifier = this.configService.get(
      'eagleEye.parentIncomingIdentifier',
    );

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
