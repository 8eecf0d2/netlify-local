import chalk from "chalk";

export class Logger {
  static active = () => !(process.env.SILENT === "true");

  public static info (...args: any[]): void {
    if(Logger.active()) {
      console.log(chalk.white("[netlify-local]"), ...args);
    }
  }

  public static good (...args: any[]): void {
    if(Logger.active()) {
      console.log(chalk.green("[netlify-local]"), ...args);
    }
  }

  public static error (...args: any[]): void {
    if(Logger.active()) {
      console.error(chalk.red("[netlify-local]"), ...args);
    }
  }
}
