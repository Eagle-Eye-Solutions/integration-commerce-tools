import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
  DiscountDescription,
} from './CartCustomTypeActionBuilder';
import { BasketLocation } from '../../../../services/basket-store/basket-store.interface';
import { CartTypeDefinition } from '../../../../providers/commercetools/custom-type/cart-type-definition';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

describe('CartCustomTypeActionBuilder', () => {
  let cartTypeDefinition: CartTypeDefinition;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartTypeDefinition,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    cartTypeDefinition = module.get<CartTypeDefinition>(CartTypeDefinition);
  });

  it('should build an addCustomType action', () => {
    const errors: CustomFieldError[] = [
      { type: 'BASKET_STORE_DELETE', message: 'message1' },
      { type: 'EE_API_CIRCUIT_OPEN', message: 'message2' },
      {
        type: 'EE_API_TOKEN_PCEXNF',
        message: 'message3',
        context: { value: '123456' },
      },
    ];

    const discountDescriptions: DiscountDescription[] = [
      { description: 'disc1' },
      { description: 'disc2' },
    ];
    const voucherCodes = ['code1', 'code2'];
    const potentialVoucherCodes = ['code3', 'code4'];
    const basketLocation: BasketLocation = {
      uri: 'path/to/basket',
      storeType: 'CUSTOM_TYPE',
    };
    const loyaltyEarnAndCredits = {
      earn: {
        basket: {
          balance: 400,
          offers: [],
        },
      },
      credit: {
        basket: {
          balance: 0,
          offers: [],
        },
        items: {
          balance: 0,
          offers: [],
        },
      },
    };
    const action = CartCustomTypeActionBuilder.addCustomType(
      {
        errors,
        discountDescriptions,
        voucherCodes,
        potentialVoucherCodes,
        basketLocation,
        loyaltyEarnAndCredits,
      },
      cartTypeDefinition.getTypeKey(),
    );

    expect(action).toEqual({
      action: 'setCustomType',
      type: {
        typeId: 'type',
        key: 'custom-cart-type',
      },
      fields: {
        'eagleeye-errors': errors.map((error) => JSON.stringify(error)),
        'eagleeye-appliedDiscounts': ['disc1', 'disc2'],
        'eagleeye-basketStore': 'CUSTOM_TYPE',
        'eagleeye-basketUri': 'path/to/basket',
        'eagleeye-voucherCodes': ['code1', 'code2'],
        'eagleeye-potentialVoucherCodes': ['code3', 'code4'],
        'eagleeye-action': '',
        'eagleeye-settledStatus': '',
        'eagleeye-loyaltyEarnAndCredits': JSON.stringify(loyaltyEarnAndCredits),
      },
    });
  });

  it('should remove eagleeye-identityValue when there is a related error in eagleeye-errors', () => {
    const errors: CustomFieldError[] = [
      { type: 'EE_API_CUSTOMER_NF', message: 'message1' },
    ];
    const voucherCodes = [];
    const potentialVoucherCodes = [];
    const basketLocation: BasketLocation = {
      uri: 'path/to/basket',
      storeType: 'CUSTOM_TYPE',
    };
    const action = CartCustomTypeActionBuilder.addCustomType(
      {
        errors,
        discountDescriptions: [],
        voucherCodes,
        potentialVoucherCodes,
        basketLocation,
      },
      cartTypeDefinition.getTypeKey(),
    );

    expect(action).toEqual({
      action: 'setCustomType',
      type: {
        typeId: 'type',
        key: 'custom-cart-type',
      },
      fields: {
        'eagleeye-errors': errors.map((error) => JSON.stringify(error)),
        'eagleeye-appliedDiscounts': [],
        'eagleeye-basketStore': 'CUSTOM_TYPE',
        'eagleeye-basketUri': 'path/to/basket',
        'eagleeye-voucherCodes': [],
        'eagleeye-potentialVoucherCodes': [],
        'eagleeye-action': '',
        'eagleeye-settledStatus': '',
        'eagleeye-identityValue': '',
        'eagleeye-loyaltyEarnAndCredits': '',
      },
    });
  });

  it('should build multiple setCustomField actions', () => {
    const errors: CustomFieldError[] = [
      { type: 'EE_API_DISCONNECTED', message: 'message1' },
      { type: 'EE_API_TIMEOUT', message: 'message2' },
      { type: 'EE_API_CUSTOMER_NF', message: 'customer not found' },
    ];

    const action = CartCustomTypeActionBuilder.setCustomFields({ errors });

    expect(action).toEqual([
      {
        action: 'setCustomField',
        name: 'eagleeye-errors',
        value: errors.map((error) => JSON.stringify(error)),
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-appliedDiscounts',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketStore',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-basketUri',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-voucherCodes',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-potentialVoucherCodes',
        value: [],
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-action',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-settledStatus',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-loyaltyEarnAndCredits',
        value: '',
      },
      {
        action: 'setCustomField',
        name: 'eagleeye-identityValue',
        value: '',
      },
    ]);
  });

  it('should build a removeCustomType action', () => {
    const action = CartCustomTypeActionBuilder.removeCustomType();

    expect(action).toEqual({
      action: 'setCustomType',
    });
  });

  it('should should check if a BaseResource already has a custom type', () => {
    const resource = {
      id: 'some-id',
      version: 1,
      custom: {
        type: {
          typeId: 'type',
          id: 'some-other-id',
        },
      },
      createdAt: 'some-date',
      lastModifiedAt: 'some-date',
    };
    const action =
      CartCustomTypeActionBuilder.checkResourceCustomType(resource);

    expect(action).toEqual({
      typeId: 'type',
      id: 'some-other-id',
    });
  });
});
