import { Injectable } from '@nestjs/common';
import { ClientBuilder } from '@commercetools/sdk-client-v2';
import {
  createApiBuilderFromCtpClient,
  ExtensionDraft,
  Extension,
  ExtensionUpdateAction,
} from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import {
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
} from '@commercetools/sdk-client-v2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Commercetools {
  private root: ByProjectKeyRequestBuilder;

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
  private createClient = () =>
    new ClientBuilder()
      .withProjectKey(this.configService.get('commercetools.projectKey'))
      .withClientCredentialsFlow(
        this.getAuthMiddlewareOptions(this.configService),
      )
      .withHttpMiddleware(this.getHttpMiddlewareOptions(this.configService))
      .build();

  /**
   * Create client with apiRoot
   * apiRoot can now be used to build requests to de Composable Commerce API
   */
  public getApiRoot = (() => () => {
    if (this.root) {
      return this.root;
    }

    this.root = createApiBuilderFromCtpClient(
      this.createClient(),
    ).withProjectKey({
      projectKey: this.configService.get('commercetools.projectKey'),
    });

    return this.root;
  })();

  /**
   * Example code to get the Project details
   * This code has the same effect as sending a GET
   * request to the commercetools Composable Commerce API without any endpoints.
   *
   * @returns {Promise<ClientResponse<Project>>} apiRoot
   */
  public getProject = async () => {
    return await this.getApiRoot().get().execute();
  };

  public async queryExtensions(methodArgs: any): Promise<Extension[]> {
    return (await this.getApiRoot().extensions().get(methodArgs).execute()).body
      .results;
  }

  public async createExtension(body: ExtensionDraft) {
    await this.getApiRoot().extensions().post({ body }).execute();
  }

  public async updateExtension(
    key: string,
    body: {
      version: number;
      actions: ExtensionUpdateAction[];
    },
  ) {
    await this.getApiRoot()
      .extensions()
      .withKey({ key })
      .post({ body })
      .execute();
  }

  public async deleteExtension(key: string, version: number) {
    await this.getApiRoot()
      .extensions()
      .withKey({ key })
      .delete({ queryArgs: { version } })
      .execute();
  }
}
