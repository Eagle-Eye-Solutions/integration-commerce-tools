import { Injectable, Logger } from '@nestjs/common';
import { BasketLocation, BasketStoreService } from './basket-store.interface';
import { CustomObjectService } from '../../providers/commercetools/custom-object/custom-object.service';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../../common/constants/constants';
import { EagleEyePluginException } from '../../common/exceptions/eagle-eye-plugin.exception';
import * as nock from 'nock';

/**
 * Stores EagleEye basket in commercetools custom objects
 */
@Injectable()
export class CtBasketStoreService implements BasketStoreService {
  private readonly logger = new Logger(CtBasketStoreService.name);

  constructor(private readonly customObjectService: CustomObjectService) {}

  async save(eeBasket: any, ctCartId: string): Promise<BasketLocation> {
    try {
      console.log('pending mocks', nock.pendingMocks());
      const result = await this.customObjectService.saveCustomObject(
        ctCartId,
        CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        {
          enrichedBasket: eeBasket,
          cart: { typeId: 'cart', id: ctCartId },
        },
      );
      return {
        storeType: 'CUSTOM_TYPE',
        uri: `custom-objects/${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/${result.body.key}`,
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
    //TODO handle exceptions with exception handler and add error to eagleeye-errors field
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
