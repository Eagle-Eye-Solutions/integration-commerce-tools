import * as core from "@actions/core";
import * as http from "@actions/http-client";

const SUPPORTED_METHODS = ["GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"];

function getInput(name: string, required = false): string {
  return core.getInput(name, { required, trimWhitespace: true });
}

function getInputNumber(name: string, defaultValue = 0): number {
  const input = core.getInput(name, { required: false, trimWhitespace: true });
  if (input === "" || isNaN(+input)) {
    return defaultValue;
  }
  return +input;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  try {
    const url = getInput("url", true);
    const method = getInput("method")?.toUpperCase() || "GET";
    const authorization = getInput("authorization");
    const expectBody = getInput("expectBody");
    const expectBodyRegex = getInput("expectBodyRegex");
    const expectStatus = getInputNumber("expectStatus", 200);
    const timeout = getInputNumber("timeout", 60000);
    const interval = getInputNumber("interval", 1000);

    if (!SUPPORTED_METHODS.includes(method)) {
      core.setFailed("Specify a valid HTTP method.");
      return;
    }

    const client = new http.HttpClient();
    const startTime = Date.now();
    const bodyRegex = expectBodyRegex && new RegExp(expectBodyRegex);

    let error: Error | undefined;

    while (Date.now() - startTime < timeout) {
      try {
        const headers = authorization ? { authorization: authorization } : {};
        core.debug(method);
        core.debug(url);
        core.debug(`${headers}`);
        const response = await client.request(method, url, null, headers);
        const status = response.message.statusCode;

        if (status === expectStatus) {
          const body = await response.readBody();

          if (expectBody && expectBody !== body) {
            throw new Error(`Expected body: ${expectBody}, actual body: ${body}`);
          }
          if (bodyRegex) core.debug(body);
          if (bodyRegex && !bodyRegex.test(body)) {
            throw new Error(`Expected body regex: ${expectBodyRegex}, actual body: ${body}`);
          }

          core.setOutput("response", body);
          core.setOutput("headers", response.message.rawHeaders);

          return;
        }
      } catch (e) {
        core.debug(e.message);
        error = e;
      }

      await delay(interval);
    }

    core.setFailed(error?.message || "Waiting exceeded timeout.");
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
