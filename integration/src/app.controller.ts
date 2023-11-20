import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async handleExtensionRequest(@Body() body): Promise<any> {
    return await this.appService.handleExtensionRequest(body);
  }
}
