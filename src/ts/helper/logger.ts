export class Logger {
  static silent = () => process.env.SILENT === "true";

  public static info (...args: any[]): void {
    if(!Logger.silent()) {
      console.log(...args);
    }
  }

  public static error (...args: any[]): void {
    if(!Logger.silent()) {
      console.error(...args);
    }
  }
}
