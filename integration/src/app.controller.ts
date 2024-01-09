import { Controller, Post, Body } from '@nestjs/common';
import { CartExtensionService } from './common/services/cart-extension/cart-extension.service';

@Controller()
export class AppController {
  constructor(private readonly cartExtensionService: CartExtensionService) {}

  @Post('/cart/service')
  async handleExtensionRequest(@Body() body): Promise<any> {
    return this.cartExtensionService.handleCartExtensionRequest(body);
  }
}
