// TODO add it() and describe()
export function createTest(results) {
  return async (name, fn) => {
    // TODO skippers
    try {
      await fn();
      results.push({ name, type: 'success' });
    } catch (error) {
      results.push({ name, type: 'failure', error });
    }
  };
}
