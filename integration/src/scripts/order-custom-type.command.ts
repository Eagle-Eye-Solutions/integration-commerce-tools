import { Logger } from '@nestjs/common';
import { CustomTypeService } from '../providers/commercetools/custom-type/custom-type.service';
import { ORDER_CUSTOM_FIELDS } from '../providers/commercetools/custom-type/custom-type-definitions';
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
      this.logger.log(
        `Creating/Updating order custom type with key: ${ORDER_CUSTOM_FIELDS.key}`,
      );
      await this.customTypeService.create(ORDER_CUSTOM_FIELDS);
      this.logger.log('Created/Updated order custom type in commercetools');
    } catch (e) {
      this.logger.error(
        'Error creating Order custom types in commercetools',
        e,
      );
    }
  }
}
