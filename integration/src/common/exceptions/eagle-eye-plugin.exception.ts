export type PluginErrorType = 'BASKET_STORE_SAVE' | 'BASKET_STORE_DELETE';

export class EagleEyePluginException extends Error {
  constructor(
    readonly type: PluginErrorType,
    message: string,
  ) {
    super(message);
  }
}
