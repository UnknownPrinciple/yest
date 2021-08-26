import chalk from 'chalk';

export function report(file, results) {
  console.log(chalk.magenta(file));
  for (let result of results) {
    switch (result.type) {
      case 'success':
        console.log(
          ' ',
          chalk.green('✓'),
          chalk.green(result.name),
          result.duration > 1 ? chalk.grey(`(${result.duration | 0}ms)`) : '',
        );
        break;
      case 'failure':
        console.log(' ', chalk.red('✗'), chalk.red(result.name));
        console.error(result.error);
        break;
    }
  }
}
