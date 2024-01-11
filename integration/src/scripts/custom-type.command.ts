import { Logger } from '@nestjs/common';
import { CustomTypeService } from '../common/providers/commercetools/custom-type/custom-type.service';
import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'custom-type-create',
  description: 'Creates the required custom types in commercetools',
})
export class CustomTypeCommand extends CommandRunner {
  private readonly logger = new Logger(CustomTypeCommand.name);

  constructor(private readonly customTypeService: CustomTypeService) {
    super();
  }

  async run(): Promise<void> {
    try {
      await this.customTypeService.createUpdateAllTypes();
      this.logger.log('Created/Updated custom types in commercetools');
    } catch (e) {
      this.logger.error('Error creating custom types in commercetools', e);
    }
  }
}
