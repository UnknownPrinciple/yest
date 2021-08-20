export function expect(actual) {
  return {
    // TODO more matchers
    toBe(expected) {
      if (actual !== expected) {
        // QUESTION can I build this on top of node assert?
        // TODO should be custom error class to be able to pass more data
        throw new Error(`Expected ${expected} but received ${actual}`);
      }
    },
  };
}

// export function expect(target) {
//   return new Expect(target);
// }

// class Expect {
//   constructor(actual) {
//     this.actual = actual;
//   }
//   toBe(expected) {}
//   toEqual(expected) {}
//   toMatch(regex) {}
//   toInclude(item) {}
//   toThrow(error) {}
//   toReject(expected) {}
//   toResolve(expected) {}
//   toBeInstanceOf() {}
//   toHaveBeenCalled() {}
//   toHaveBeenCalledWith(...args) {}
//   toHaveBeenCalledTimes(count) {}
// }
