import * as nock from 'nock';
import { CTCartToEEBasketMapper } from '../../../src/common/mappers/ctCartToEeBasket.mapper';

export const nockWalletOpen = (
  times = 1,
  responseCode = 200,
  delayConnection = 0,
  cart,
) => {
  const basketMapper = new CTCartToEEBasketMapper();
  return nock('https://pos.sandbox.uk.eagleeye.com:443', {
    encodedQueryParams: true,
  })
    .post('/connect/wallet/open', {
      reference: cart.id,
      lock: false,
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      options: {
        adjustBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
        analyseBasket: {
          includeOpenOffers: true,
          enabled: true,
        },
      },
      basket: {
        type: 'STANDARD',
        summary: {
          redemptionChannel: 'Online',
          totalDiscountAmount: {
            general: null,
            staff: null,
            promotions: 0,
          },
          totalItems: cart.lineItems.length,
          totalBasketValue: cart.totalPrice.centAmount,
        },
        contents: basketMapper.mapCartLineItemsToBasketContent(cart.lineItems),
      },
    })
    .times(times)
    .delayConnection(delayConnection)
    .reply(
      responseCode,
      {
        wallet: null,
        identity: null,
        accounts: [],
        additionalEntities: null,
        walletTransactions: [],
        accountTransactions: [],
        analyseBasketResults: {
          basket: {
            type: 'STANDARD',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: {
                general: null,
                staff: null,
                promotions: 300,
              },
              totalItems: cart.lineItems.length,
              totalBasketValue: cart.totalPrice.centAmount,
              adjustmentResults: [{ value: 200 }],
            },
            contents: [
              {
                upc: '245865',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 100,
                  },
                ],
              },
            ],
          },
          discount: [
            {
              campaignName: 'Example Discount',
            },
          ],
        },
        basketAdjudicationResult: null,
        spendAdjudicationResults: null,
      },
      [],
    );
};