import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('service')
  async handleExtensionRequest(@Body() body): Promise<any> {
    return await this.appService.handleExtensionRequest(body);
  }

  @Post('events')
  async handleSubscriptionEvents(@Body() body): Promise<any> {
    return await this.appService.handleSubscriptionEvents(body);
  }
}
