# Poll Endpoint GitHub Action

This action polls a specified HTTP or HTTPS endpoint until it responds with the expected status code or the timeout is exceeded.

This action can be particularly useful to check the status of a container launched with the `-d` flag as part of a CI workflow.

## Inputs

### `url`

**Required** The URL to poll.

### `method`

**Optional** The HTTP method to use. Default `"GET"`.

### `expectStatus`

**Optional** The HTTP status that is expected. Default `"200"`.

### `expectBody`

**Optional** Response body that is expected.

### `expectBodyRegex`

**Optional** Regex to match expected response body

### `timeout`

**Optional** The maximum time the polling is allowed to run for (in milliseconds). Default `"60000"`.

### `interval`

**Optional** The interval at which the polling should happen (in milliseconds). Default `"1000"`.

## Example usage

```yml
uses: artiz/poll-endpoint@1.0.2
with:
  url: http://localhost:8080
  method: GET
  expect-status: 200
  expect-response-regex: "\"revision\":\"1\.00\""
  timeout: 60000
  interval: 1000
```
