export type EEApiErrorType =
  | 'EE_API_UNAVAILABLE'
  | 'EE_API_TIMEOUT'
  | 'EE_API_DISCONNECTED'
  | 'EE_IDENTITY_NOT_FOUND'
  | 'EE_API_SETTLE_POTENTIAL_ISSUES'
  | 'EE_API_SETTLE_ERROR'
  | 'EE_BAD_REQUEST'
  | 'EE_UNEXPECTED_ERROR'
  | 'AXIOS_NO_RESPONSE_ERROR';

export class EagleEyeApiException extends Error {
  constructor(
    readonly type: EEApiErrorType,
    message: string,
  ) {
    super(message);
  }
}
