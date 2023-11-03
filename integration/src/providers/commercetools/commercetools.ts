import { Injectable } from '@nestjs/common';
import { ClientBuilder } from '@commercetools/sdk-client-v2';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import {
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
} from '@commercetools/sdk-client-v2';
import { ConfigService } from '@nestjs/config';

let root: ByProjectKeyRequestBuilder;

@Injectable()
export class Commercetools {
  constructor(private configService: ConfigService) {}

  private getAuthMiddlewareOptions(
    configService: ConfigService,
  ): AuthMiddlewareOptions {
    return {
      host: `https://auth.${configService.get(
        'commercetools.region',
      )}.commercetools.com`,
      projectKey: configService.get('commercetools.projectKey'),
      credentials: {
        clientId: configService.get('commercetools.clientId'),
        clientSecret: configService.get('commercetools.clientSecret'),
      },
      scopes: configService.get<string[]>('commercetools.scopes'),
    };
  }

  private getHttpMiddlewareOptions(
    configService: ConfigService,
  ): HttpMiddlewareOptions {
    return {
      host: `https://api.${configService.get(
        'commercetools.region',
      )}.commercetools.com`,
    };
  }
  /**
   * Create a new client builder.
   * This code creates a new Client that can be used to make API calls
   */
  createClient = () =>
    new ClientBuilder()
      .withProjectKey(process.env.CTP_PROJECT_KEY)
      .withClientCredentialsFlow(
        this.getAuthMiddlewareOptions(this.configService),
      )
      .withHttpMiddleware(this.getAuthMiddlewareOptions(this.configService))
      .build();

  /**
   * Create client with apiRoot
   * apiRoot can now be used to build requests to de Composable Commerce API
   */
  createApiRoot = (() => () => {
    if (root) {
      return root;
    }

    root = createApiBuilderFromCtpClient(this.createClient()).withProjectKey({
      projectKey: this.configService.get('commercetools.projectKey'),
    });

    return root;
  })();

  /**
   * Example code to get the Project details
   * This code has the same effect as sending a GET
   * request to the commercetools Composable Commerce API without any endpoints.
   *
   * @returns {Promise<ClientResponse<Project>>} apiRoot
   */
  getProject = async () => {
    return await this.createApiRoot().get().execute();
  };
}
