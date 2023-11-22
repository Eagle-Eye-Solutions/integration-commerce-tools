import * as nock from 'nock';
import { CTCartToEEBasketMapper } from '../../../src/common/mappers/ctCartToEeBasket.mapper';

import { Commercetools } from '../../../src/providers/commercetools/commercetools.provider';
import { ScriptConfigService } from '../../../src/config/configuration';

export const nockWalletOpen = async (
  times = 1,
  responseCode = 200,
  delayConnection = 0,
  cart,
) => {
  const configService = new ScriptConfigService();
  const commercetools = new Commercetools(configService as any);
  const basketMapper = new CTCartToEEBasketMapper(
    configService as any,
    commercetools,
  );
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
        contents: [
          ...basketMapper.mapCartLineItemsToBasketContent(cart.lineItems),
          ...(await basketMapper.mapShippingMethodSkusToBasketItems(
            cart.shippingInfo,
          )),
        ],
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
              {
                upc: '245879',
                adjustmentResults: [
                  {
                    totalDiscountAmount: 250,
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
