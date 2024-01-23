import { Injectable, Logger } from '@nestjs/common';
import { BasketLocation, BasketStoreService } from './basket-store.interface';
import { CustomObjectService } from '../../providers/commercetools/custom-object/custom-object.service';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../../constants/constants';
import { EagleEyePluginException } from '../../exceptions/eagle-eye-plugin.exception';
import { ConfigService } from '@nestjs/config';
import { Cart, Order, CartReference } from '@commercetools/platform-sdk';
import {
  FIELD_EAGLEEYE_ACTION,
  FIELD_EAGLEEYE_BASKET_STORE,
  FIELD_EAGLEEYE_BASKET_URI,
} from '../../providers/commercetools/custom-type/cart-type-definition';

/**
 * Stores EagleEye basket in commercetools custom objects
 */
@Injectable()
export class CtBasketStoreService implements BasketStoreService {
  private readonly logger = new Logger(CtBasketStoreService.name);
  private readonly storeBasketCustomObject = this.configService.get(
    'eagleEye.storeBasketCustomObject',
  );

  constructor(
    private readonly customObjectService: CustomObjectService,
    private readonly configService: ConfigService,
  ) {}

  isEnabled(reference: CartReference) {
    return (
      reference.typeId === 'cart' &&
      (this.storeBasketCustomObject ||
        (reference.obj.custom?.fields &&
          reference.obj.custom?.fields[FIELD_EAGLEEYE_ACTION] ===
            'SAVE_BASKET'))
    );
  }

  hasSavedBasket(resource: Cart | Order) {
    return (
      resource.custom.fields &&
      resource.custom.fields[FIELD_EAGLEEYE_BASKET_STORE] === 'CUSTOM_TYPE' &&
      resource.custom.fields[FIELD_EAGLEEYE_BASKET_URI]
    );
  }

  async save(eeBasket: any, ctCartId: string): Promise<BasketLocation> {
    try {
      const result = await this.customObjectService.saveCustomObject(
        ctCartId,
        CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        {
          enrichedBasket: eeBasket,
          cart: { typeId: 'cart', id: ctCartId },
        },
      );
      this.logger.log(
        `Saved EagleEye enriched basket to: 'custom-objects/${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/${result.body.key}'`,
      );
      return {
        storeType: 'CUSTOM_TYPE',
        uri: `custom-objects/${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/{cart-id}`,
      };
    } catch (e) {
      this.logger.error(
        `Error saving custom object to ${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/${ctCartId}`,
        e,
      );
      throw new EagleEyePluginException(
        'BASKET_STORE_SAVE',
        'Error saving enriched basket',
      );
    }
  }

  async get(ctCartId: string): Promise<any> {
    try {
      const result = await this.customObjectService.getCustomObject(
        CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        ctCartId,
      );
      this.logger.log(
        `Got EagleEye enriched basket from: 'custom-objects/${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/${result.body.key}'`,
      );
      return result.body.value;
    } catch (e) {
      this.logger.error(
        `Error getting custom object from ${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/${ctCartId}`,
        e,
      );
      throw new EagleEyePluginException(
        'BASKET_STORE_GET',
        'Error getting enriched basket',
      );
    }
  }

  async delete(ctCartId: string): Promise<void> {
    try {
      await this.customObjectService.deleteCustomObject(
        CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        ctCartId,
      );
    } catch (e) {
      this.logger.error(
        `Error deleting custom object ${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/${ctCartId}`,
        e,
      );
      throw new EagleEyePluginException(
        'BASKET_STORE_DELETE',
        'Error deleting enriched basket',
      );
    }
  }
}
