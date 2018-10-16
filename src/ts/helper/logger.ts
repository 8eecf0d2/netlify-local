export class Logger {
  static active = () => !(process.env.SILENT === "true");

  public static info (...args: any[]): void {
    if(Logger.active()) {
      console.log(...args);
    }
  }

  public static error (...args: any[]): void {
    if(Logger.active()) {
      console.error(...args);
    }
  }
}
