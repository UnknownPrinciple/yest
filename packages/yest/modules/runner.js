import { SourceTextModule, SyntheticModule, createContext } from 'vm';
import { readFile } from 'fs/promises';
import { resolve, dirname, basename } from 'path';
import chalk from 'chalk';
import glob from 'tiny-glob';
import fileUrl from 'file-url';
import { mock } from './mock.js';
import { createTest } from './suite.js';

export async function main(root) {
  let files = await glob('**/*.test.js', { cwd: root });
  for (let file of files) {
    console.log('running', file, 'from', root);
    run(file);
  }
}

async function run(file) {
  let suiteAPI = createTest((error, results) => {
    if (error != null) {
      console.error(error);
    }
    for (let result of results) {
      switch (result.type) {
        case 'success':
          console.log(
            '  ',
            chalk.green('✓'),
            chalk.green(result.name),
            result.duration > 1 ? chalk.grey(`(${result.duration | 0}ms)`) : '',
          );
          break;
        case 'failure':
          console.log('  ', chalk.red('✗'), chalk.red(result.name));
          console.error(result.error);
          break;
      }
    }
  });
  let context = createContext({ ...global, console, ...suiteAPI, mock });
  let identifier = fileUrl(file, { resolve: true });
  let code = await readFile(new URL(identifier), 'utf-8');
  let mocks = await parseMocks(code, identifier);
  let cache = new Map();
  let suite = new SourceTextModule(code, { identifier, context });

  function instantiateModule(identifier) {
    if (mocks.includes(identifier)) {
      return createMockModule(identifier, context);
    } else if (identifier.startsWith('node:')) {
      return extractNodeModule(identifier, context);
    } else if (identifier.startsWith('file:')) {
      return createSourceModule(identifier, context);
    } else {
      throw new Error(`Unsupported module protocol for ${identifier}`);
    }
  }

  await suite.link(async (specifier, referencingModule) => {
    let identifier = await import.meta.resolve(specifier, new URL(referencingModule.identifier));
    if (cache.has(identifier)) {
      return cache.get(identifier);
    }
    let modulePromise = instantiateModule(identifier);
    cache.set(identifier, modulePromise);
    return modulePromise;
  });

  try {
    await suite.evaluate();
  } catch (error) {
    console.log(error);
  }
}

function parseMocks(code, identifier) {
  return Promise.all(
    code.match(/@mock\s([^\s$*]+)/gm).map((s) => {
      return import.meta.resolve(s.slice(6), new URL(identifier));
    }),
  );
}

async function createMockModule(identifier, context) {
  if (!identifier.startsWith('file:')) {
    throw new Error(`Unsupported module mocks for ${identifier}, for now`);
  }
  try {
    let filepath = new URL(identifier).pathname;
    let mockFilepath = resolve(dirname(filepath), '__mocks__', basename(filepath));
    let code = await readFile(mockFilepath, 'utf-8');
    return new SourceTextModule(code, { identifier: fileUrl(mockFilepath), context });
  } catch (error) {
    let original = await import(identifier);
    let keys = Object.keys(original);
    let mod = new SyntheticModule(
      keys,
      () => keys.forEach((key) => mod.setExport(key, mock(original[key]))),
      { identifier, context },
    );
    return mod;
  }
}

async function extractNodeModule(identifier, context) {
  let original = await import(identifier);
  let keys = Object.keys(original);
  let mod = new SyntheticModule(
    keys,
    () => keys.forEach((key) => mod.setExport(key, original[key])),
    { identifier, context },
  );
  return mod;
}

async function createSourceModule(identifier, context) {
  let code = await readFile(new URL(identifier), 'utf-8');
  return new SourceTextModule(code, { identifier, context });
}
