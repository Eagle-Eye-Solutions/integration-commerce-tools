import { Controller, Post, Body } from '@nestjs/common';
import { OrderSubscriptionService } from '../services/order-subscription/order-subscription.service';

@Controller()
export class SettleController {
  constructor(
    private readonly orderSubscriptionService: OrderSubscriptionService,
  ) {}
  @Post('events')
  async handleSubscriptionEvents(@Body() body): Promise<any> {
    let message = body;
    if (body?.message?.data) {
      message = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    }
    return this.orderSubscriptionService.handleOrderSubscriptionEvents(message);
  }
}
