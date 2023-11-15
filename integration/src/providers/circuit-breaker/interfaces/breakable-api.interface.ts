export interface BreakableApi {
  callApi: (...args: any[]) => Promise<any>;
}
