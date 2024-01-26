import { Injectable, Logger } from '@nestjs/common';
import { Commercetools } from '../../../common/providers/commercetools/commercetools.provider';
import { Subscription } from '@commercetools/platform-sdk';
import { subscriptions } from '../../../common/constants/commercetools';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private updatedSubscriptions: Subscription[] = [];

  constructor(private readonly commercetools: Commercetools) {}

  async createUpdateAllSubscriptions(): Promise<any> {
    for (const subscription of subscriptions) {
      this.logger.log(
        `Creating/Updating "${subscription.resource}" subscription with key: ${subscription.key}`,
      );
      await this.createUpdateSubscription(subscription);
    }
  }

  async createUpdateSubscription(subscription) {
    let getSubscription: Subscription;
    try {
      getSubscription = await this.commercetools.getSubscriptionByKey(
        subscription.key,
      );
    } catch (e) {
      if (e.statusCode) {
        this.logger.log(
          `No subscription found with key "${subscription.key}", creating.`,
        );
        let newSubscription;
        try {
          newSubscription = await this.commercetools.createSubscription({
            key: subscription.key,
            destination: {
              type: 'GoogleCloudPubSub',
              topic: process.env.CONNECT_GCP_TOPIC_NAME,
              projectId: process.env.CONNECT_GCP_PROJECT_ID,
            },
            messages: [
              {
                resourceTypeId: subscription.resource,
                types: subscription.types,
              },
            ],
            changes: subscription.changes.map((c) => {
              return {
                resourceTypeId: c,
              };
            }),
          });

          this.logger.debug({
            message: `Subscription with key "${subscription.key}" created`,
            body: newSubscription,
          });

          return newSubscription;
        } catch (err) {
          const errorMsg = `Subscription with key "${subscription.key}" could not be created`;
          this.logger.error({
            msg: errorMsg,
            statusCode: err.statusCode,
            body: err.body,
          });
          throw new Error(errorMsg);
        }
      }
    }

    const existingSubscription = getSubscription;
    try {
      const updatedSubscription = await this.commercetools.updateSubscription(
        existingSubscription.key,
        {
          version: existingSubscription.version,
          actions: [
            {
              action: 'setMessages',
              messages: [
                {
                  resourceTypeId: subscription.resource,
                  types: subscription.types,
                },
              ],
            },
            {
              action: 'setChanges',
              changes: subscription.changes.map((c) => {
                return {
                  resourceTypeId: c,
                };
              }),
            },
            {
              action: 'changeDestination',
              destination: {
                type: 'GoogleCloudPubSub',
                topic: process.env.CONNECT_GCP_TOPIC_NAME,
                projectId: process.env.CONNECT_GCP_PROJECT_ID,
              },
            },
          ],
        },
      );
      this.updatedSubscriptions.push(updatedSubscription);
      this.logger.log({
        msg: `Subscription with key "${subscription.key}" updated`,
        type: subscription.types,
      });
    } catch (err) {
      const errorMsg = `Subscription with key "${subscription.key}" could not be updated`;
      this.logger.error({
        msg: errorMsg,
        statusCode: err.statusCode,
        body: err.body,
      });
      throw new Error(errorMsg);
    }

    return this.updatedSubscriptions;
  }

  async deleteAllSubscriptions(): Promise<any> {
    const ctSubscriptions: Subscription[] =
      await this.commercetools.querySubscriptions({
        queryArgs: {
          where: `key = "${subscriptions
            .map((sub) => sub.key)
            .join('" or key = "')}"`,
        },
      });

    for (const sub of subscriptions) {
      const existingSubscription = ctSubscriptions.find(
        (s) => s.key === sub.key,
      );
      if (existingSubscription) {
        try {
          await this.commercetools.deleteSubscription(
            sub.key,
            existingSubscription.version,
          );
        } catch (error) {
          this.logger.error(
            `Failed to delete ${sub.key} subscription: ${error.message}`,
          );
        }
      }
    }
  }
}
