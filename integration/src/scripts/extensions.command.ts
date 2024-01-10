import { Logger } from '@nestjs/common';
import { ExtensionService } from '../common/providers/commercetools/extension/extension.service';
import { Command, CommandRunner, Option } from 'nest-commander';

@Command({
  name: 'extensions-create',
  description: 'Creates the required extensions in commercetools',
})
export class ExtensionsCommand extends CommandRunner {
  private readonly logger = new Logger(ExtensionsCommand.name);

  constructor(private readonly extensionService: ExtensionService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: { delete: false },
  ): Promise<void> {
    if (options?.delete) {
      try {
        await this.extensionService.deleteAllExtensions();
        this.logger.log('Deleted extensions in commercetools');
      } catch (e) {
        this.logger.error('Error deleting extensions in commercetools', e);
      }
    } else {
      try {
        await this.extensionService.createUpdateAllExtensions();
        this.logger.log('Created/Updated extensions in commercetools');
      } catch (e) {
        this.logger.error('Error creating extensions in commercetools', e);
      }
    }
  }

  @Option({
    flags: '-d, --delete',
    description: 'Delete extensions related to the integration',
  })
  doDelete(): boolean {
    return true;
  }
}
