import { Controller, Post, Body } from '@nestjs/common';
import { CartExtensionService } from '../services/cart-extension/cart-extension.service';

@Controller()
export class AdjudicationController {
  constructor(private readonly cartExtensionService: CartExtensionService) {}

  @Post('/cart/service')
  async handleExtensionRequest(@Body() body): Promise<any> {
    return this.cartExtensionService.handleCartExtensionRequest(body);
  }
}
