import {
  CartCustomTypeActionBuilder,
  CustomFieldError,
} from './CartCustomTypeActionBuilder';

describe('CartCustomTypeActionBuilder', () => {
  it('should build an addCustomType action', () => {
    const errors: CustomFieldError[] = [
      { type: 'type1', message: 'message1' },
      { type: 'type2', message: 'message2' },
    ];

    const action = CartCustomTypeActionBuilder.addCustomType(errors);

    expect(action).toEqual({
      action: 'setCustomType',
      type: {
        typeId: 'type',
        key: 'eagleEye',
      },
      fields: {
        errors: errors.map((error) => JSON.stringify(error)),
      },
    });
  });

  it('should build a removeCustomType action', () => {
    const action = CartCustomTypeActionBuilder.removeCustomType();

    expect(action).toEqual({
      action: 'setCustomType',
    });
  });
});
