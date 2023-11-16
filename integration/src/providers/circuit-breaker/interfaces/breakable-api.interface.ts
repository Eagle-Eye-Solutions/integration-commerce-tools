export interface BreakableApi {
  invoke: (...args: any[]) => Promise<any>;
}
