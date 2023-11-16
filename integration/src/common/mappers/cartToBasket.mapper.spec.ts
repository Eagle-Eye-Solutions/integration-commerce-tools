import { CartToBasketMapper } from './cartToBasket.mapper';

describe('CartToBasketMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new CartToBasketMapper();
  });

  test('mapCartLineItemsToBasketContent should return the mapped line items', () => {
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

    const basketContents = mapper.mapCartLineItemsToBasketContent(lineItems);

    expect(basketContents).toMatchSnapshot();
  });

  test('mapAdjustedBasketToCartDirectDiscount should return the direct discount draft', () => {
    const basket = {
      summary: {
        totalDiscountAmount: {
          promotions: 500,
        },
        adjustmentResults: [],
      },
    };

    const cart = {
      totalPrice: {
        currencyCode: 'USD',
        type: 'centPrecision',
        fractionDigits: 2,
      },
    };

    const directDiscount = mapper.mapAdjustedBasketToCartDirectDiscount(
      basket,
      cart,
    );

    expect(directDiscount).toMatchSnapshot();
  });

  test('mapAdjustedBasketToItemDirectDiscounts should return the direct discount drafts', () => {
    const basket = {
      summary: {
        totalDiscountAmount: {
          promotions: 0,
        },
        adjustmentResults: [
          {
            upc: 'SKU123',
            adjustmentResults: [
              {
                discountAmount: 100,
              },
            ],
          },
        ],
      },
    };

    const cart = {
      lineItems: [
        {
          variant: {
            sku: 'SKU123',
          },
          totalPrice: {
            currencyCode: 'USD',
            type: 'centPrecision',
            fractionDigits: 2,
          },
        },
      ],
    };

    const directDiscounts = mapper.mapAdjustedBasketToItemDirectDiscounts(
      basket,
      cart,
    );

    expect(directDiscounts).toMatchSnapshot();
  });
});
