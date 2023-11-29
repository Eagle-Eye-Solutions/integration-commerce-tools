import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
} from './CartCustomTypeActionBuilder';

describe('CartCustomTypeActionBuilder', () => {
  it('should build an addCustomType action', () => {
    const errors: CustomFieldError[] = [
      { type: 'type1', message: 'message1' },
      { type: 'type2', message: 'message2', context: { example: 'mock' } },
    ];

    const action = CartCustomTypeActionBuilder.addCustomType(errors);

    expect(action).toEqual({
      action: 'setCustomType',
      type: {
        typeId: 'type',
        key: 'custom-cart-type',
      },
      fields: {
        'eagleeye-errors': errors.map((error) => JSON.stringify(error)),
        'eagleeye-appliedDiscounts': [],
      },
    });
  });

  it('should build multiple setCustomField actions', () => {
    const errors: CustomFieldError[] = [
      { type: 'type1', message: 'message1' },
      { type: 'type2', message: 'message2' },
    ];

    const action = CartCustomTypeActionBuilder.setCustomFields(errors);

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
