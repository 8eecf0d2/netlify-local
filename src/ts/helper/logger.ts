import chalk from "chalk";

export class Logger {
  public static active = () => !(process.env.SILENT === "true");

  public static raw(...args: Array<any>): void {
    if (Logger.active()) {
      // tslint:disable-next-line
      console.log(...args);
    }
  }
  public static info(...args: Array<any>): void {
    if (Logger.active()) {
      // tslint:disable-next-line
      console.log(chalk.white("[netlify-local]"), ...args);
    }
  }

  public static good(...args: Array<any>): void {
    if (Logger.active()) {
      // tslint:disable-next-line
      console.log(chalk.green("[netlify-local]"), ...args);
    }
  }

  public static error(...args: Array<any>): void {
    if (Logger.active()) {
      // tslint:disable-next-line
      console.error(chalk.red("[netlify-local]"), ...args);
    }
  }
}
