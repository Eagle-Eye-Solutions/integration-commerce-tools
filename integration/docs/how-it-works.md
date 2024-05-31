# How it works

The EagleEye commerceools integration is composed of two parts, a synchronous module that integrates with
commercetools using an [Extension](https://docs.commercetools.com/api/projects/api-extensions) and an asynchronous
module that uses commercetools [Subscriptions](https://docs.commercetools.com/api/projects/subscriptions).

The synchronous Extension module is triggered on cart updates, sends the cart status to EagleEye and returns the
applicable promotions and loyalty points. Promotions are applied to the cart using
commercetools [Direct Discounts](https://docs.commercetools.com/api/projects/carts#directdiscountdraft).
Additional promotion information and loyalty points are added to the commercetools
cart and line items [custom fields](https://docs.commercetools.com/api/projects/custom-fields). The cart and line item
custom types are created as part of the post-deployment scripts. The definition of the custom types can be find in the
source code: [cart](../src/common/providers/commercetools/custom-type/cart-type-definition.ts),
[line item](../src/common/providers/commercetools/custom-type/line-item-type-definition.ts)

The asynchronous Subscription module is triggered when an order is marked as *Paid* this would Settle the transaction
in EagleEye, see the [Settle](#subscription-module) section for more info.

The synchronous basket cleanup job is triggered based on a schedule (cron expression) when running under Connect,
see the [Stored baskets cleanup](#stored-baskets-cleanup) section for more info. Otherwise, it must be triggered
manually or automatically by some other means.

## Extension Module

### Promotions

When an API request is sent to update the cart in commercetools a synchronous request is sent to the EagleEye
endpoint `connect/wallet/open` with the data from the commercetools cart to get the available promotions and loyalty
points. The response is mapped to commercetools Direct Discounts which can apply to:

- total price
- line items
- shipping cost

By using commercetools direct discounts the cart prices are automatically updated and very few customisations should
be required in the frontend.

All the applied promotion descriptions are added to the cart and line items custom field `eagleeye-appliedDiscounts` and
can be used on the frontend to show the customer the name of the promotion/s applied.

The Eagle Eye AIR account should be preloaded with the product SKUs/UPCs that have to match the commercetools
product variant `sku` to enable line item promotions.

### Vouchers

To apply one or more voucher codes create the cart with the field `eagleeye-voucherCodes`:

```json
{
  "custom": {
    "type": {
      "typeId": "type",
      "key": "custom-cart-type"
    },
    "fields": {
      "eagleeye-voucherCodes": [
        "sample-code-1",
        "sample-code-2"
      ]
    }
  }
}
```

To add a voucher code to an existing cart use the action `setCustomType` or `setCustomField`, it's the frontend
responsibility to check whether the custom type is set to the cart or not.

The plugin removes from `eagleeye-voucherCodes` the invalid voucher code (e.g. non-existent voucher
codes), leaves untouched the valid ones and moves to `eagleeye-potentialVoucherCodes` the voucher codes that cannot be
applied because some condition is not satisfied (e.g. min quantity required). Each time the commercetools cart is
updated all potential voucher codes are automatically retried.

When `EE_EXCLUDE_UNIDENTIFIED_CUSTOMERS` is set to `true` the integration will only evaluate vouchers when the customer
is identified. The frontend should not allow the submission of a voucher in this scenario as the voucher will be added
to the field `eagleeye-voucherCodes` but it will not be evaluated by the integration.

### Identified customers

Some EagleEye promotions are only available for identified customers. To send the customer identity to EagleEye is
required to add to the cart the custom field `eagleeye-identityValue`. The plugin will request all promotions
available for the identity value provided. If the identity value is not recognized by EagleEye a new request is sent to
EagleEye to get all the open promotions (no identity value is passed).

### Loyalty Points

Loyalty points processing is enabled by default. Points will always be calculated by EagleEye when a campaign is
available and then this data is processed to be stored in your cart as a custom field.

Currently, this custom field is called `eagleeye-loyaltyEarnAndCredits` and you can expect its value to be a stringified
JSON with the following format:

```json
{
  "earn": {
    "basket": {
      "total": 0,
      "offers": []
    }
  },
  "credit": {
    "basket": {
      "total": 100,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 100
        }
      ]
    }
  }
}
```

Where the main two properties are `earn` and `credit`, and each of them may have `basket` or `items` objects. Each of
these may contain `total` (total amount of earn/credit for that object) and offers (array of objects with the name of
the offer and the sum of each redeemed instance of said offer).

In cases where an offer applies more than once, it will show up with `(x<times>)` in its name.
E.g.: `"Example Offer (x2)`, with amount `200` if it were to apply twice.

Loyalty rewards can be awarded by following the below types of campaigns

- Quest
- Continuity

#### Quest

A Quest campaign can be fulfilled it either a single purchase or across multiple purchases. In either case, the credit offer for a quest campaign looks like below. As one can notice, below are the attributes that provide the relevant information about the status of the campaign for the account:

- `type`: Indicates the state of the campaign for the account. Possible values are 
  - `COMPLETING`: when all the objectives of the quest campaign have been fulfilled
  - `IN_PROGRESS`: when the quest campaign is in progress and there are pending objectives in the campaign
- `totalObjectives`: Number of objectives in the quest campaign
- `totalObjectivesMet`: Number of objectives that have been fulfilled so far
- `currentObjectives`: The list of objectives fulfilled in the current purchase
- `objectivesToMeet`: The list of objectives that are pending in the quest campaign


```json
{
  "credit": {
    "basket": {
      "total": 0,
      "offers": [
        {
          "type": "IN_PROGRESS",
          "name": "Travel Quest",
          "amount": 0,
          "category": "QUEST",
          "totalObjectives": 3,
          "totalObjectivesMet": 1,
          "currentObjectives": [
            {
              "campaignId": "1762401",
              "campaignName": "Quest: Buy eScooter (UPC: 245902)"
            }
          ],
          "objectivesToMeet": [
            {
              "campaignId": "1762399",
              "campaignName": "Quest: Car Hire (UPC: 245882)"
            },
            {
              "campaignId": "1762402",
              "campaignName": "Quest: Buy eBike (UPC: 245903)"
            }
          ]
        }
      ]
    }
  }
}
```
_NOTE:_ The quest campaign in this example is still in progress. Hence, the values of `totalObjectives` and `totalObjectivesMet` do not match and `objectivesToMeet` is not empty and the `amount` is 0 as there is no qualifying campaign reward for the current identity. Below is an example of a credit offer that is `COMPLETING`.

```json
{
  "credit": {
    "basket": {
      "total": 2000,
      "offers": [
        {
          "type": "COMPLETING",
          "name": "Travel Quest",
          "amount": 2000,
          "category": "QUEST",
          "totalObjectives": 3,
          "totalObjectivesMet": 3,
          "currentObjectives": [
            {
              "campaignId": "1762399",
              "campaignName": "Quest: Car Hire (UPC: 245882)"
            },
            {
              "campaignId": "1762401",
              "campaignName": "Quest: Buy eScooter (UPC: 245902)"
            },
            {
              "campaignId": "1762402",
              "campaignName": "Quest: Buy eBike (UPC: 245903)"
            }
          ],
          "objectivesToMeet": [],
          "timesRedeemed": 1
        }
      ]
    }
  }
}
```
_NOTE:_ In this case, one can notice that the values of `totalObjectives` and `totalObjectivesMet` match and `objectivesToMeet` is empty and the `amount` is 2000 as the quest campaign has been fulfilled. And all the objectives are met in a single transaction and hence, all the objectives of the campaign are listed in `currentObjectives`.

#### Continuity

Continuity campaign can be setup in three different variations in eagle eye based on:

1. Minimum transactions
2. Minimum spend
3. Minimum number of units purchased

In each of these scenarios, the `credit` offer is included with relevant and appropriate information.

##### __Minimum transactions__

Below is an example of credit offer when the continuity campaign on minimum number of transactions is in progress. As
one can notice, below are the attributes that provide the relevant information about the status of the campaign for the
account:

- `type`: Indicates the state of the campaign for the account. Possible values are
    - `COMPLETING`: when the campaign qualification has been met
    - `IN_PROGRESS`: when the campaign is in progress and the qualification has not been met
- `totalTransactions`: Number of transactions performed by the account towards this campaign
- `totalTransactionCount`: The target number of transactions to be performed to qualify for the points credit

```json
{
  "credit": {
    "basket": {
      "total": 0,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 0,
          "type": "IN_PROGRESS",
          "totalTransactions": 2,
          "totalTransactionCount": 3
        }
      ]
    }
  }
}
```

An example of credit offer for the final transaction to meet the campaign target would be as below. Please notice that
the value for `totalTransactions` and `totalTransactionCount` match in this case.

```json
{
  "credit": {
    "basket": {
      "total": 1000,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 1000,
          "type": "COMPLETING",
          "totalTransactions": 3,
          "totalTransactionCount": 3
        }
      ]
    }
  }
}
```

##### __Minimum spend__

Below is an example of credit offer when the continuity campaign on minimum spend is in progress. As one can notice,
below are the attributes that provide the relevant information about the status of the campaign for the account:

- `totalSpend`: Amount spent in the current transaction by the account towards this campaign
- `totalTransactionSpend`: The target amount to be spent by the account to qualify for the points credit

```json
{
  "credit": {
    "basket": {
      "total": 0,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 0,
          "type": "IN_PROGRESS",
          "totalSpend": 1000,
          "totalTransactionSpend": 3000
        }
      ]
    }
  }
}
```

An example of credit offer for the qualifying transaction to meet the campaign target would be as below. Please notice
that the value for `totalSpend` is greater than `totalTransactionSpend` in this case.

```json
{
  "credit": {
    "basket": {
      "total": 1000,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 1000,
          "type": "COMPLETING",
          "totalSpend": 4000,
          "totalTransactionSpend": 3000
        }
      ]
    }
  }
}
```

##### __Minimum number of units purchased__

Below is an example of credit offer when the continuity campaign on minimum number of units purchased is in progress. As
one can notice, below are the attributes that provide the relevant information about the status of the campaign for the
account:

- `totalUnits`: Number of units purchased in the current transaction by the account towards this campaign
- `totalTransactionUnits`: The target number of units to be purchased by the account to qualify for the points credit

```json
{
  "credit": {
    "basket": {
      "total": 0,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 0,
          "type": "IN_PROGRESS",
          "totalUnits": 2,
          "totalTransactionUnits": 3
        }
      ]
    }
  }
}
```

An example of credit offer for the qualifying transaction to meet the campaign target would be as below. Please notice
that the value for `totalUnits` is greater than `totalTransactionUnits` in this case.

```json
{
  "credit": {
    "basket": {
      "total": 1000,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 1000,
          "type": "COMPLETING",
          "totalUnits": 4,
          "totalTransactionUnits": 3
        }
      ]
    }
  }
}
```

### Data mapping

The data mapping between commercetools cart and EagleEye API involves several fields, to see the latest version of the
mapping refer to
the [AdjudicationMapper](https://github.com/Eagle-Eye-Solutions/integration-commerce-tools/blob/master/integration/src/adjudication/mappers/adjudication.mapper.ts)
class
and [LoyaltyMapper](https://github.com/Eagle-Eye-Solutions/integration-commerce-tools/blob/master/integration/src/adjudication/mappers/loyalty.mapper.ts)
class

#### Dynamic location identifiers

Using the `eagleeye-incomingIdentifier` and/or `eagleeye-parentIncomingIdentifier` custom fields in a Cart, it is possible to override the `EE_INCOMING_IDENTIFIER` and `EE_PARENT_INCOMING_IDENTIFIER` dynamically per Cart without changing the variables/using configuration override and redeploying. Orders will use the same identifier as their carts to make sure transactions can be settled properly.

Here's an example of what a Cart might look like with these custom fields:
```json
{
  // ...
  "custom": {
    // ...
    "fields": {
      "eagleeye-incomingIdentifier": "example-identifier",
      "eagleeye-parentIncomingIdentifier": "example-parent-identifier"
    }
  }
}
```

This is not recommended as the main way of setting/changing these values and should only be used for specific use cases.

### Error handling

The extension module has enabled by default a circuit breaker functionality, all calls to EagleEye wallet APIs are
tracked and if the response times are consistently too slow for some time or fail with some error code, the
plugin stops sending requests to EagleEye and adds the error details in the returned commercetools cart custom fields.

The following snippet shows an example timeout error. The details of the error are available in the `custom` field of
the commercetools `Cart`.

```json
{
  "custom": {
    "type": {
      "typeId": "type",
      "id": "29d65beb-d913-4fb0-beef-a86fffa3752d"
    },
    "fields": {
      "errors": [
        "{\"type\":\"EE_API_CIRCUIT_OPEN\",\"message\":\"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated\"}"
      ],
      "appliedDiscounts": []
    }
  }
}
```

To configure the circuit breaker parameters check the [configuration](installation.md#configuration) section.

Any other errors in the plugin will also be added to the Cart custom field `eagleeye-errors`. E.g.:

```json
{
  "custom": {
    "type": {
      "typeId": "type",
      "id": "29d65beb-d913-4fb0-beef-a86fffa3752d"
    },
    "fields": {
      "errors": [
        "{\"type\":\"EE_API_GENERIC_ERROR\",\"message\":\"The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated\"}"
      ],
      "appliedDiscounts": []
    }
  }
}
```

## Subscription module

When performing cart creation/updates (like changing line item quantities, or adding voucher codes) a transaction is
created/updated in AIR, tied to said cart by using its `id` as a reference. This transaction "locks" certain things
related to it, like voucher codes (so they cannot be used multiple times concurrently).

This transaction is later "settled", when an order `paymentState` changes to "Paid" or when specifically asked to by
setting the custom field `eagleeye-action` to `SETTLE`. This confirms the transaction in EagleEye AIR so the customer
can redeem their rewards (like discounts or loyalty points).

As long as the custom field `eagleeye-settledStatus` for a given order is not `"SETTLED"` and a saved basket exists,
then settle can be performed in one of the following ways:

1. Creating/Updating orders with `eagleeye-action` custom field and value `"SETTLE"`.
2. Creating/Updating orders with `order.paymentState` set to `"Paid"`.

In all of these cases, the transaction will be settled asynchronously
using [Subscriptions](https://docs.commercetools.com/api/projects/subscriptions).

> **_NOTE:_** Is not possible to settle carts, only orders can be settled.

### Storing Eagle-Eye enriched basket

When anything related to this transaction happens, a copy of the "enriched basket" (cart) processed by AIR is saved (by
default using Custom Objects, see section below).
This basket is auto-saved whenever a cart changes, then it's later checked and sent to AIR when settling the
transaction.

Saving the EagleEye enriched basket in the custom objects slightly increases the response time. The auto-saving
functionality can be disabled using the environment variable `ALWAYS_STORE_BASKET_IN_CUSTOM_OBJECT` set
to `false`, then you will need to update the cart with the custom field `eagleeye-action` set to `SAVE_BASKET` for it to
be stored manually. Ideally, the enriched basket should be stored before the order is placed.

The cart custom fields `eagleeye-basketStore` and `eagleeye-basketUri` are also populated so that can be used when
settling the transaction to know where the enriched basked is saved. The `basketStore` field is an enumeration with the
name of the data store used (only CUSTOM_TYPE is currently supported). The `basketUri` field is used to identify the
enriched basked in the store, when using custom objects as store it holds the path to the custom
object - `custom-objects/eagleeye-cart/{cart-id}`. The `cart-id` can be fetched from the commercetools order.

Currently, the only way to save baskets is using commercetools' Custom Objects, but the code allows to easily change the
store by creating a custom `BasketStoreService` implementing the same interface but storing data in a place of your
choosing. If for example, the user decides to store the enriched basket in a MySQL database, in such a case,
the `basketStore` field could be `_MYSQL_` and the `basketUri` field could be the "table name" in which the basket is
stored. The settle service checks the basketStore string and knows which logic to use to get the enriched basket.

### Data mapping

The data mapping between commercetools cart and EagleEye API involves several fields, to see the latest version of the
mapping refer to
the [SettleMapper](https://github.com/Eagle-Eye-Solutions/integration-commerce-tools/blob/master/integration/src/settle/mappers/settle.mapper.ts)
class

### Error handling

The commercetools events are sent on the configured queue and consumed by the subscription module.
If the module fails to process the incoming order message it will return an error code so that the message is not
acknowledged and stays on the message queue for reprocessing. The error details will be added to the order custom
field `eagleeye-errors` and the `eagleeye-settledStatus` will not be set to `SETTLED`, but rather it will be set
to `ERROR`.

## Stored baskets cleanup

As previously mentioned, when performing cart creation/updates (like changing line item quantities, or adding voucher
codes)
a transaction is created/updated in AIR, tied to said cart by using its `id` as a reference. At the same time a copy of
the
enriched basket generated by AIR are stored in commercetools inside Custom Objects.

Over time, some of the carts that originally triggered the creation of these objects might have been abandoned (as in,
a customer did not place an order) or deleted. Since these stored baskets won't be needed anymore and there's a
limit to how many Custom Objects a project can have, these need to be cleaned. For this purpose, an endpoint/job
capable of doing this is provided.

This job will query all custom objects in commercetools by container (using the preset container for storing baskets)
Only those with a `lastModifedAt` date older than the configured threshold will be considered. This query is repeated
as many times as it's needed by using pagination (with a configurable page size) and then the job will attempt to
remove them one by one per each page. At the end of the process, an object with the following structure will be both
logged and
returned to the client:

```json
{
  "result": {
    "successful": [
      {
        "key": "<cart-id>",
        "lastModifiedAt": "ISO-8601 date"
      }
      // ...
    ],
    "failed": []
  }
}
```

Logs will also be printed along the way to show progress and errors (if there are any).

If running this integration under Connect, the `connect.yaml` file specifies a default schedule (cron expression)
to run this job periodically. This cannot be configured at this time, so if a custom schedule is really needed
then a custom connector with a custom `connect.yaml` will be needed.

For configuration using environment variables (`BASKET_CLEANUP_*`), refer to the
[configuration](installation.md#configuration) documentation. 
