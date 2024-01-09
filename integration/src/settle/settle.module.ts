import { Module, NestModule, forwardRef } from '@nestjs/common';
import { OrderSettleService } from './services/order-settle/order-settle.service';
import { AppModule } from '../app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [],
  providers: [OrderSettleService],
  exports: [OrderSettleService],
})
export class SettleModule implements NestModule {
  configure(): any {}
}
