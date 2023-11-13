import { Controller, Post, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { EagleEye } from './providers/eagleeye/eagleeye.provider';

@Controller()
export class AppController {
  private eagleEye = new EagleEye(this.logger)
    .withCredentials({
      clientId: this.configService.get('eagleEye.clientId'),
      clientSecret: this.configService.get('eagleEye.clientSecret'),
    })
    .getClient();

  constructor(
    private readonly appService: AppService,
    private configService: ConfigService,
    private logger: Logger,
  ) {}

  @Post()
  handleExtensionRequest(): any {
    return { actions: [] };
  }
}
