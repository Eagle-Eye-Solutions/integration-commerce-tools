import { Logger } from '@nestjs/common';
import { SubscriptionService } from '../common/providers/commercetools/subscription/subscription.service';
import { Command, CommandRunner, Option } from 'nest-commander';

@Command({
  name: 'subscriptions-create',
  description: 'Creates the required subscriptions in commercetools',
})
export class SubscriptionsCommand extends CommandRunner {
  private readonly logger = new Logger(SubscriptionsCommand.name);

  constructor(private readonly subscriptionService: SubscriptionService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: { delete: false },
  ): Promise<void> {
    if (options?.delete) {
      try {
        await this.subscriptionService.deleteAllSubscriptions();
        this.logger.log('Deleted subscriptions in commercetools');
      } catch (e) {
        this.logger.error('Error deleting subscriptions in commercetools', e);
      }
    } else {
      try {
        await this.subscriptionService.createUpdateAllSubscriptions();
        this.logger.log('Created/Updated subscriptions in commercetools');
      } catch (e) {
        this.logger.error('Error creating subscriptions in commercetools', e);
      }
    }
  }

  @Option({
    flags: '-d, --delete',
    description: 'Delete subscriptions related to the integration',
  })
  doDelete(): boolean {
    return true;
  }
}
