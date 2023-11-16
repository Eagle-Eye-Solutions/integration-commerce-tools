import { Controller, Post, Logger, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { PromotionsService } from './services/promotions/promotions.service';
import { HttpService } from '@nestjs/axios';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private configService: ConfigService,
    private logger: Logger,
    private promotions: PromotionsService,
    private httpService: HttpService,
  ) {}

  @Post()
  async handleExtensionRequest(@Body() body): Promise<any> {
    return await this.appService.handleExtensionRequest(body);
  }
}
