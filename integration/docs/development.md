# Plugin development and customisation

## Local setup

TODO

## Tests

The project includes unit tests, integration tests and end-to-end tests.

### Unit tests

Unit tests are saved next to the file under test and are named <file-to-test>.spec.ts. Run unit tests only:

```shell
yarn test
```

### Integration tests

Integration tests are available at `/ingration/test` and are named <prefix>.e2e-spec.ts.

```shell
yarn test:e2e
```

### End-to-end tests

End-to-end tests are written using Postman. These must be executed in an environment where the plugin is installed and
configured to communicate with both a Commercetools project and a EagleEye account.

#### Running tests with postman

Create a new API Client in
commercetools https://mc.europe-west1.gcp.commercetools.com/eagleeye-connector-dev/settings/developer/api-clients, the
Admin Client scope can be used for test environments.  
Once created download the credentials by selecting **Postman** in the dropdown.  
Import the downloaded file in postman, it will generate a new postman environment.  
Import the postman collection available in this repository
at `integration/src/test/e2e/postman/eagle-eye-e2e-tests.postman_collection.json`

To run all tests select the collection in postman and click on the Run button.