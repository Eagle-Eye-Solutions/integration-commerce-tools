export type EEApiErrorType =
  | 'EE_API_UNAVAILABLE'
  | 'EE_API_TIMEOUT'
  | 'EE_API_DISCONNECTED'
  | 'EE_IDENTITY_NOT_FOUND';

export class EagleEyeApiException extends Error {
  constructor(
    readonly type: EEApiErrorType,
    message: string,
  ) {
    super(message);
  }
}
