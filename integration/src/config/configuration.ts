import * as Joi from 'joi';
import 'dotenv/config';
import _ = require('lodash');

const validationSchema = Joi.object({
  debug: Joi.object({
    extensionKey: Joi.string(),
  }),
  commercetools: Joi.object({
    projectKey: Joi.string().required(),
    region: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    scope: Joi.array<string>(),
  }),
});

const defaultConfiguration = {
  debug: {
    extensionKey: process.env.DEBUG_EXTENSION_KEY || 'dev-debug-extension',
  },
  commercetools: {
    projectKey: process.env.CTP_PROJECT_KEY,
    region: process.env.CTP_REGION,
    clientId: process.env.CTP_CLIENT_ID,
    clientSecret: process.env.CTP_CLIENT_SECRET,
    scope: (process.env.CTP_SCOPE || '').split(' '),
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
      const mergedConfig = _.merge(defaultConfiguration, configOverride);
      return mergedConfig;
    } catch (err) {
      console.error('Failed to apply configuration override. Error: ', err);
      console.log('Continuing only with default configuration.');
    }
  }

  return defaultConfiguration;
};
