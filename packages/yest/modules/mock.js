import { getCurrentMemory } from './suite.js';

export function mock(target) {
  if (target._isMock) {
    return target;
  }
  if (typeof target === 'function') {
    return mockFn();
  }
  throw new Error('Unsupported mock target ' + typeof target);
}

function mockFn() {
  let calls = [];
  let fn = function (...args) {
    calls.push(args);
    let memory = getCurrentMemory();
    let implementation = memory.get(fn);
    if (implementation == null) {
      throw new Error('mock is not configured');
    }
    return implementation(...args);
  };
  fn._isMock = true;
  fn.useImplementation = (impl) => {
    let memory = getCurrentMemory();
    memory.set(fn, impl);
  };
  fn.returnValue = (v) => {
    fn.useImplementation(() => v);
  };
  fn.throwError = (e) => {
    fn.useImplementation(() => {
      throw e;
    });
  };
  return fn;
}
