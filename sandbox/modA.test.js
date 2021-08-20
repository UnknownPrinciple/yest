/** @mock ./modB.js */
/** @mock ./mods/modC.js */
import { transform, proxy } from './modA.js';
import { sum } from './modB.js';
import { readFile } from 'fs/promises';

test('transform fn', () => {
  // TODO should immediately throw if mock is used without configuration
  mock(sum).returnValue(10);
  expect(transform('0')).toBe(10);
});

test('transform fn 2', () => {
  let a = {};
  // TODO should refresh mock between tests
  mock(sum).returnValue(a);
  expect(transform('0')).toBe(a);
});

test('proxy', () => {
  expect(proxy()).toBe(42);
});
