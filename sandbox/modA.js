import { sum } from './modB.js';

export function transform(a) {
  let t = parseInt(a, 10);
  return sum(t, 2);
}
