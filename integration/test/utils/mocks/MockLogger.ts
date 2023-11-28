import { Logger } from '@nestjs/common';

export class MockLogger extends Logger {
  private logs: string[] = [];

  log(message: string) {
    this.logs.push(message);
  }

  error(message: string) {
    this.logs.push(message);
  }

  warn(message: string) {
    this.logs.push(message);
  }

  debug(message: string) {
    this.logs.push(message);
  }

  verbose(message: string) {
    this.logs.push(message);
  }

  getLogs() {
    return this.logs;
  }
}
