/** @mock ./modB.js */
import { transform } from './modA.js';
import { sum } from './modB.js';

test('transform fn', () => {
  mock(sum).returnValue(10);
  expect(transform('0')).toBe(10);
});
