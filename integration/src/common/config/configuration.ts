import * as Joi from 'joi';
import 'dotenv/config';
import * as _ from 'lodash';
import { parseBool } from '../../common/helper/booleanParser';
import { Injectable, Logger } from '@nestjs/common';
import * as process from 'process';

const logger = new Logger('ConfigService');

const validationSchema = Joi.object({
  debug: Joi.object({
    extensionKey: Joi.string(),
    ngrokEnabled: Joi.boolean(),
    extensionTriggerCondition: Joi.string(),
  }),
  commercetools: Joi.object({
    projectKey: Joi.string().required(),
    region: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    scope: Joi.array<string>(),
    cartTypeKey: Joi.string().allow(''),
    lineItemTypeKey: Joi.string().allow(''),
  }),
  eagleEye: Joi.object({
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    posUrl: Joi.string(),
    shippingMethodMap: Joi.array<{ key: string; upc: string }>(),
    incomingIdentifier: Joi.string().required(),
    parentIncomingIdentifier: Joi.string(),
    storeBasketCustomObject: Joi.boolean(),
    apiClientTimeout: Joi.number(),
    useItemSku: Joi.boolean(),
    excludeUnidentifiedCustomers: Joi.boolean(),
  }),
  circuitBreaker: {
    timeout: Joi.number(),
    resetTimeout: Joi.number(),
    errorThresholdPercentage: Joi.number(),
    enabled: Joi.boolean(),
  },
  eventHandler: {
    disabledEvents: Joi.array<string>(),
    allowRetriesOnSettleError: Joi.boolean(),
  },
  storedBasketCleanup: {
    objectQueryLimit: Joi.number(),
    olderThanValue: Joi.number(),
    olderThanUnit: Joi.string(),
  },
});

export const parseShippingMethodMap = (): { key: string; upc: string }[] => {
  if (process.env.SHIPPING_METHOD_MAP) {
    try {
      return JSON.parse(process.env.SHIPPING_METHOD_MAP);
    } catch (err) {
      logger.error(
        'Failed to parse shipping method map from environment, skipping. Error: ${err',
        err.stack,
      );
    }
  }
  return [];
};

export const defaultConfiguration = {
  debug: {
    extensionKey: process.env.DEBUG_EXTENSION_KEY || 'dev-debug-extension',
    ngrokEnabled: process.env.NGROK_ENABLED === 'true',
    extensionTriggerCondition: process.env.DEBUG_EXTENSION_TRIGGER_CONDITION,
  },
  commercetools: {
    projectKey: process.env.CTP_PROJECT_KEY,
    region: process.env.CTP_REGION,
    clientId: process.env.CTP_CLIENT_ID,
    clientSecret: process.env.CTP_CLIENT_SECRET,
    scope: (process.env.CTP_SCOPE || '').split(' '),
    cartTypeKey: process.env.CT_CART_TYPE_KEY || '',
    lineItemTypeKey: process.env.CT_LINE_ITEM_TYPE_KEY || '',
  },
  eagleEye: {
    clientId: process.env.EE_CLIENT_ID,
    clientSecret: process.env.EE_CLIENT_SECRET,
    posUrl: process.env.EE_POS_URL,
    shippingMethodMap: parseShippingMethodMap(),
    incomingIdentifier: process.env.EE_INCOMING_IDENTIFIER,
    parentIncomingIdentifier: process.env.EE_PARENT_INCOMING_IDENTIFIER,
    storeBasketCustomObject: parseBool(
      process.env.ALWAYS_STORE_BASKET_IN_CUSTOM_OBJECT,
      true,
    ),
    apiClientTimeout: process.env.EE_API_CLIENT_TIMEOUT || 1800,
    useItemSku: parseBool(process.env.EE_USE_ITEM_SKU, false),
    excludeUnidentifiedCustomers: parseBool(
      process.env.EE_EXCLUDE_UNIDENTIFIED_CUSTOMERS,
      false,
    ),
  },
  circuitBreaker: {
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT, 10) || 1700,
    resetTimeout:
      parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT, 10) || undefined,
    errorThresholdPercentage:
      parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE, 10) ||
      undefined,
    enabled: parseBool(process.env.CIRCUIT_BREAKER_ENABLED, true),
  },
  eventHandler: {
    disabledEvents: (process.env.CTP_DISABLED_EVENTS || '')
      .split(',')
      .map((item) => item.trim()),
    allowRetriesOnSettleError: parseBool(
      process.env.ALLOW_RETRY_ON_SETTLE_ERROR,
      true,
    ),
  },
  storedBasketCleanup: {
    objectQueryLimit:
      parseInt(process.env.BASKET_CLEANUP_QUERY_LIMIT, 10) || 100,
    olderThanValue:
      parseInt(process.env.BASKET_CLEANUP_OLDER_THAN_VALUE, 10) || 1,
    olderThanUnit: process.env.BASKET_CLEANUP_OLDER_THAN_UNIT || 'days',
  },
};

export const validateConfiguration = () => {
  const validation = validationSchema.validate(configuration(), {
    abortEarly: false,
    allowUnknown: false,
  });

  if (validation.error) {
    throw validation.error.details;
  }

  return validation;
};

export const configuration = () => {
  if (process.env.CONFIG_OVERRIDE) {
    try {
      const configOverride = JSON.parse(process.env.CONFIG_OVERRIDE);
      return _.merge(defaultConfiguration, configOverride);
    } catch (err) {
      logger.error(
        'Failed to apply configuration override. Error: ${err}',
        err.stack,
      );
      logger.log('Continuing only with default configuration.');
    }
  }

  return defaultConfiguration;
};

// Only intended for scripts or cases where NestJS modules are not available
@Injectable()
export class ScriptConfigService {
  private readonly config;

  constructor() {
    validateConfiguration();
    this.config = configuration();
  }

  public get(propertyPath: string) {
    const splitPath = propertyPath.split('.');
    let resultProp = this.config;
    splitPath.forEach((prop) => {
      resultProp = resultProp[prop];
    });
    return resultProp;
  }
}
