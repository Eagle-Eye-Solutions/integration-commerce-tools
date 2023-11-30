export type EEApiErrorType =
  | 'EE_API_UNAVAILABLE'
  | 'EE_API_TIMEOUT'
  | 'EE_API_DISCONNECTED';

export class EagleEyeApiException extends Error {
  constructor(
    readonly type: EEApiErrorType,
    message: string,
  ) {
    super(message);
  }
}
