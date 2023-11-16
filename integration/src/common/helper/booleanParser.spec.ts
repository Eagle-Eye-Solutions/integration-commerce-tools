import { parseBool } from './booleanParser';

describe('parseBool', () => {
  it.each([
    [undefined, false],
    ['false', false],
    ['FALSE', false],
    ['smoethingElse', false],
    ['', false],
    ['true', true],
    ['TRUE', true],
  ])(
    'should return %booleanResult when the input is %input',
    (input, booleanResult) => {
      expect(parseBool(input)).toEqual(booleanResult);
    },
  );

  it.each([
    [undefined, true],
    [undefined, false],
    [null, true],
    [null, false],
  ])(
    'should return the default value $defaultValue when undefined',
    (input, defaultValue) => {
      expect(parseBool(input, defaultValue)).toEqual(defaultValue);
    },
  );
});
