import { Module, NestModule, forwardRef } from '@nestjs/common';
import { LoyaltyService } from './services/loyalty/loyalty.service';
import { AppModule } from '../app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule implements NestModule {
  configure(): any {}
}
