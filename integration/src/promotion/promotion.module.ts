import { Module, NestModule, forwardRef } from '@nestjs/common';
import { PromotionService } from './services/promotion/promotion.service';
import { AppModule } from '../app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionModule implements NestModule {
  configure(): any {}
}
