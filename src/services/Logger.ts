export class Logger {
  constructor(private readonly debug: boolean) {}

  log(...args: unknown[]) {
    if (this.debug) {
      console.log(...args);
    }
  }

  error(...args: unknown[]) {
    console.error(...args);
  }
}
