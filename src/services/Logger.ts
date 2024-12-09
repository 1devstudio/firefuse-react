export class Logger {
  constructor(private readonly debug: boolean) {
  }

  log(...args: any[]) {
    if (this.debug) {
      console.log(...args);
    }
  }

  error(...args: any[]) {
    console.error(...args);
  }
}
