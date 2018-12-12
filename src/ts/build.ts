import { exec } from "child_process";

import { Logger } from "./helper";
import { Netlify} from "./netlify";

export class Build {

  public static async from (netlifyConfig: Netlify.Config): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Logger.info("build started");
      const buildCommand = Build.objectToEnvironmentVariables(netlifyConfig.build.environment) + netlifyConfig.build.command;
      const result = exec(buildCommand, (error, stdout, stderr) => {
        if(error) {
          Logger.error("build failed");
          console.log(stderr);
          return reject();
        } else {
          Logger.good("build complete");
          console.log(stdout);
          return resolve();
        }
      });
    })
  }

  private static objectToEnvironmentVariables = (obj: { [key: string]: any }): string => {
    return Object.keys(obj).reduce((result, key) =>  `${result}${key}="${obj[key]}" `, "");
  }
}
