export const ORDER_FOR_SETTLE = {
  action: 'Update',
  resource: {
    typeId: 'order',
    id: 'order-id',
    obj: {
      type: 'Order',
      id: '44e4a6f3-1504-4e33-bcf3-494474bb07f3',
      version: 1,
      createdAt: '2023-12-13T20:06:14.237Z',
      lastModifiedAt: '2023-12-13T20:06:14.237Z',
      totalPrice: {
        type: 'centPrecision',
        currencyCode: 'GBP',
        centAmount: 11123,
        fractionDigits: 2,
      },
      taxedPrice: {
        totalNet: {
          type: 'centPrecision',
          currencyCode: 'GBP',
          centAmount: 9268,
          fractionDigits: 2,
        },
        totalGross: {
          type: 'centPrecision',
          currencyCode: 'GBP',
          centAmount: 11123,
          fractionDigits: 2,
        },
        taxPortions: [
          {
            rate: 0.2,
            amount: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 2576,
              fractionDigits: 2,
            },
            name: '20% VAT',
          },
        ],
        totalTax: {
          type: 'centPrecision',
          currencyCode: 'GBP',
          centAmount: 1855,
          fractionDigits: 2,
        },
      },
      orderState: 'Open',
      taxMode: 'Platform',
      inventoryMode: 'None',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',
      origin: 'Customer',
      shippingMode: 'Single',
      shippingInfo: {
        shippingMethodName: 'Standard delivery',
        price: {
          type: 'centPrecision',
          currencyCode: 'GBP',
          centAmount: 500,
          fractionDigits: 2,
        },
        shippingRate: {
          price: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 500,
            fractionDigits: 2,
          },
          tiers: [],
        },
        taxRate: {
          name: '20% VAT',
          amount: 0.2,
          includedInPrice: true,
          country: 'GB',
          id: 'E4nKgw3j',
          subRates: [],
        },
        taxCategory: {
          typeId: 'tax-category',
          id: 'e691ff9e-844b-43c2-a0a9-c87069194f32',
        },
        deliveries: [],
        shippingMethod: {
          typeId: 'shipping-method',
          id: '7fbc1884-d5f2-458c-879b-ebb88431c41c',
        },
        discountedPrice: {
          value: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 250,
            fractionDigits: 2,
          },
          includedDiscounts: [
            {
              discount: {
                typeId: 'direct-discount',
                id: '16c4f1be-ef88-4213-9308-bdfe7bc246b1',
              },
              discountedAmount: {
                type: 'centPrecision',
                currencyCode: 'GBP',
                centAmount: 250,
                fractionDigits: 2,
              },
            },
          ],
        },
        taxedPrice: {
          totalNet: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 208,
            fractionDigits: 2,
          },
          totalGross: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 250,
            fractionDigits: 2,
          },
          totalTax: {
            type: 'centPrecision',
            currencyCode: 'GBP',
            centAmount: 42,
            fractionDigits: 2,
          },
        },
        shippingMethodState: 'MatchesCart',
      },
      shippingAddress: {
        firstName: 'dude',
        lastName: 'Guyson',
        streetName: 'Test',
        streetNumber: '69',
        country: 'GB',
      },
      shipping: [],
      lineItems: [
        {
          id: 'e7c924a3-9015-4e55-970d-caa4ca2df31e',
          productId: 'a6b224f0-c663-49eb-9fce-926a500e10ed',
          productKey: 'bottled-beer',
          name: {
            en: 'Bottled Beer',
          },
          productType: {
            typeId: 'product-type',
            id: 'fb075f1a-d02f-4531-9eaa-75a6d1e4c4fe',
            version: 2,
          },
          productSlug: {
            en: 'bottled-beer',
          },
          variant: {
            id: 1,
            sku: '245871',
            prices: [
              {
                id: 'bc9dec07-8abc-4a66-a88f-ffa4929087e1',
                value: {
                  type: 'centPrecision',
                  currencyCode: 'GBP',
                  centAmount: 3797,
                  fractionDigits: 2,
                },
              },
            ],
            images: [
              {
                url: 'https://dmmids2yas2hi.cloudfront.net/eagleeye/ProductIcons/Beer.png',
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
              id: 'c0117f1f-3b94-425c-91fd-61eb870f370a',
            },
          },
          price: {
            id: 'bc9dec07-8abc-4a66-a88f-ffa4929087e1',
            value: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 3797,
              fractionDigits: 2,
            },
          },
          quantity: 1,
          discountedPricePerQuantity: [],
          taxRate: {
            name: '20% VAT',
            amount: 0.2,
            includedInPrice: true,
            country: 'GB',
            id: 'E4nKgw3j',
            subRates: [],
          },
          perMethodTaxRate: [],
          addedAt: '2023-12-13T20:06:11.547Z',
          lastModifiedAt: '2023-12-13T20:06:11.547Z',
          state: [
            {
              quantity: 1,
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
            centAmount: 3797,
            fractionDigits: 2,
          },
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 3164,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 3797,
              fractionDigits: 2,
            },
            totalTax: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 633,
              fractionDigits: 2,
            },
          },
          taxedPricePortions: [],
        },
        {
          id: '4e82082e-d585-49b2-af89-6e0142fbff9e',
          productId: '7987bbff-b377-4b52-89b6-32831d3e9770',
          productKey: 'white-wine',
          name: {
            en: 'White Wine',
          },
          productType: {
            typeId: 'product-type',
            id: 'fb075f1a-d02f-4531-9eaa-75a6d1e4c4fe',
            version: 2,
          },
          productSlug: {
            en: 'white-wine',
          },
          variant: {
            id: 1,
            sku: '245872',
            prices: [
              {
                id: 'd4092e1a-1b17-4382-9e19-ea07e183a853',
                value: {
                  type: 'centPrecision',
                  currencyCode: 'GBP',
                  centAmount: 6383,
                  fractionDigits: 2,
                },
              },
            ],
            images: [
              {
                url: 'https://dmmids2yas2hi.cloudfront.net/eagleeye/ProductIcons/Wine.png',
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
              id: '97aeab7c-505d-46ac-a124-770e64e9d271',
            },
          },
          price: {
            id: 'd4092e1a-1b17-4382-9e19-ea07e183a853',
            value: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 6383,
              fractionDigits: 2,
            },
          },
          quantity: 1,
          discountedPrice: {
            value: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 6183,
              fractionDigits: 2,
            },
            includedDiscounts: [
              {
                discount: {
                  typeId: 'direct-discount',
                  id: '4f4d7735-2a70-403f-8853-739349e2a30a',
                },
                discountedAmount: {
                  type: 'centPrecision',
                  currencyCode: 'GBP',
                  centAmount: 100,
                  fractionDigits: 2,
                },
              },
              {
                discount: {
                  typeId: 'direct-discount',
                  id: '5a80a3c2-e6ba-4546-b5b9-c24a3dd5b46f',
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
          discountedPricePerQuantity: [
            {
              quantity: 1,
              discountedPrice: {
                value: {
                  type: 'centPrecision',
                  currencyCode: 'GBP',
                  centAmount: 6183,
                  fractionDigits: 2,
                },
                includedDiscounts: [
                  {
                    discount: {
                      typeId: 'direct-discount',
                      id: '4f4d7735-2a70-403f-8853-739349e2a30a',
                    },
                    discountedAmount: {
                      type: 'centPrecision',
                      currencyCode: 'GBP',
                      centAmount: 100,
                      fractionDigits: 2,
                    },
                  },
                  {
                    discount: {
                      typeId: 'direct-discount',
                      id: '5a80a3c2-e6ba-4546-b5b9-c24a3dd5b46f',
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
            },
          ],
          taxRate: {
            name: '20% VAT',
            amount: 0.2,
            includedInPrice: true,
            country: 'GB',
            id: 'E4nKgw3j',
            subRates: [],
          },
          perMethodTaxRate: [],
          addedAt: '2023-12-13T20:06:11.547Z',
          lastModifiedAt: '2023-12-13T20:06:11.547Z',
          state: [
            {
              quantity: 1,
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
            centAmount: 6183,
            fractionDigits: 2,
          },
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 5152,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 6183,
              fractionDigits: 2,
            },
            totalTax: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 1031,
              fractionDigits: 2,
            },
          },
          taxedPricePortions: [],
        },
        {
          id: 'cd4f7016-34ea-48d6-97e9-3bfc4f42c4d3',
          productId: '2bdf2258-db1c-4a01-8e77-e5097615ca06',
          productKey: 'mojito',
          name: {
            en: 'Mojito',
          },
          productType: {
            typeId: 'product-type',
            id: 'fb075f1a-d02f-4531-9eaa-75a6d1e4c4fe',
            version: 2,
          },
          productSlug: {
            en: 'mojito',
          },
          variant: {
            id: 1,
            sku: '245873',
            prices: [
              {
                id: '323ad5bd-61c7-4666-9d6d-96cfd8dda7d5',
                value: {
                  type: 'centPrecision',
                  currencyCode: 'GBP',
                  centAmount: 5219,
                  fractionDigits: 2,
                },
              },
            ],
            images: [
              {
                url: 'https://dmmids2yas2hi.cloudfront.net/eagleeye/ProductIcons/Cocktail.png',
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
              id: '9248f590-1f28-4146-8883-b0665b209af5',
            },
          },
          price: {
            id: '323ad5bd-61c7-4666-9d6d-96cfd8dda7d5',
            value: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 5219,
              fractionDigits: 2,
            },
          },
          quantity: 1,
          discountedPricePerQuantity: [],
          taxRate: {
            name: '20% VAT',
            amount: 0.2,
            includedInPrice: true,
            country: 'GB',
            id: 'E4nKgw3j',
            subRates: [],
          },
          perMethodTaxRate: [],
          addedAt: '2023-12-13T20:06:11.547Z',
          lastModifiedAt: '2023-12-13T20:06:11.547Z',
          state: [
            {
              quantity: 1,
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
            centAmount: 5219,
            fractionDigits: 2,
          },
          taxedPrice: {
            totalNet: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 4349,
              fractionDigits: 2,
            },
            totalGross: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 5219,
              fractionDigits: 2,
            },
            totalTax: {
              type: 'centPrecision',
              currencyCode: 'GBP',
              centAmount: 870,
              fractionDigits: 2,
            },
          },
          taxedPricePortions: [],
        },
      ],
      customLineItems: [],
      transactionFee: true,
      discountCodes: [],
      directDiscounts: [
        {
          id: '7a448e91-3f28-42f2-a772-b09ffae7d6a8',
          value: {
            type: 'absolute',
            money: [
              {
                type: 'centPrecision',
                currencyCode: 'GBP',
                centAmount: 3090,
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'totalPrice',
          },
          references: [],
        },
        {
          id: '7e6b854d-65cb-4b05-bc24-005403870fa8',
          value: {
            type: 'absolute',
            money: [
              {
                type: 'centPrecision',
                currencyCode: 'GBP',
                centAmount: 1236,
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'totalPrice',
          },
          references: [],
        },
        {
          id: '4f4d7735-2a70-403f-8853-739349e2a30a',
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
            type: 'lineItems',
            predicate: 'sku="245872"',
          },
          references: [],
        },
        {
          id: '5a80a3c2-e6ba-4546-b5b9-c24a3dd5b46f',
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
            type: 'lineItems',
            predicate: 'sku="245872"',
          },
          references: [],
        },
        {
          id: '16c4f1be-ef88-4213-9308-bdfe7bc246b1',
          value: {
            type: 'absolute',
            money: [
              {
                type: 'centPrecision',
                currencyCode: 'GBP',
                centAmount: 250,
                fractionDigits: 2,
              },
            ],
          },
          target: {
            type: 'shipping',
          },
          references: [],
        },
      ],
      cart: {
        typeId: 'cart',
        id: '45311522-50f6-4aa1-9aba-add802387c1c',
      },
      custom: {
        type: {
          typeId: 'type',
          id: '1553e344-f197-474a-a51f-df68136a96da',
        },
        fields: {
          'eagleeye-action': 'SETTLE',
          'eagleeye-basketStore': 'CUSTOM_TYPE',
          'eagleeye-appliedDiscounts': [
            'Open Item Level Discount (UPC: 245872) (x2)',
            '50% Discount on Standard Shipping (UPC: 245879)',
            'Open Discount Basket (20% off 100) ',
            'Open Discount Basket (10% off 100) ',
          ],
          'eagleeye-voucherCodes': [],
          'eagleeye-errors': [],
          'eagleeye-basketUri':
            'custom-objects/eagleeye-cart/45311522-50f6-4aa1-9aba-add802387c1c',
        },
      },
      billingAddress: {
        firstName: 'dude',
        lastName: 'Guyson',
        streetName: 'Test',
        streetNumber: '69',
        city: 'Oxford',
        state: 'England',
        country: 'GB',
      },
      paymentState: 'Paid',
    },
  },
};
