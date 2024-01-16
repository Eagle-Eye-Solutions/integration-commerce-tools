import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../../../common/constants/constants';
import { CustomObjectService } from '../../../common/providers/commercetools/custom-object/custom-object.service';
import * as moment from 'moment';

@Injectable()
export class BasketCleanupService {
  private containerKey = CUSTOM_OBJECT_CONTAINER_BASKET_STORE;
  private logger = new Logger(BasketCleanupService.name);
  private limit = this.configService.get<number>(
    'storedBasketCleanup.objectQueryLimit',
  );
  private olderThanValue = this.configService.get<number>(
    'storedBasketCleanup.olderThanValue',
  );
  private olderThanUnit = this.configService.get<string>(
    'storedBasketCleanup.olderThanUnit',
  );

  constructor(
    private customObjectService: CustomObjectService,
    private configService: ConfigService,
  ) {}

  async clearOldBaskets(): Promise<any> {
    let oldCustomObjects: { key: string; lastModifiedAt: string }[] = [];
    let hasMore = false;
    const olderThanDate = moment
      .utc()
      .subtract(this.olderThanValue as any, this.olderThanUnit as any);
    this.logger.log(
      `Getting saved baskets up to ${olderThanDate} (older than ${this.olderThanValue} ${this.olderThanUnit} ago)`,
    );
    const results = {
      successful: [],
      failed: [],
    };
    do {
      const ctCustomObjects = await this.customObjectService.queryCustomObjects(
        {
          queryArgs: {
            withTotal: false,
            limit: this.limit,
            container: this.containerKey,
            offset: oldCustomObjects.length,
            where: `lastModifiedAt < "${olderThanDate.toISOString()}"`,
            sort: ['lastModifiedAt asc'],
          },
        },
      );
      hasMore = Boolean(ctCustomObjects.body.count === this.limit);
      const customObjects = ctCustomObjects.body.results.map((customObject) => {
        return {
          key: customObject.key,
          lastModifiedAt: customObject.lastModifiedAt,
        };
      });
      oldCustomObjects = oldCustomObjects.concat(customObjects);
      this.logger.log(
        `Got ${customObjects.length} baskets. New total: ${oldCustomObjects.length}`,
      );
      this.logger.log(
        `Preparing to remove ${customObjects.length} abandoned baskets.`,
      );
      for (const customObject of customObjects) {
        try {
          await this.customObjectService.deleteCustomObject(
            this.containerKey,
            customObject.key,
          );
          results.successful.push(customObject);
          this.logger.log(
            `Successfully removed basket with key ${customObject.key}, lastModifiedAt ${customObject.lastModifiedAt}`,
          );
        } catch (err) {
          results.failed.push(customObject);
          this.logger.error(
            `Failed to remove custom object with key ${customObject.key}, lastModifiedAt ${customObject.lastModifiedAt}`,
            err,
          );
        }
      }
    } while (hasMore);

    this.logger.log(
      `Finished removing old baskets. Results: ${results.successful.length} successful, ${results.failed.length} failed`,
      results,
    );

    return {
      results,
    };
  }
}
