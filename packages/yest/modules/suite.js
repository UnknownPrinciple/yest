let memory = null;

export function getCurrentMemory() {
  return memory;
}

export function createTest(cb) {
  let beforeQueue = [];
  let afterQueue = [];
  let beforeEachQueue = [];
  let afterEachQueue = [];
  let testsQueue = [];
  let results = [];
  let isFlushing = false;

  function flush() {
    isFlushing = true;
    // assuming no top level await happens in test file
    setTimeout(runTests, 0);
  }

  async function runTests() {
    try {
      for await (let fn of beforeQueue) await fn();
    } catch (error) {
      return cb(error);
    }

    for await (let { name, fn } of testsQueue) {
      try {
        memory = new Map();
        for await (let fn of beforeEachQueue) await fn();
        let start = performance.now();
        await fn();
        let duration = performance.now() - start;
        for await (let fn of afterEachQueue) await fn();
        results.push({ name, type: 'success', duration });
      } catch (error) {
        results.push({ name, type: 'failure', error });
      }
    }

    try {
      for await (let fn of afterQueue) await fn();
    } catch (error) {
      return cb(error);
    }

    cb(null, results);
  }

  function test(name, fn) {
    testsQueue.push({ name, fn });
    if (!isFlushing) flush();
  }

  function before(fn) {
    beforeQueue.push(fn);
  }

  function after(fn) {
    afterQueue.push(fn);
  }

  function beforeEach(fn) {
    beforeEachQueue.push(fn);
  }

  function afterEach(fn) {
    afterEachQueue.push(fn);
  }

  return { test, before, after, beforeEach, afterEach };
}
