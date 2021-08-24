let memory = null;

export function getCurrentMemory() {
  return memory;
}

export function createTest(cb) {
  let queue = [];
  let results = [];
  let isFlushing = false;
  function flush() {
    isFlushing = true;
    // assuming no top level await happens in test file
    setTimeout(runTests, 0);
  }
  async function runTests() {
    for await (let { name, fn } of queue) {
      try {
        memory = new Map();
        await fn();
        results.push({ name, type: 'success' });
      } catch (error) {
        results.push({ name, type: 'failure', error });
      }
    }
    cb(results);
  }
  async function test(name, fn) {
    queue.push({ name, fn });
    if (!isFlushing) flush();
  }
  return { test };
}
