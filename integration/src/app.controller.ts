import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('service')
  async handleExtensionRequest(@Body() body): Promise<any> {
    return this.appService.handleExtensionRequest(body);
  }

  @Post('events')
  async handleSubscriptionEvents(@Body() body): Promise<any> {
    //handling Pub/Sub events
    let message = body;
    if (body.message.data) {
      message = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    }
    return this.appService.handleSubscriptionEvents(message);
  }
}
