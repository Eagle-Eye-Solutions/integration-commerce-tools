import axios from 'axios';

/**
 * HTTP status from Axios errors. Axios 1.15+ may set `status` on AxiosError;
 * nock `replyWithError` payloads sometimes omit a full `response` object.
 */
export function getAxiosHttpStatus(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) {
    return err.response?.status ?? err.status;
  }
  const legacy = err as { response?: { status?: number }; status?: number };
  return legacy.response?.status ?? legacy.status;
}
