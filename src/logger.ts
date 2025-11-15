import chalk from "chalk";

export const logger = {
  error: (message: string) => console.log(chalk.red(message)),
  warn: (message: string) => console.log(chalk.yellow(message)),
  info: (message: string) => console.log(message),
};
