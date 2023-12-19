export const RECALCULATE_CART = {
  action: 'Update',
  resource: {
    typeId: 'cart',
    id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
    obj: {
      type: 'Cart',
      id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
      version: 105,
      versionModifiedAt: '2023-11-09T16:28:49.992Z',
      lastMessageSequenceNumber: 1,
      createdAt: '2023-11-07T11:21:40.293Z',
      lastModifiedAt: '2023-11-09T16:28:49.992Z',
      lastModifiedBy: {
        clientId: 'VamUTwccGFr59xQhhuTAQTQ4',
        isPlatformClient: false,
      },
      createdBy: {
        clientId: 'Uy9RaeGH91kFO3und4o-K55R',
        isPlatformClient: false,
      },
      anonymousId: '280f28d6-4952-4897-2e2d-90c0518e23e4',
      locale: 'en',
      lineItems: [
        {
          id: '3fce711d-e891-4005-be7f-bf3c999ccc7d',
          productId: 'c3955077-c666-408b-8855-130ac39a74cc',
          productKey: 'farm-fresh-cheddar-cheese-500g',
          name: {
            en: 'Farm Fresh Cheddar Cheese 500g',
          },
          productType: {
            typeId: 'product-type',
            id: 'fb075f1a-d02f-4531-9eaa-75a6d1e4c4fe',
            version: 2,
          },
          productSlug: {
            en: 'farm-fresh-cheddar-cheese-500g',
          },
          variant: {
            id: 1,
            sku: '245865',
            prices: [
              {
                id: '4f739993-206b-4325-a933-0df00d1f420a',
                value: {
                  type: 'centPrecision',
                  currencyCode: 'GBP',
                  centAmount: 1000,
                  fractionDigits: 2,
                },
              },
            ],
            images: [
              {
                url: 'https://dmmids2yas2hi.cloudfront.net/eagleeye/ProductIcons/Cheese.png',
                label: '',
                dimensions: {
                  w: 0,
                  h: 0,
                },
              },
            ],
            attributes: [],
            assets: [],
            availability: {
              isOnStock: true,
              availableQuantity: 900,
              version: 1,
              id: '4bc02aa2-d285-4e47-8c97-84f7b7f6f384',
            },
          },
          price: {
            id: '4f739993-206b-4325-a933-0df00d1f420a',
            value: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 1000,
              fractionDigits: 2,
            },
          },
          quantity: 4,
          discountedPricePerQuantity: [],
          perMethodTaxRate: [],
          addedAt: '2023-11-07T11:26:17.076Z',
          lastModifiedAt: '2023-11-09T13:43:23.345Z',
          state: [
            {
              quantity: 4,
              state: {
                typeId: 'state',
                id: '048f8cd6-b834-4c2f-89f7-96659b5f1956',
              },
            },
          ],
          priceMode: 'Platform',
          lineItemMode: 'Standard',
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 4000,
            fractionDigits: 2,
          },
          taxedPricePortions: [],
        },
        {
          id: '2d313f50-e3ec-4c17-ac14-9fb6f4d75665',
          productId: 'c965c0b3-e7fc-4af9-a201-e096ebf1e5ea',
          productKey: 'bottled-still-water',
          name: {
            en: 'Bottled Still Water',
          },
          productType: {
            typeId: 'product-type',
            id: 'fb075f1a-d02f-4531-9eaa-75a6d1e4c4fe',
            version: 2,
          },
          productSlug: {
            en: 'bottled-still-water',
          },
          variant: {
            id: 1,
            sku: '245877',
            prices: [
              {
                id: '11b11c69-c276-43d9-946e-f1296dd32a0b',
                value: {
                  type: 'centPrecision',
                  currencyCode: 'GBP',
                  centAmount: 546,
                  fractionDigits: 2,
                },
              },
            ],
            images: [
              {
                url: 'https://dmmids2yas2hi.cloudfront.net/eagleeye/ProductIcons/Water.png',
                label: '',
                dimensions: {
                  w: 0,
                  h: 0,
                },
              },
            ],
            attributes: [],
            assets: [],
            availability: {
              isOnStock: true,
              availableQuantity: 900,
              version: 1,
              id: '368242d5-6c38-4254-baac-d7de645c9e3c',
            },
          },
          price: {
            id: '11b11c69-c276-43d9-946e-f1296dd32a0b',
            value: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 546,
              fractionDigits: 2,
            },
          },
          quantity: 3,
          discountedPricePerQuantity: [],
          perMethodTaxRate: [],
          addedAt: '2023-11-07T11:32:24.401Z',
          lastModifiedAt: '2023-11-09T13:50:30.398Z',
          state: [
            {
              quantity: 3,
              state: {
                typeId: 'state',
                id: '048f8cd6-b834-4c2f-89f7-96659b5f1956',
              },
            },
          ],
          priceMode: 'Platform',
          lineItemMode: 'Standard',
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 1638,
            fractionDigits: 2,
          },
          taxedPricePortions: [],
        },
      ],
      cartState: 'Active',
      totalPrice: {
        type: 'centPrecision',
        currencyCode: 'GBP',
        centAmount: 5538,
        fractionDigits: 2,
      },
      country: 'GB',
      discountOnTotalPrice: {
        discountedAmount: {
          type: 'centPrecision',
          currencyCode: 'GBP',
          centAmount: 100,
          fractionDigits: 2,
        },
        includedDiscounts: [
          {
            discount: {
              typeId: 'direct-discount',
              id: '80f40ad1-4155-4afc-820b-5bce91d5c6e1',
            },
            discountedAmount: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 100,
              fractionDigits: 2,
            },
          },
        ],
      },
      shippingMode: 'Single',
      shipping: [],
      shippingInfo: {
        shippingMethodName: 'Shipping method',
        shippingMethod: {
          id: '7fbc1884-d5f2-458c-879b-ebb88431c41c',
          typeId: 'shipping-method',
        },
        price: {
          centAmount: 500,
          currencyCode: 'USD',
          type: 'centPrecision',
          fractionDigits: 2,
        },
      },
      customLineItems: [],
      discountCodes: [],
      directDiscounts: [
        {
          id: '80f40ad1-4155-4afc-820b-5bce91d5c6e1',
          value: {
            type: 'absolute',
            money: [
              {
                type: 'centPrecision',
                currencyCode: 'GBP',
                centAmount: 100,
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'totalPrice',
          },
          references: [],
        },
      ],
      custom: {
        type: {
          typeId: 'type',
          id: '29d65beb-d913-4fb0-beef-d86fffa3752d',
        },
        fields: {
          'eagleeye-voucherCodes': ['123456', 'valid-code', 'invalid-code'],
        },
      },
      inventoryMode: 'ReserveOnOrder',
      taxMode: 'Platform',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',
      refusedGifts: [],
      origin: 'Customer',
      itemShippingAddresses: [],
      totalLineItemQuantity: 7,
    },
  },
};
