# Plugin development and customisation

## Local setup

### Basic steps

The project is currently setup with Node v20. To install dependencies just run:

```shell
yarn install
```

Several environment variables are needed to get started. As a reference check/make a copy of `.env.example` and
set the required variables.

Then, to start the integration in watch mode run:

```shell
yarn run start:dev
```

With this the integration is ready to receive requests in the port of your choosing (or port `8080`, which is
the default).

### Testing the local environment as an extension

The integration can automatically create an extension which reaches your local environment using `ngrok`.
To do this, you just need to set the following environment variable:

```shell
NGROK_ENABLED=true
```

After that, start the plugin in .All cart creation/update actions will now be processed by your local environment. Keep
in mind if you have
other extensions in your commercetools project, the order in which extensions are called is not guaranteed.

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
Import the downloaded file in Postman, it will generate a new postman environment.  
Import the Postman collection available in this repository.
Add the EagleEye variables to the Postman environment. The Postman environment should have all the following variables:

| Variable         | Description                      |
|------------------|----------------------------------|
| client_id        | commercetools client id          |
| client_secret    | commercetools client secret      |
| auth_url         | commercetools Authentication URL |
| host             | commercetools API URL            |
| project-key      | commercetools project key        |
| pos_url          | Eagle Eye POS URL                |
| wallet_url       | Eagle Eye Wallet URL             |
| schemeId         | Eagle Eye Scheme ID              |
| ee_client_id     | Eagle Eye username               |
| ee_client_secret | Eagle Eye password               |

at `integration/src/test/e2e/postman/eagle-eye-e2e-tests.postman_collection.json`

To run all tests select the collection in postman and click on the Run button.