import { Cart, Order, CartReference } from '@commercetools/platform-sdk';

export type BasketLocation = {
  uri: string;
  storeType: 'CUSTOM_TYPE' | 'S3';
};

export interface BasketStoreService {
  /**
   * Persists the eagleEye enriched basket with the related id of the commercetools cart that generated it
   * @param eeBasket the eagleEye enriched basket
   * @param ctCartId the commercetools cart ID
   */
  save(eeBasket: any, ctCartId: string): Promise<BasketLocation>;

  /**
   * Gets the eagleEye enriched basket with the related id of the commercetools cart that generated it
   * @param ctCartId the commercetools cart ID
   */
  get(ctCartId: string): Promise<any>;

  /**
   * Deleted the eagleEye enriched basked given the related commercetools cart ID
   * @param ctCartID the commercetools cart ID
   */
  delete(ctCartID: string): Promise<void>;

  /**
   * Returns true if the basket should be stored, false otherwise
   */
  isEnabled(reference: CartReference): boolean;

  /**
   * Returns true if the basket has been previously saved, false otherwise
   */
  hasSavedBasket(resource: Cart | Order): boolean;
}
