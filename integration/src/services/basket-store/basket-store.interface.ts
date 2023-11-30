import { Cart } from '@commercetools/platform-sdk';

export type BasketLocation = {
  uri: string;
  storeType: 'CUSTOM_TYPE' | 'S3';
};

export interface BasketStoreService {
  /**
   * Persists the eagleEye enriched basket with the releated id of the commercetools cart that generated it
   * @param eeBasket the eagleEye enriched basket
   * @param ctCartId the commercetools cart ID
   */
  save(eeBasket: any, ctCartId: string): Promise<BasketLocation>;

  /**
   * Deleted the eagleEye enriched basked given the related commercetools cart ID
   * @param ctCartID the commercetools cart ID
   */
  delete(ctCartID: string): Promise<void>;

  /**
   * Returns true if the basket should be stored, false otherwise
   */
  isEnabled(cart: Cart): boolean;
}
