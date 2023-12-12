import { Test, TestingModule } from '@nestjs/testing';
import { CTCartToEEBasketMapper } from './ctCartToEeBasket.mapper';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { ConfigService } from '@nestjs/config';

describe('CTCartToEEBasketMapper', () => {
  let service: CTCartToEEBasketMapper;
  let configService: ConfigService;
  let commercetools: Commercetools;
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
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CTCartToEEBasketMapper>(CTCartToEEBasketMapper);
    configService = module.get<ConfigService>(ConfigService);
    commercetools = module.get<Commercetools>(Commercetools);
    jest.resetAllMocks();
  });

  test('mapCartLineItemsToBasketContent should return the mapped line items', () => {
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

  test('mapShippingMethodSkusToBasketItems should return the mapped custom basket items', async () => {
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

    jest.spyOn(configService, 'get').mockReturnValueOnce(shippingMethodMapMock);
    jest
      .spyOn(commercetools, 'getShippingMethods')
      .mockResolvedValueOnce([{ key: 'standard-key' }] as any);

    const basketContents = await service.mapShippingMethodSkusToBasketItems(
      shippingInfo as any,
    );

    expect(basketContents).toMatchSnapshot();
  });

  test('mapAdjustedBasketToCartDirectDiscounts should return the direct discount draft', () => {
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

  test('mapAdjustedBasketToItemDirectDiscounts should return the direct discount drafts', () => {
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

  test('mapAdjustedBasketToShippingDirectDiscounts should return the direct discount drafts', () => {
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

    jest.spyOn(configService, 'get').mockReturnValueOnce(shippingMethodMapMock);

    const directDiscounts = service.mapAdjustedBasketToShippingDirectDiscounts(
      basket,
      cart,
    );

    expect(directDiscounts).toMatchSnapshot();
  });

  test('mapVoucherCodesToCampaignTokens should return an array of tokens to be examined', async () => {
    const voucherCodes = ['12345678'];
    const payload = await service.mapVoucherCodesToCampaignTokens(voucherCodes);

    expect(payload).toMatchSnapshot();
  });

  test('mapVoucherCodesToCampaignTokens should ignore empty string vouchers', async () => {
    const voucherCodes = [''];
    const payload = await service.mapVoucherCodesToCampaignTokens(voucherCodes);

    expect(payload).toMatchSnapshot();
  });

  test('mapCartToWalletOpenPayload should return the payload for /wallet/open', async () => {
    jest
      .spyOn(configService, 'get')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(shippingMethodMapMock)
      .mockReturnValueOnce('outlet1')
      .mockReturnValueOnce('banner1');

    const payload = await service.mapCartToWalletOpenPayload(cart);

    expect(payload).toMatchSnapshot();
  });

  test('mapCartToWalletOpenPayload should include voucher codes (tokens) if present in the cart', async () => {
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

    const payload = await service.mapCartToWalletOpenPayload(cartWithCodes);

    expect(payload).toMatchSnapshot();
  });

  test('mapCartToWalletOpenPayload should return the payload for /wallet/open, without the optional parentIncomingIdentifier when not set in the configuration', async () => {
    jest
      .spyOn(configService, 'get')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(shippingMethodMapMock)
      .mockReturnValueOnce('outlet1');

    const payload = await service.mapCartToWalletOpenPayload(cart);

    expect(payload).toMatchSnapshot();
  });

  test("mapCartToWalletOpenPayload should return the payload for /wallet/open, with sku instead of upc when 'useItemSku' is set to true", async () => {
    jest
      .spyOn(configService, 'get')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(shippingMethodMapMock)
      .mockReturnValueOnce('outlet1');

    const payload = await service.mapCartToWalletOpenPayload(cart);

    expect(payload).toMatchSnapshot();
  });
});
