import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ExtensionTypeMiddleware } from '../common/middlewares/extension-type/extension-type.middleware';
import { UnidentifiedCustomerMiddleware } from './middlewares/unidentified-customer/unidentified-customer.middleware';
import { CartExtensionService } from './services/cart-extension/cart-extension.service';
import { ExtensionService } from '../common/providers/commercetools/extension/extension.service';
import { ExtensionsCommand } from '../scripts/extensions.command';
import { ExtensionLocalService } from '../common/services/commercetools/extension-local.service';
import { PromotionService } from './services/promotion/promotion.service';
import { LoyaltyService } from './services/loyalty/loyalty.service';
import { AdjudicationController } from './controllers/adjudication.controller';
import { AdjudicationMapper } from './mappers/adjudication.mapper';
import { LoyaltyMapper } from './mappers/loyalty.mapper';
import { QuestCampaignHandler } from './mappers/handlers/quest.campaign.handler';
import { BasketCleanupService } from './services/basket-cleanup-service/basket-cleanup.service';
import { CampaignNameService } from './services/promotion/campaign-name.service';
import { CartErrorService } from './services/cart-error/cart-error.service';

const providers = [
  CartExtensionService,
  ExtensionService,
  ExtensionsCommand,
  ExtensionLocalService,
  PromotionService,
  LoyaltyService,
  AdjudicationMapper,
  LoyaltyMapper,
  BasketCleanupService,
  CampaignNameService,
  QuestCampaignHandler,
  CartErrorService,
];

@Module({
  imports: [],
  controllers: [AdjudicationController],
  providers: providers,
  exports: providers,
})
export class AdjudicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(ExtensionTypeMiddleware, UnidentifiedCustomerMiddleware)
      .forRoutes({ path: '/cart-service', method: RequestMethod.POST });
  }
}
