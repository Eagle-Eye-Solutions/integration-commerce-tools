import { Test, TestingModule } from '@nestjs/testing';
import { CTCartToEEBasketMapper } from './ctCartToEeBasket.mapper';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { ConfigService } from '@nestjs/config';
import { BASKET_STORE_SERVICE } from '../../services/basket-store/basket-store.provider';
import { BasketStoreService } from '../../services/basket-store/basket-store.interface';

describe('CTCartToEEBasketMapper', () => {
  let service: CTCartToEEBasketMapper;
  let configService: ConfigService;
  let commercetools: Commercetools;
  let basketStoreService: jest.Mocked<BasketStoreService>;

  const cart: any = {
    lineItems: [
      {
        name: {
          en: 'Example Product',
        },
        variant: {
          sku: 'SKU123',
        },
        price: {
          value: {
            centAmount: 300,
            currencyCode: 'USD',
            type: 'centPrecision',
            fractionDigits: 2,
          },
        },
        quantity: 1,
        totalPrice: {
          centAmount: 300,
          currencyCode: 'USD',
          type: 'centPrecision',
          fractionDigits: 2,
        },
      },
    ],
    totalPrice: {
      centAmount: 300,
      currencyCode: 'USD',
      type: 'centPrecision',
      fractionDigits: 2,
    },
  };
  const shippingMethodMapMock = [{ key: 'standard-key', upc: '245879' }];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CTCartToEEBasketMapper,
        {
          provide: Commercetools,
          useValue: {
            getShippingMethods: jest.fn(),
            getOrderById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: BASKET_STORE_SERVICE,
          useValue: {
            save: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            isEnabled: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CTCartToEEBasketMapper>(CTCartToEEBasketMapper);
    configService = module.get<ConfigService>(ConfigService);
    commercetools = module.get<Commercetools>(Commercetools);
    basketStoreService = module.get(BASKET_STORE_SERVICE);
    jest.spyOn(configService, 'get').mockReturnValueOnce(shippingMethodMapMock);
    jest.resetAllMocks();
  });

  describe('mapCartLineItemsToBasketContent', () => {
    it('should return the mapped line items', () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(shippingMethodMapMock);

      const lineItems = [
        {
          variant: {
            sku: 'SKU123',
          },
          price: {
            value: {
              centAmount: 1000,
            },
          },
          totalPrice: {
            centAmount: 900,
          },
          name: {
            en: 'Product 1',
          },
          quantity: 2,
        },
      ];

      const basketContents = service.mapCartLineItemsToBasketContent(
        lineItems as any,
      );

      expect(basketContents).toMatchSnapshot();
    });
  });

  describe('mapShippingMethodSkusToBasketItems', () => {
    it('should return the mapped custom basket items', async () => {
      const shippingInfo = {
        shippingMethod: {
          id: 'some-id',
        },
        price: {
          centAmount: 300,
          currencyCode: 'USD',
          type: 'centPrecision',
          fractionDigits: 2,
        },
        shippingMethodName: 'Example Shipping Discount',
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);
      jest
        .spyOn(commercetools, 'getShippingMethods')
        .mockResolvedValueOnce([{ key: 'standard-key' }] as any);

      const basketContents = await service.mapShippingMethodSkusToBasketItems(
        shippingInfo as any,
      );

      expect(basketContents).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToCartDirectDiscounts', () => {
    it('should return the direct discount draft', () => {
      const basket = {
        summary: {
          totalDiscountAmount: {
            promotions: 500,
          },
          adjustmentResults: [],
        },
      };

      const directDiscount = service.mapAdjustedBasketToCartDirectDiscounts(
        basket,
        cart,
      );

      expect(directDiscount).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToItemDirectDiscounts', () => {
    it('should return the direct discount drafts', () => {
      const basket = {
        summary: {
          totalDiscountAmount: {
            promotions: 10,
          },
        },
        contents: [
          {
            upc: 'SKU123',
            adjustmentResults: [
              {
                totalDiscountAmount: 10,
              },
            ],
          },
        ],
      };

      const directDiscounts = service.mapAdjustedBasketToItemDirectDiscounts(
        basket,
        cart,
      );

      expect(directDiscounts).toMatchSnapshot();
    });

    it('should not return the direct discount drafts if there are no adjustmentResults', () => {
      const basket = {
        summary: {
          totalDiscountAmount: {
            promotions: 10,
          },
        },
        contents: [
          {
            upc: 'SKU123',
          },
        ],
      };

      const directDiscounts = service.mapAdjustedBasketToItemDirectDiscounts(
        basket,
        cart,
      );

      expect(directDiscounts).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToShippingDirectDiscounts', () => {
    it('should return the direct discount drafts', () => {
      const basket = {
        summary: {
          totalDiscountAmount: {
            promotions: 10,
          },
        },
        contents: [
          {
            upc: '245879',
            adjustmentResults: [
              {
                totalDiscountAmount: 10,
              },
            ],
          },
        ],
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const directDiscounts =
        service.mapAdjustedBasketToShippingDirectDiscounts(basket, cart);

      expect(directDiscounts).toMatchSnapshot();
    });

    it('should not return the direct discount drafts if there are no adjustmentResults', () => {
      const basket = {
        summary: {
          totalDiscountAmount: {
            promotions: 10,
          },
        },
        contents: [
          {
            upc: '245879',
          },
        ],
      };

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(shippingMethodMapMock);

      const directDiscounts =
        service.mapAdjustedBasketToShippingDirectDiscounts(basket, cart);

      expect(directDiscounts).toMatchSnapshot();
    });
  });

  describe('mapVoucherCodesToCampaignTokens', () => {
    it('should return an array of tokens to be examined', () => {
      const voucherCodes = ['12345678'];
      const payload = service.mapVoucherCodesToCampaignTokens(voucherCodes);

      expect(payload).toMatchSnapshot();
    });

    it('should ignore empty string vouchers', () => {
      const voucherCodes = [''];
      const payload = service.mapVoucherCodesToCampaignTokens(voucherCodes);

      expect(payload).toMatchSnapshot();
    });
  });

  describe('mapCartToWalletOpenPayload', () => {
    it('should return the payload for /wallet/open', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      const payload = await service.mapCartToWalletOpenPayload(cart, false);

      expect(payload).toMatchSnapshot();
    });
  });

  describe('mapOrderToWalletSettlePayload', () => {
    it('should return the payload for /wallet/settle', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      jest.spyOn(basketStoreService, 'get').mockResolvedValueOnce({
        enrichedBasket: {
          contents: [],
        },
      });

      const payload = await service.mapOrderToWalletSettlePayload({
        id: '123456',
        cart: {
          typeId: 'cart',
          id: '12345678',
        },
        custom: {
          fields: {},
        },
      } as any);

      expect(payload).toMatchSnapshot();
    });
  });

  describe('mapOrderToWalletSettlePayload', () => {
    it('should include eagleeye-identityValue for /wallet/settle when available', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      jest.spyOn(basketStoreService, 'get').mockResolvedValueOnce({
        enrichedBasket: {
          contents: [],
        },
      });

      const payload = await service.mapOrderToWalletSettlePayload({
        id: '123456',
        cart: {
          typeId: 'cart',
          id: '12345678',
        },
        custom: {
          fields: {
            'eagleeye-identityValue': 'some-identity',
          },
        },
      } as any);

      expect(payload).toMatchSnapshot();
    });
  });

  describe('mapCartToWalletOpenPayload', () => {
    it('should include voucher codes (tokens) if present in the cart', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      const cartWithCodes = {
        ...cart,
        custom: {
          type: {
            typeId: 'type',
            id: '123456',
          },
          fields: {
            'eagleeye-voucherCodes': ['12345678'],
          },
        },
      };

      const payload = await service.mapCartToWalletOpenPayload(
        cartWithCodes,
        false,
      );

      expect(payload).toMatchSnapshot();
    });

    it('should include potential voucher codes (old invalid tokens) if present in the cart', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      const cartWithCodes = {
        ...cart,
        custom: {
          type: {
            typeId: 'type',
            id: '123456',
          },
          fields: {
            'eagleeye-potentialVoucherCodes': ['1234567890'],
          },
        },
      };

      const payload = await service.mapCartToWalletOpenPayload(
        cartWithCodes,
        false,
      );

      expect(payload).toMatchSnapshot();
    });

    it('should not send to EE duplicated voucher codes when potentialVoucherCodes and voucherCodes contain the same voucher code', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      const cartWithCodes = {
        ...cart,
        custom: {
          type: {
            typeId: 'type',
            id: '123456',
          },
          fields: {
            'eagleeye-voucherCodes': ['1234567890'],
            'eagleeye-potentialVoucherCodes': ['1234567890'],
          },
        },
      };

      const payload = await service.mapCartToWalletOpenPayload(
        cartWithCodes,
        false,
      );

      expect(payload).toMatchSnapshot();
    });

    it('should include eagle eye identity if present in the cart', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      const cartWithCodes = {
        ...cart,
        custom: {
          type: {
            typeId: 'type',
            id: '123456',
          },
          fields: {
            'eagleeye-identityValue': ['12345678'],
          },
        },
      };

      const payload = await service.mapCartToWalletOpenPayload(
        cartWithCodes,
        true,
      );

      expect(payload).toMatchSnapshot();
    });

    it('should not include eagle eye identity if not present in the cart but the instruction is to include identity', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('outlet1')
        .mockReturnValueOnce('banner1');

      const cartWithCodes = {
        ...cart,
        custom: {
          type: {
            typeId: 'type',
            id: '123456',
          },
          fields: {},
        },
      };

      const payload = await service.mapCartToWalletOpenPayload(
        cartWithCodes,
        true,
      );

      expect(payload).toMatchSnapshot();
    });

    it('should return the payload for /wallet/open, without the optional parentIncomingIdentifier when not set in the configuration', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1');

      const payload = await service.mapCartToWalletOpenPayload(cart, false);

      expect(payload).toMatchSnapshot();
    });

    it("should return the payload for /wallet/open, with sku instead of upc when 'useItemSku' is set to true", async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(shippingMethodMapMock)
        .mockReturnValueOnce('outlet1');

      const payload = await service.mapCartToWalletOpenPayload(cart, false);

      expect(payload).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToBasketEarn', () => {
    it('should return the mapped basket earn', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-1',
              success: null,
              type: 'earn',
              value: null,
              balances: {
                current: 400,
              },
            },
          ],
        },
      };

      const basketContents = service.mapAdjustedBasketToBasketEarn(basket);

      expect(basketContents).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToBasketCredits', () => {
    it('should return the mapped basket credits', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                current: 400,
              },
            },
          ],
        },
      };
      const accounts = [
        {
          campaign: {
            campaignId: '1653843',
            campaignName: 'Test Campaign',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it('should process the continuity campain fulfilled results and update the mapped basket credits', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762358',
              instanceId: '1762358-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                transaction_count: 1,
              },
              isRefundable: true,
              isUnredeemable: false,
              relatedAccountIds: ['2819096223'],
              targetedAccountId: '2819096223',
              targetedWalletId: '170627492',
              totalMatchingUnits: null,
              playOrderPosition: 2,
            },
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762358',
              instanceId: '1762358-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                current: 500,
              },
              isRefundable: true,
              isUnredeemable: false,
              relatedAccountIds: ['2819096223'],
              targetedAccountId: '2819096224',
              targetedWalletId: '170627492',
              totalMatchingUnits: null,
              playOrderPosition: 2,
            },
          ],
        },
      };
      const accounts = [
        {
          accountId: '2819096223',
          walletId: '170627492',
          campaignId: '1762358',
          campaign: {
            campaignId: 1762358,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName:
              '500 points for spending over £10 in three transactions',
            accountTypeId: 8,
            status: 'ACTIVE',
            reference: '001762358',
          },
          type: 'CONTINUITY',
          clientType: 'OFFER',
          status: 'ACTIVE',
          state: 'LOADED',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 2,
            currentTransactions: 2,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: 3,
                totalTransactionSpend: null,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName:
              '500 points for spending over £10 in three transactions',
            campaignReference: '001762358',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it('should process the continuity campain in_progress results and update the mapped basket credits', () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'CAMPAIGN',
              resourceId: '1762358',
              instanceId: '1762358-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                transaction_count: 1,
              },
              isRefundable: true,
              isUnredeemable: false,
              relatedAccountIds: ['2819096223'],
              targetedAccountId: '2819096223',
              targetedWalletId: '170627492',
              totalMatchingUnits: null,
              playOrderPosition: 2,
            },
          ],
        },
      };
      const accounts = [
        {
          accountId: '2819096223',
          walletId: '170627492',
          campaignId: '1762358',
          campaign: {
            campaignId: 1762358,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName:
              '500 points for spending over £10 in three transactions',
            accountTypeId: 8,
            status: 'ACTIVE',
            reference: '001762358',
          },
          type: 'CONTINUITY',
          clientType: 'OFFER',
          status: 'ACTIVE',
          state: 'LOADED',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 1,
            currentTransactions: 1,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: 3,
                totalTransactionSpend: null,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName:
              '500 points for spending over £10 in three transactions',
            campaignReference: '001762358',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it("should return deduplicated results when there's more than one credit instance per campaign", () => {
      const basket = {
        summary: {
          adjudicationResults: [
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-1',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                current: 400,
              },
            },
            {
              resourceType: 'SCHEME',
              resourceId: '1653843',
              instanceId: '1653843-2',
              success: null,
              type: 'credit',
              value: null,
              balances: {
                current: 400,
              },
            },
          ],
        },
      };
      const accounts = [
        {
          campaign: {
            campaignId: '1653843',
            campaignName: 'Test Campaign',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToBasketCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });
  });

  describe('mapAdjustedBasketToItemCredits', () => {
    it('should return the mapped item credits', () => {
      const basket = {
        contents: [
          {
            upc: '123456',
            adjudicationResults: [
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                instanceId: '1653843-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  current: 400,
                },
              },
            ],
          },
        ],
      };
      const accounts = [
        {
          campaign: {
            campaignId: '1653843',
            campaignName: 'Test Campaign',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it('should process the continuity campain fulfilled results and update the mapped item credits', () => {
      const basket = {
        contents: [
          {
            upc: '245896',
            itemUnitCost: 1000,
            salesKey: 'SALE',
            totalUnitCostAfterDiscount: 1000,
            totalUnitCost: 1000,
            description: 'Bears',
            itemUnitMetric: 'EACH',
            itemUnitCount: 1,
            contributionResults: [
              {
                instanceId: '1653843-1',
                value: 1000,
              },
            ],
            adjudicationResults: [
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  total_spend: 1000,
                },
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614658',
                targetedWalletId: '170774858',
                totalMatchingUnits: null,
                playOrderPosition: 2,
              },
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'redeem',
                value: 500,
                balances: null,
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614658',
                targetedWalletId: '170774858',
                totalMatchingUnits: 1,
                playOrderPosition: 2,
              },
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  current: 500,
                },
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614661',
                targetedWalletId: '170774858',
                totalMatchingUnits: null,
                playOrderPosition: 2,
              },
            ],
          },
        ],
      };
      const accounts = [
        {
          accountId: '2827614658',
          walletId: '170774858',
          campaignId: '1801571',
          campaign: {
            campaignId: 1801571,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            reference: '001801571',
          },
          type: 'CONTINUITY',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 0,
            currentTransactions: 0,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: null,
                totalTransactionSpend: 1000,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            campaignReference: '001801571',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it('should process the continuity campain in_progress results and update the mapped item credits', () => {
      const basket = {
        contents: [
          {
            upc: '245896',
            itemUnitCost: 400,
            salesKey: 'SALE',
            totalUnitCostAfterDiscount: 800,
            totalUnitCost: 800,
            description: 'Bears',
            itemUnitMetric: 'EACH',
            itemUnitCount: 2,
            adjudicationResults: [
              {
                resourceType: 'CAMPAIGN',
                resourceId: '1801571',
                instanceId: '1801571-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  total_spend: 800,
                },
                isRefundable: true,
                isUnredeemable: false,
                relatedAccountIds: ['2827614658'],
                targetedAccountId: '2827614658',
                targetedWalletId: '170774858',
                totalMatchingUnits: null,
                playOrderPosition: 2,
              },
            ],
          },
        ],
      };
      const accounts = [
        {
          accountId: '2827614658',
          walletId: '170774858',
          campaignId: '1801571',
          campaign: {
            campaignId: 1801571,
            campaignTypeId: 106,
            campaignMode: 'RESTRICTED',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            reference: '001801571',
          },
          type: 'CONTINUITY',
          balances: {
            totalSpend: 0,
            currentSpend: 0,
            transactionCount: 0,
            currentTransactions: 0,
            totalUnits: 0,
            currentUnits: 0,
          },
          enriched: {
            token: null,
            qualifier: {
              continuity: {
                totalTransactionCount: null,
                totalTransactionSpend: 1000,
                totalTransactionUnits: null,
              },
            },
            enrichmentType: 'CONTINUITY',
            campaignName: '500 points for spending £10 on bears (UPC: 245896)',
            campaignReference: '001801571',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });

    it("should return deduplicated results when there's more than one credit instance per campaign", () => {
      const basket = {
        contents: [
          {
            upc: '123456',
            adjudicationResults: [
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                instanceId: '1653843-1',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  current: 400,
                },
              },
              {
                resourceType: 'SCHEME',
                resourceId: '1653843',
                instanceId: '1653843-2',
                success: null,
                type: 'credit',
                value: null,
                balances: {
                  current: 400,
                },
              },
            ],
          },
        ],
      };
      const accounts = [
        {
          campaign: {
            campaignId: '1653843',
            campaignName: 'Test Campaign',
          },
        },
      ];

      const basketContents = service.mapAdjustedBasketToItemCredits(
        basket,
        accounts,
      );

      expect(basketContents).toMatchSnapshot();
    });
  });
});
