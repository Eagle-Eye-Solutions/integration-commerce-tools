# How it works

The EagleEye commerceools integration is composed of two parts, a synchronous module that integrates with
commercetools using an [Extension](https://docs.commercetools.com/api/projects/api-extensions) and an asynchronous
module that uses commercetools [Subscriptions](https://docs.commercetools.com/api/projects/subscriptions).     
The synchronous Extension module is triggered on cart updates, sends the cart status to EagleEye and returns the
applicable promotions and loyalty points. Promotions are applied to the cart using
commercetools [Direct Discounts](https://docs.commercetools.com/api/projects/carts#directdiscountdraft).
Additional promotion information and loyalty points are added to the commercetools
cart [custom fields](https://docs.commercetools.com/api/projects/custom-fields).  
The asynchronous Subscription module is triggered when an order is marked as *Paid* this would Settle the transaction
in EagleEye, see the [Settle](#subscription-module) section for more info.

## Extension Module

When an API request is sent to update the cart in commercetools a synchronous request is sent to the EagleEye
endpoint `connect/wallet/open` with the data from the commercetools cart to get the available promotions.  
The response is mapped to commercetools direct discounts that can apply to:

- total price
- line items
- shipping cost

All the applied promotion descriptions are added to the cart custom field `eagleeye-appliedDiscounts` and can be used on
the frontend to show to the customer the name of the promotion/s applied.

### Data mapping

The data mapping between commercetools cart and EagleEye API involves several fields, to see the latest version of the
mapping refer to
the [CTCartToEEBasketMapper](https://github.com/Eagle-Eye-Solutions/integration-commerce-tools/blob/master/integration/src/common/mappers/ctCartToEeBasket.mapper.ts)
class.

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
codes), leaves untouched the valid ones and move to `eagleeye-potentialVoucherCodes` the voucher codes that cannot be
applied because some condition is not satisfied (e.g. min quantity required). Each time the commercetools cart is
updated all potential voucher codes are automatically retried.

When `EE_EXCLUDE_UNIDENTIFIED_CUSTOMERS` is set to `true` the integration will only evaluate vouchers when the customer
is identified. The frontend should not allow the submission of a voucher in this scenario as the voucher will be added
to the field `eagleeye-voucherCodes` but it will not be evaluated by the integration.

### Identified customers

Some EagleEye promotions are only available for identified customers. To send the customer identified to EagleEye is
required to pass a custom field in the cart called `eagleeye-identityValue`. The plugin will request all promotions
available for the identity value provided. If the identity value is not recognized by EagleEye a new request is sent to
EagleEye to get all the open promotions (no identity value is passed).

## Loyalty Points

Loyalty points processing is enabled by default. Points will always be calculated by EagleEye when a campaign is
available and then this data is processed to be stored in your cart as a custom field.

Currently, this custom field is called `eagleeye-loyaltyEarnAndCredits` and you can expect its value to be a stringified
JSON with the following format:

```json
{
  "earn": {
    "basket": {
      "balance": 0,
      "offers": []
    }
  },
  "credit": {
    "basket": {
      "balance": 100,
      "offers": [
        {
          "name": "Example Offer",
          "amount": 100
        }
      ]
    },
    "items": {
      "balance": 0,
      "offers": []
    }
  }
}
```

Where the main two properties are `earn` and `credit`, and each of them may have `basket` or `balance` objects. Each of
these may contain `balance` (total amount of earn/credit for that object) and offers (array of objects with the name of
the offer and the sum of each redeemed instance of said offer).

In cases where an offer applies more than once, it will show up with `(x<times>)` in its name.
E.g: `"Example Offer (x2)`, with amount `200` if it were to apply twice.

WIP/TODO

## Subscription module

When performing cart creation/updates (like changing line item quantities, or adding voucher codes) a transaction is
created/updated in AIR, tied to said cart by using it's `id` as a reference. This transaction "locks" certain things
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

Saving the EagleEye enriched basket in the custom objects slightly increase the response time, the auto-saving
functionality can be disabled using the environment variable `ALWAYS_STORE_BASKET_IN_CUSTOM_OBJECT` set
to `false`, then you will need to update the cart with the custom field `eagleeye-action` set to `SAVE_BASKET` for it to
be stored manually. Ideally the enriched basket should be stored before the order is placed.

The cart custom fields `eagleeye-basketStore` and `eagleeye-basketUri` are also populated so that can be used when
settling the transaction to know where the enriched basked is saved. The `basketStore` field is an enumeration with the
name of the data store used (only CUSTOM_TYPE is currently supported). The `basketUri` field is used to identify the
enriched basked in the store, when using custom objects as store it holds the path to the custom object,
e.g.: `custom-objects/eagleeye-cart/edcdd99f-c682-4d82-advd-37029c6fs8bv`.

Currently the only way to save baskets is using commercetools' Custom Objects, but the code allows to easily change the
store by creating a custom `BasketStoreService` implementing the same interface but storing data in a place of your
choosing.

## Error handling

### Extension module

The extension module has enabled by default a circuit breaker functionality, all calls to EagleEye wallet APIs are
tracked and if the response times are consistently too slow for a period of time or failing with some error code, the
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
