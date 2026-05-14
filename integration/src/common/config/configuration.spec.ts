import * as _ from 'lodash';
import {
  validateConfiguration,
  configuration,
  ScriptConfigService,
  defaultConfiguration,
  parseShippingMethodMap,
} from './configuration';

const VALID_CONFIG_OVERRIDE = {
  commercetools: {
    projectKey: 'test-project',
    region: 'eu',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  },
  eagleEye: {
    clientId: 'test-ee-client',
    clientSecret: 'test-ee-secret',
    incomingIdentifier: 'test-identifier',
  },
};

describe('validateConfiguration', () => {
  afterEach(() => {
    delete process.env.CONFIG_OVERRIDE;
  });

  it('should throw an error if configuration is invalid', () => {
    process.env.CONFIG_OVERRIDE = JSON.stringify({
      commercetools: { projectKey: '' },
    });
    expect(() => {
      validateConfiguration();
    }).toThrow();
  });

  it('should return the validation result if configuration is valid', () => {
    process.env.CONFIG_OVERRIDE = JSON.stringify(VALID_CONFIG_OVERRIDE);

    const result = validateConfiguration();

    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();
  });
});

describe('parseShippingMethodMap', () => {
  it('should return an empty array if SHIPPING_METHOD_MAP is not defined', () => {
    delete process.env.SHIPPING_METHOD_MAP;
    const result = parseShippingMethodMap();
    expect(result).toEqual([]);
  });

  it('should return the parsed shipping method map if SHIPPING_METHOD_MAP is defined and valid JSON', () => {
    const shippingMethodMap = [
      { key: 'method1', upc: '123' },
      { key: 'method2', upc: '456' },
    ];
    process.env.SHIPPING_METHOD_MAP = JSON.stringify(shippingMethodMap);

    const result = parseShippingMethodMap();
    expect(result).toEqual(shippingMethodMap);
  });

  it('should log an error if SHIPPING_METHOD_MAP is defined but invalid JSON', () => {
    const invalidJson = 'invalid-json';
    process.env.SHIPPING_METHOD_MAP = invalidJson;

    const result = parseShippingMethodMap();
    delete process.env.SHIPPING_METHOD_MAP;
    expect(result).toEqual([]);
  });
});

describe('configuration', () => {
  afterEach(() => {
    delete process.env.CONFIG_OVERRIDE;
  });

  it('should return the default configuration if CONFIG_OVERRIDE is not set', () => {
    const result = configuration();

    expect(result).toEqual(defaultConfiguration);
  });

  it('should return the merged configuration if CONFIG_OVERRIDE is set', () => {
    process.env.CONFIG_OVERRIDE = JSON.stringify({
      debug: {
        extensionKey: 'my-extension',
      },
    });

    const expectedConfig = _.merge({}, defaultConfiguration, {
      debug: {
        extensionKey: 'my-extension',
      },
    });

    const result = configuration();

    expect(result).toEqual(expectedConfig);
  });

  test('should log error and return default configuration if config cannot be merged', () => {
    process.env.CONFIG_OVERRIDE = 'invalid-json';

    const result = configuration();
    expect(result).toEqual(defaultConfiguration);
  });
});

describe('ScriptConfigService', () => {
  let scriptConfigService: ScriptConfigService;

  beforeEach(() => {
    process.env.CONFIG_OVERRIDE = JSON.stringify(VALID_CONFIG_OVERRIDE);
    scriptConfigService = new ScriptConfigService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.CONFIG_OVERRIDE;
  });

  describe('get', () => {
    it('should return the value of a property', () => {
      const propertyPath = 'commercetools.projectKey';
      const expectedValue = VALID_CONFIG_OVERRIDE.commercetools.projectKey;

      const result = scriptConfigService.get(propertyPath);

      expect(result).toEqual(expectedValue);
    });

    it('should return the default value if property is not found', () => {
      const propertyPath = 'debug.nonExistentProperty';

      const result = scriptConfigService.get(propertyPath);

      expect(result).toEqual(undefined);
    });
  });
});
