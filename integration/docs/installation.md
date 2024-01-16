# Plugin Installation

This plugin is a Node.js application that can be deployed in different ways and with different configurations.

## Commercetools connect

This plugin is certified and available to install via commercetools Connect.

For detailed instructions on how to deploy this plugin under Connect, head over to
their [official documentation](https://docs.commercetools.com/connect/getting-started#deploy-a-connector). Here's a
summary of the required steps to deploy in production:

- Search for the connector (searching for "eagleeye" should be enough). Take note of properties like `id`/`key`
  and `version`. Also, look at the configuration variables (also available below in this document).
- Prepare your payload to request a deployment based on the previous step.
- Request a deployment.
- Monitor the deployment process by getting the deployment details by `id`/`key`.

For this plugin, the connector provides three applications:

- a `service` type, which is synchronous, handles cart creation/updates and "opens" transactions/saves EagleEye baskets.
- an `event` type, which is asynchronous, handles order creation/updates and "settles"/confirms transactions.
- a `job` type, which is synchronous, handles cleaning up old stored EagleEye baskets (if using Custom Objects).

After these steps are completed successfully, your connector should be ready to use. Don't worry about needing to setup
subscriptions/extensions, there's a default configuration for them and it's applied automatically by Connect using their
post-deploy/pre-undeploy [scripts](https://docs.commercetools.com/connect/convert-existing-integration#adding-automation-scripts).

Customizing/deploying a version of the connector with code changes requires creating/publishing your own (can be
private). Check [this documentation](https://docs.commercetools.com/connect/development) for more details.

## Other deployment strategies

Since this plugin is just your standard Node.js application, it can be deployed to many different
services/platforms/hardware setups. This plugin is also stateless by default, only saving/checking certain states
directly in commercetools as [Custom Objects](https://docs.commercetools.com/api/projects/custom-objects).

A very basic Dockerfile is provided in the repository, but feel free to make your own or run through other methods
like `pm2`, GCP CloudRun or any other (some additional code changes might be needed).

The commercetools configuration (extension/subscription creation and custom types), which is automatically done using CT
connect, should be done manually when using a different hosting strategy by running the `connector:post-deploy:*`
and `connector:pre-undeploy:*` scripts.

Extension, Subscription and cleanup job modules share the same source code. The same artifact must be deployed, only different
endpoints will be used.
The extension module is triggered via a POST request to `/cart/service`.
The subscription module is triggered via a POST request to `/events`.
The cleanup job is triggered via a POST request to `/jobs/stored-basket-cleanup`.

## Configuration

The plugin can be configured via environment variables. Each deployment strategy has a different way of defining
environment variables, refer to the specific deployment documentation for further information.

| Variable                                   | Required | Default                             | Description                                                                                                                                                                                                                                                                                                                                                                                                            |
|--------------------------------------------|----------|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| CTP_PROJECT_KEY                            | ✅        |                                     | The commercetools project key                                                                                                                                                                                                                                                                                                                                                                                          |
| CTP_REGION                                 | ✅        |                                     | The commercetools region. E.g.: europe-west1.gcp                                                                                                                                                                                                                                                                                                                                                                       |
| CTP_CLIENT_ID                              | ✅        |                                     | The commercetools client ID. The client should be created with the following scopes: manage_key_value_documents view_shipping_methods manage_types manage_subscriptions manage_extensions manage_orders view_connectors_deployments manage_connectors_deployments manage_connectors                                                                                                                                    | 
| CTP_CLIENT_SECRET                          | ✅        |                                     | The commercetools client secret                                                                                                                                                                                                                                                                                                                                                                                        |
| EE_CLIENT_ID                               | ✅        |                                     | The clientId supplied by Eagle Eye during onboarding.                                                                                                                                                                                                                                                                                                                                                                  |
| EE_CLIENT_SECRET                           | ✅        |                                     | The Eagle Eye secret                                                                                                                                                                                                                                                                                                                                                                                                   |
| EE_INCOMING_IDENTIFIER                     | ✅        |                                     | EagleEye Outlet Incoming Identifier                                                                                                                                                                                                                                                                                                                                                                                    |
| EE_PARENT_INCOMING_IDENTIFIER              | 🚫       |                                     | EagleEye Outlet's Parent unit Incoming Identifier                                                                                                                                                                                                                                                                                                                                                                      |
| CTP_SCOPE                                  | 🚫       |                                     | The commercetools client scope. The default value is empty                                                                                                                                                                                                                                                                                                                                                             |
| EE_POS_URL                                 | 🚫       | https://pos.sandbox.uk.eagleeye.com | The EagleEye POS API url                                                                                                                                                                                                                                                                                                                                                                                               |
| EE_API_CLIENT_TIMEOUT                      | 🚫       | 1800                                | EagleEye API Client timeout. This timeout can be used to avoid the CT API request to fail when the circuit breaker functionality is disabled. If the circuit breaker is enabled and CIRCUIT_BREAKER_TIMEOUT is lower than EE_API_CLIENT_TIMEOUT then the circuit breaker timeout will trigger first.                                                                                                                   |
| EE_EXCLUDE_UNIDENTIFIED_CUSTOMERS          | 🚫       | false                               | When set to true open offers will be requested only for identified customers (custom field `eagleeye-identityValue` is present).                                                                                                                                                                                                                                                                                       |
| EE_USE_ITEM_SKU                            | 🚫       | false                               | When set to true the wallet OPEN request maps the commercetools product sku to the EagleEye `sku` instead of using the `upc`.                                                                                                                                                                                                                                                                                          |
| ALWAYS_STORE_BASKET_IN_CUSTOM_OBJECT       | 🚫       | true                                | When set to true the EagleEye enriched basked is saved every time the plugin calls the EagleEye API. Saving the basket increases the CT Cart API response time, to improve performance this option can be set to false and the basket should be saved ideally when the CT cart is frozen by passing the custom field `eagleeye-action` = `SAVE_BASKET`. [More info](how-it-works.md#storing-eagle-eye-enriched-basket) |
| CIRCUIT_BREAKER_TIMEOUT                    | 🚫       | 1700                                | The time in milliseconds that action should be allowed to execute before timing out. Timeout can be disabled by setting this to `false`.                                                                                                                                                                                                                                                                               |
| CIRCUIT_BREAKER_RESET_TIMEOUT              | 🚫       | 30000                               | The time in milliseconds to wait before setting the breaker to `halfOpen` state, and trying the action again                                                                                                                                                                                                                                                                                                           |
| CIRCUIT_BREAKER_ENABLED                    | 🚫       | true                                | Whether the circuit breaker functionality is enabled                                                                                                                                                                                                                                                                                                                                                                   |
| CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE | 🚫       | 50                                  | The error percentage at which to open the circuit and start short-circuiting requests to fallback                                                                                                                                                                                                                                                                                                                      |
| CTP_DISABLED_EVENTS                        | 🚫       |                                     | Comma separated names of event processor to be disabled. Allowed values are: `OrderCreatedWithPaidState`, `OrderCreatedWithSettleAction`, `OrderPaymentStateChanged`, `OrderUpdatedWithSettleActionProcessor`                                                                                                                                                                                                          |
| CT_CART_TYPE_KEY                           | 🚫       | custom-cart-type                    | Allows to change the custom cart type key. Useful if there is already another custom cart type used in the commercetools project                                                                                                                                                                                                                                                                                       |
| SHIPPING_METHOD_MAP                        | 🚫       | `[]`                                | Stringified and escaped JSON array for mapping shipping methods to EE UPCs. Used to apply shipping discounts defined as product discounts in EagleEye. Example: `[{\"key\":\"my-shipping-method-key\",\"upc\":\"my-ee-upc\"}]`                                                                                                                                                                                         |
| CONFIG_OVERRIDE                            | 🚫       |                                     | Stringified and escaped JSON to override any amount of configuration properties. The provided object will be merged with your default configuration based on environment variables. Example: `{\"commercetools\": { \"region\": \"us-central1.gcp\"}}`                                                                                                                                                                 |
| BASKET_CLEANUP_QUERY_LIMIT                            | 🚫       | 100                                    | Number of custom objects to request per query when cleaning old custom objects. Numbers between 20 and 100 are recommended.                                                                                                                                                                 |
| BASKET_CLEANUP_OLDER_THAN_VALUE                            | 🚫       | 7                                    | Number for time reference to use when querying old custom objects. E.g.: `5`, for older than 5 days                                                                                                                                                                 |
| BASKET_CLEANUP_OLDER_THAN_UNIT                            | 🚫       | `"days"`                                    | Time unit for reference to use when querying old custom objects (follows moment.js spec). E.g.: `"days"` for older than 5 days. Follows the `moment.js` convention for units.                                                                                     |

## Interaction with other extensions

If an API call triggers multiple API Extensions, they will be called in parallel. Their responses will be merged but
without a guaranteed order. For example, if the EagleEye plugin is installed together with an extension to calculate
taxes, the latter should run after promotions are calculated. In this case, a different solution should be adopted to
guarantee the ordering.
See [commercetools documentation](https://docs.commercetools.com/api/projects/api-extensions#multiple-api-extensions-in-a-single-api-call). 

## Next Steps

To learn how the plugin works, please refer to the [how it works](integration/docs/how-it-works.md) page
