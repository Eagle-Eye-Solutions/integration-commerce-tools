import * as nock from 'nock';
import { CTCartToEEBasketMapper } from '../../../src/common/mappers/ctCartToEeBasket.mapper';

import { Commercetools } from '../../../src/providers/commercetools/commercetools.provider';
import { ScriptConfigService } from '../../../src/config/configuration';

export const nockWalletOpen = async (
  cart,
  times = 1,
  responseCode = 200,
  delayConnection = 0,
) => {
  const configService = new ScriptConfigService();
  const commercetools = new Commercetools(configService as any);
  const basketMapper = new CTCartToEEBasketMapper(
    configService as any,
    commercetools,
  );
  const basketContents = [
    ...basketMapper.mapCartLineItemsToBasketContent(cart.lineItems),
  ];
  const shippingDiscountItem =
    await basketMapper.mapShippingMethodSkusToBasketItems(cart.shippingInfo);
  if (shippingDiscountItem.upc) {
    basketContents.push(shippingDiscountItem);
  }
  return nock('https://pos.sandbox.uk.eagleeye.com:443', {
    encodedQueryParams: true,
  })
    .post('/connect/wallet/open', {
      reference: cart.id,
      lock: true,
      location: {
        incomingIdentifier: 'outlet1',
        parentIncomingIdentifier: 'banner1',
      },
      examine: [
        {
          type: 'TOKEN',
          value: '123456',
        },
        {
          type: 'TOKEN',
          value: 'valid-code',
        },
      ],
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
        contents: basketContents,
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
              adjustmentResults: [
                { value: 200 },
                { value: 500 }, // Voucher code "123456", 5 pounds off 50 (Basket)
              ],
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
        examine: [
          {
            value: '123456',
            resourceType: null,
            resourceId: null,
            errorCode: 'PCEXNF',
            errorMessage: 'Voucher invalid: Failed to load token',
          },
          {
            value: 'valid-code',
            resourceType: null,
            resourceId: null,
            errorCode: null,
            errorMessage: null,
          },
        ],
      },
      [],
    );
};
