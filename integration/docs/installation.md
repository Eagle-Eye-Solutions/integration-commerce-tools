# Plugin Installation

This plugin is a Node.js application that can be deployed in different ways and with different configurations.

## Commercetools connect

This plugin is certified and available to install via commercetools connect.

TODO

## Other deployment strategies

TODO

## Configuration

The plugin can be configured via environment variables. Each deployment strategy has a different way to define
environment variables, refer to the specific deployment documentation for further information.

| Variable                                   | Required | Default                                   | Description                                                                                                                              |
|--------------------------------------------|----------|-------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| CTP_PROJECT_KEY                            | ✅        |                                           | The commercetools project key                                                                                                            |
| CTP_REGION                                 | ✅        |                                           | The commercetools region. E.g.: europe-west1.gcp                                                                                         |
| CTP_CLIENT_ID                              | ✅        |                                           | The commercetools client ID                                                                                                              | 
| CTP_CLIENT_SECRET                          | ✅        |                                           | The commercetools client secret                                                                                                          |
| CTP_SCOPE                                  | 🚫       |                                           | The commercetools client scope. The default value is empty                                                                               |
| EE_CLIENT_ID                               | ✅        |                                           | The clientId supplied by Eagle Eye during onboarding.                                                                                    |
| EE_CLIENT_SECRET                           | ✅        |                                           | The Eagle Eye secret                                                                                                                     |
| EE_WALLET_URL                              | 🚫       | https://wallet.sandbox.uk.eagleeye.com    | The EagleEye wallet API url                                                                                                              |
| EE_POS_URL                                 | 🚫       | https://pos.sandbox.uk.eagleeye.com       | The EagleEye POS API url                                                                                                                 |
| EE_RESOURCES_URL                           | 🚫       | https://resources.sandbox.uk.eagleeye.com | The EagleEye resources API url                                                                                                           |
| CIRCUIT_BREAKER_TIMEOUT                    | 🚫       | 1800                                      | The time in milliseconds that action should be allowed to execute before timing out. Timeout can be disabled by setting this to `false`. |
| CIRCUIT_BREAKER_RESET_TIMEOUT              | 🚫       | 30000                                     | The time in milliseconds to wait before setting the breaker to `halfOpen` state, and trying the action again                             |
| CIRCUIT_BREAKER_ENABLED                    | 🚫       | true                                      | Whether the circuit breaker functionality is enabled                                                                                     |
| CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE | 🚫       | 50                                        | The error percentage at which to open the circuit and start short-circuiting requests to fallback                                        |