# How it works

## Error handling

### Cart extension

The cart extension has enabled by default a circuit breaker functionality, all calls to EagleEye wallet APIs are tracked
and if the response times are consistently too slow for a period of time or failing with some error code, the plugin
stops sending requests to EagleEye and adds the error details in the returned commercetools cart custom fields.

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

Any other errors in the plugin will also be added to the `errors` field in the `Cart`. E.g.:

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

## Loyalty Points

Loyalty points processing is enabled by default. Points will always be calculated by EagleEye when a campaign is available and then this data is processed to be stored in your cart as a custom field.

Currently this custom field is called `eagleeye-loyaltyEarnAndCredits` and you can expect its value to be a stringified JSON with the following format:
```json
{
   "earn":{
      "basket":{
         "balance":0,
         "offers":[]
      }
   },
   "credit":{
      "basket":{
         "balance":100,
         "offers":[{
            "name":"Example Offer",
            "amount":100
         }]
      },
      "items":{
         "balance":0,
         "offers":[]
      }
   }
}
```

Where the main two properties are `earn` and `credit`, and each of them may have `basket` or `balance` objects. Each of these maybe contain `balance` (total amount of earn/credit for that object) and offers (array of object with the name of the offer and the sum of each redeemed instance of said offer).

In cases where an offer applies more than once, it will show up with `(x<times>)` in its name. E.g: `"Example Offer (x2)`, with amount `200` if it were to apply twice.

WIP/TODO

## Settle

When performing cart creation/updates (like changing line item quantities, or adding voucher codes) a transaction is created/updated in AIR, tied to said cart by using it's `id` as a reference. This transaction "locks" certain things related to it, like voucher codes (so they cannot be used multiple times concurrently).

This transaction is later "settled", when an order `paymentState` changes to "Paid" or when specifically asked to by setting the custom field `eagleeye-action` to `"SETTLE"`. This confirms the transaction in EagleEye AIR so the customer can redeem their rewards (like discounts or loyalty points).

As long as the custom field `eagleeye-settledStatus` for a given order is not `"SETTLED"` and a saved basket exists, then settle can be performed by:
- Creating/Updating orders with `eagleeye-action` custom field and value `"SETTLE"`.
- Creating/Updating orders with `order.paymentState` set to `"Paid"`.

In all of these cases, the transaction will be settled asynchronously using [Subscriptions](https://docs.commercetools.com/api/projects/subscriptions).

### Storing Eagle-Eye enriched basket

When anything related to this transaction happens, a copy of the "basket" (cart) processed by AIR is saved (by default using Custom Objects, see section below). This basket is saved whenever a cart changes, then it's later checked and sent to AIR when settling the transaction.

If this functionality is disabled using the environment variable `ALWAYS_STORE_BASKET_IN_CUSTOM_OBJECT` set to `false`, then you will need to update the cart with the custom field `eagleeye-action` set to `SAVE_BASKET` for it to be stored manually.

Currently the only way to save baskets is using commercetools' Custom Objects, but the code in a way that allows creating a custom `BasketStoreService` implementing the same interface but storing data in a place of your choosing.