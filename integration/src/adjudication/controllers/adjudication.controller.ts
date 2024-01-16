import { Controller, Post, Body } from '@nestjs/common';
import { CartExtensionService } from '../services/cart-extension/cart-extension.service';
import { BasketCleanupService } from '../services/basket-cleanup-service/basket-cleanup.service';

@Controller()
export class AdjudicationController {
  constructor(
    private readonly cartExtensionService: CartExtensionService,
    private readonly basketCleanupService: BasketCleanupService,
  ) {}

  @Post('/cart/service')
  async handleExtensionRequest(@Body() body): Promise<any> {
    return this.cartExtensionService.handleCartExtensionRequest(body);
  }

  @Post('/jobs/stored-basket-cleanup')
  async handleStoredBaskedCleanup(): Promise<any> {
    return this.basketCleanupService.clearOldBaskets();
  }
}
