import { sum } from './modB.js';
import vars from './mods/modC.js';

export function transform(a) {
  let t = parseInt(a, 10);
  return sum(t, 2);
}

export function proxy() {
  return vars();
}
