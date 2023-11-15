import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ActionsSupported } from './providers/commercetools/actions/ActionsBuilder';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  handleExtensionRequest(@Body() body: any): { actions: ActionsSupported[] } {
    return this.appService.handleExtensionRequest(body);
  }
}
