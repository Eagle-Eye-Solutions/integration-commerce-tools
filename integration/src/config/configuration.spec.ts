import * as _ from 'lodash';
import {
  validateConfiguration,
  configuration,
  ScriptConfigService,
  defaultConfiguration,
} from './configuration';
import * as configurationUtil from './configuration';

describe('validateConfiguration', () => {
  let configSpy;

  beforeEach(() => {
    configSpy = jest.spyOn(configurationUtil, 'configuration');
  });

  it('should throw an error if configuration is invalid', () => {
    const invalidConfig = {
      debug: {
        extensionKey: 'some-key',
        ngrokEnabled: false,
      },
      commercetools: {
        projectKey: '', // Invalid type
        region: 'us',
        clientId: 'my-client-id',
        clientSecret: 'my-client-secret',
        scope: [],
      },
    };

    configSpy.mockReturnValue(invalidConfig);

    expect(() => {
      validateConfiguration();
    }).toThrow();
    configSpy.mockRestore();
  });

  it('should return the validation result if configuration is valid', () => {
    const validConfig = {
      debug: {
        extensionKey: 'my-extension',
        ngrokEnabled: true,
      },
      commercetools: {
        projectKey: 'my-project',
        region: 'us',
        clientId: 'my-client-id',
        clientSecret: 'my-client-secret',
        scope: ['read', 'write'],
      },
    };

    configSpy.mockReturnValue(validConfig);

    const result = validateConfiguration();

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual(validConfig);
    configSpy.mockRestore();
  });
});

describe('configuration', () => {
  let configSpy;

  beforeEach(() => {
    configSpy = jest.spyOn(configurationUtil, 'configuration');
  });

  it('should return the default configuration if CONFIG_OVERRIDE is not set', () => {
    const result = configuration();

    expect(result).toEqual(defaultConfiguration);
    configSpy.mockRestore();
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
    configSpy.mockRestore();
  });
});

describe('ScriptConfigService', () => {
  let scriptConfigService: ScriptConfigService;

  beforeEach(() => {
    scriptConfigService = new ScriptConfigService();
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return the value of a property', () => {
      const propertyPath = 'commercetools.projectKey';
      const expectedValue = process.env.CTP_PROJECT_KEY;

      const result = scriptConfigService.get(propertyPath);

      expect(result).toEqual(expectedValue);
    });

    it('should return the default value if property is not found', () => {
      const propertyPath = 'debug.nonExistentProperty';
      const expectedValue = undefined;

      const result = scriptConfigService.get(propertyPath);

      expect(result).toEqual(expectedValue);
    });
  });
});
