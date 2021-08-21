/** @mock ./modB.js */
/** @mock ./mods/modC.js */
import { transform, proxy } from './modA.js';
import { sum } from './modB.js';
import { readFile } from 'fs/promises';
import assert from 'assert';

test('transform fn', () => {
  // TODO should immediately throw if mock is used without configuration
  mock(sum).returnValue(10);
  assert.equal(transform('0'), 10);
});

test('transform fn 2', () => {
  let a = {};
  // TODO should refresh mock between tests
  mock(sum).returnValue(a);
  assert.equal(transform('0'), a);
});

test('proxy', () => {
  assert.equal(proxy(), 42);
});
