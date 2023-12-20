import { Logger } from '@nestjs/common';
import { CustomTypeService } from '../providers/commercetools/custom-type/custom-type.service';
import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'order-custom-type-create',
  description: 'Creates the required order custom type in commercetools',
})
export class OrderCustomTypeCommand extends CommandRunner {
  private readonly logger = new Logger(OrderCustomTypeCommand.name);

  constructor(private readonly customTypeService: CustomTypeService) {
    super();
  }

  async run(): Promise<void> {
    try {
      await this.customTypeService.createAllTypes();
      this.logger.log('Created/Updated order custom type in commercetools');
    } catch (e) {
      this.logger.error('Error creating custom types in commercetools', e);
    }
  }
}
