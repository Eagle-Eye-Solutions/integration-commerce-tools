import { OrderUpdateAction } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/order';
import { CartUpdateAction } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';

export type ActionsSupported = OrderUpdateAction | CartUpdateAction;

export class CTActionsBuilder {
  private actions: ActionsSupported[] = [];

  add(action: ActionsSupported) {
    this.actions.push(action);
    return this;
  }

  addAll(actions: ActionsSupported[]) {
    this.actions.push(...actions);
    return this;
  }

  build(): { actions: ActionsSupported[] } {
    return {
      actions: this.actions,
    };
  }
}
