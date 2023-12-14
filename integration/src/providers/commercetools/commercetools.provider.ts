import { Injectable, Logger } from '@nestjs/common';
import {
  type AuthMiddlewareOptions,
  ClientBuilder,
  type HttpMiddlewareOptions,
} from '@commercetools/sdk-client-v2';
import {
  createApiBuilderFromCtpClient,
  Extension,
  ExtensionDraft,
  ExtensionUpdateAction,
  ShippingMethod,
  Subscription,
  SubscriptionDraft,
  SubscriptionUpdateAction,
  Order,
  OrderUpdateAction,
} from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Commercetools {
  private readonly logger = new Logger(Commercetools.name);

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
    this.logger.log('Creating new commercetools client');
    this.root = createApiBuilderFromCtpClient(
      this.createClient(),
    ).withProjectKey({
      projectKey: this.configService.get('commercetools.projectKey'),
    });

    return this.root;
  })();

  public async queryExtensions(methodArgs: any): Promise<Extension[]> {
    return (await this.getApiRoot().extensions().get(methodArgs).execute()).body
      .results;
  }

  public async createExtension(body: ExtensionDraft): Promise<Extension> {
    return (await this.getApiRoot().extensions().post({ body }).execute()).body;
  }

  public async updateExtension(
    key: string,
    body: {
      version: number;
      actions: ExtensionUpdateAction[];
    },
  ): Promise<Extension> {
    return (
      await this.getApiRoot()
        .extensions()
        .withKey({ key })
        .post({ body })
        .execute()
    ).body;
  }

  public async deleteExtension(key: string, version: number) {
    return await this.getApiRoot()
      .extensions()
      .withKey({ key })
      .delete({ queryArgs: { version } })
      .execute();
  }

  public async querySubscriptions(
    methodArgs: any = {},
  ): Promise<Subscription[]> {
    return (await this.getApiRoot().subscriptions().get(methodArgs).execute())
      .body.results;
  }

  public async createSubscription(
    body: SubscriptionDraft,
  ): Promise<Subscription> {
    return (await this.getApiRoot().subscriptions().post({ body }).execute())
      .body;
  }

  public async updateSubscription(
    key: string,
    body: {
      version: number;
      actions: SubscriptionUpdateAction[];
    },
  ): Promise<Subscription> {
    return (
      await this.getApiRoot()
        .subscriptions()
        .withKey({ key })
        .post({ body })
        .execute()
    ).body;
  }

  public async deleteSubscription(key: string, version: number) {
    return await this.getApiRoot()
      .subscriptions()
      .withKey({ key })
      .delete({ queryArgs: { version } })
      .execute();
  }

  public async getShippingMethods(methodArgs: any): Promise<ShippingMethod[]> {
    return (await this.getApiRoot().shippingMethods().get(methodArgs).execute())
      .body.results;
  }

  public async getOrderById(orderId: string): Promise<Order> {
    return (
      await this.getApiRoot().orders().withId({ ID: orderId }).get().execute()
    ).body;
  }

  public async updateOrderById(
    orderId: string,
    body: { version: number; actions: OrderUpdateAction[] },
  ): Promise<Order> {
    return (
      await this.getApiRoot()
        .orders()
        .withId({ ID: orderId })
        .post({ body })
        .execute()
    ).body;
  }
}
