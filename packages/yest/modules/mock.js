export function mock(target) {
  if (target._isMock) {
    return target;
  }
  let fn = function (...args) {
    return fn._implementation(...args);
  };
  fn._isMock = true;
  fn._implementation = () => {
    throw new Error('mock is not configured');
  };
  fn.returnValue = (v) => {
    fn._implementation = () => v;
  };
  return fn;
}

// IDEA default function mock implementation is to throw error about mock not being configured
// export function mock(target) {
//   // body...
// }

// function mockPrototype() {
//   return {
//     // build on top useImplementation()
//     returnValue() {},
//     throwError() {},
//     resolveValue() {},
//     rejectValue() {},
//     useImplementation() {},
//   };
// }
