import { CTActionsBuilder, ActionsSupported } from './ActionsBuilder';

describe('CTActionsBuilder', () => {
  let builder: CTActionsBuilder;

  beforeEach(() => {
    builder = new CTActionsBuilder();
  });

  it('should add an action', () => {
    const action: ActionsSupported = {
      action: 'setCustomType',
    };

    builder.add(action);

    const result = builder.build();

    expect(result.actions).toContain(action);
  });

  it('should add multiple actions', () => {
    const actions: ActionsSupported[] = [
      { action: 'setCustomType' },
      { action: 'setCustomField', name: 'someName' },
    ];

    builder.addAll(actions);

    const result = builder.build();

    expect(result.actions).toEqual(actions);
  });
});
