# Plugin development and customisation

## Local setup

Required software:

- Node.js v18+ [official download](https://nodejs.org/en/download), [nvm](https://github.com/nvm-sh/nvm)
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

### Basic steps

Clone the repository.

Change directory to `/integration`

Install the dependencies:

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

Send a POST request to `localhost:8080/service` with the sample body:

```json
{
  "action": "Update",
  "resource": {
    "id": "22f9f9v6-6v80-43b9-894f-19122l19f049",
    "obj": {
      "type": "Cart",
      "version": ...
      // *********************
      // all other cart fields
      // *********************
    },
    "typeId": "cart"
  }
}
```

### Connect the local to a commercetools project

The integration can automatically create an extension in commercetools which reaches your local environment
using `ngrok`.
Install `ngrok` at [https://ngrok.com/download](https://ngrok.com/download), register an ngrok account and
generate your auth token.
Add authtoken: `ngrok config add-authtoken <token>`

Set the following environment variable in your local `integration/.env` file:

```shell
NGROK_ENABLED=true
```

After that, start the plugin. All cart create/update actions will now be processed by your local environment. Keep
in mind if you have other extensions in your commercetools project, the order in which extensions are called is not
guaranteed.

It is possible to set a trigger condition using the environment variable `DEBUG_EXTENSION_TRIGGER_CONDITION` so that the
local extension will be triggered only when the condition is met.
E.g.:

```shell
DEBUG_EXTENSION_TRIGGER_CONDITION='customerEmail is defined and customerEmail="developer-email@eagleeye.com"'
```

When multiple developers are working at the same time, it is possible to change the key of the debug extension in
commercetools by setting the environment variable `DEBUG_EXTENSION_KEY` that should follow the
pattern `^[A-Za-z0-9_-]+$`

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