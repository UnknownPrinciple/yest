#!/usr/bin/env node --experimental-vm-modules --experimental-import-meta-resolve --trace-warnings
import { main } from './runner.js';

let root = process.cwd();
main(root);
