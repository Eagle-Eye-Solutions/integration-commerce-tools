# How it works

## Error handling

### Cart extension

The cart extension has enabled by default a circuit breaker functionality, all calls to EagleEye wallet APIs are tracked
and if the response times are consistently too slow for a period of time or failing with some error code, the plugin
stops sending requests to EagleEye and add the error details in the returned commercetools cart custom fields.

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

Any other error in the plugin will also be added to the `errors` field in the `Cart`. E.g.:

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

## Settle

TODO Explain why is required to settle

### Storing Eagle-Eye enriched basket

TODO Explain how/when to store the eriched basket (configuration options / eagleeye-action)