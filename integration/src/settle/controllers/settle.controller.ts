import { Controller, Post, Body, Res } from '@nestjs/common';
import { OrderSubscriptionService } from '../services/order-subscription/order-subscription.service';
import { Response } from 'express';

@Controller()
export class SettleController {
  constructor(
    private readonly orderSubscriptionService: OrderSubscriptionService,
  ) {}
  @Post('events')
  async handleSubscriptionEvents(
    @Body() body,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    let message = body;
    if (body?.message?.data) {
      message = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    }
    const subscriptionResult =
      await this.orderSubscriptionService.handleOrderSubscriptionEvents(
        message,
      );
    res.status(subscriptionResult.statusCode);
    return subscriptionResult.result;
  }
}
