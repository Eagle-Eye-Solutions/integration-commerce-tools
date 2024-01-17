import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { CartExtensionService } from '../services/cart-extension/cart-extension.service';
import { BasketCleanupService } from '../services/basket-cleanup-service/basket-cleanup.service';
import { UnhandledExceptionsFilter } from '../../common/exceptions/unhandled-exception.filter';

@Controller()
export class AdjudicationController {
  constructor(
    private readonly cartExtensionService: CartExtensionService,
    private readonly basketCleanupService: BasketCleanupService,
  ) {}

  @Post('/cart/service')
  @UseFilters(UnhandledExceptionsFilter)
  async handleExtensionRequest(@Body() body): Promise<any> {
    return this.cartExtensionService.handleCartExtensionRequest(body);
  }

  @Post('/jobs/stored-basket-cleanup')
  async handleStoredBaskedCleanup(): Promise<any> {
    return this.basketCleanupService.clearOldBaskets();
  }
}
