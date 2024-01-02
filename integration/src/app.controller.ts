import { Controller, Post, Body } from '@nestjs/common';
import { CartExtensionService } from './services/cart-extension/cart-extension.service';
import { OrderSubscriptionService } from './services/order-subscription/order-subscription.service';

@Controller()
export class AppController {
  constructor(
    private readonly cartExtensionService: CartExtensionService,
    private readonly orderSubscriptionService: OrderSubscriptionService,
  ) {}

  @Post('/cart/service')
  async handleExtensionRequest(@Body() body): Promise<any> {
    return this.cartExtensionService.handleCartExtensionRequest(body);
  }

  @Post('events')
  async handleSubscriptionEvents(@Body() body): Promise<any> {
    let message = body;
    if (body?.message?.data) {
      message = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    }
    return this.orderSubscriptionService.handleOrderSubscriptionEvents(message);
  }
}
