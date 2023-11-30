import { Provider } from '@nestjs/common';
import { CtBasketStoreService } from './ct-basket-store.service';

export const BASKET_STORE_SERVICE = Symbol('BasketStoreService');

export const BasketStoreServiceProvider: Provider = {
  provide: BASKET_STORE_SERVICE,
  useClass: CtBasketStoreService,
};
