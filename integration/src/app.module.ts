import { Module } from '@nestjs/common';
import { AdjudicationModule } from './adjudication/adjudication.module';
import { SettleModule } from './settle/settle.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [CommonModule, AdjudicationModule, SettleModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
