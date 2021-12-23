import colors from 'picocolors';

export function report(file, results) {
  console.log(colors.magenta(file));
  for (let result of results) {
    switch (result.type) {
      case 'success':
        console.log(
          ' ',
          colors.green('✓'),
          colors.green(result.name),
          result.duration > 1 ? colors.gray(`(${result.duration | 0}ms)`) : '',
        );
        break;
      case 'failure':
        console.log(' ', colors.red('✗'), colors.red(result.name));
        console.error(result.error);
        break;
    }
  }
}
