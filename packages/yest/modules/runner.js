import { SourceTextModule, SyntheticModule, createContext } from 'vm';
import { readFile } from 'fs/promises';
import { resolve, dirname, basename } from 'path';
import glob from 'tiny-glob';

export async function main(root) {
  let files = await glob('**/*.test.js', { cwd: root });
  for (let file of files) {
    run(file, root);
  }
}

async function run(file, root) {
  console.log('running', file, 'from', root);
  let results = [];
  // QUESTION can I use existing context but extended with "environment"?
  let context = createContext({
    console,
    // TODO add it() and describe()
    test: async (name, fn) => {
      // TODO skippers
      try {
        await fn();
        results.push({ name, type: 'success' });
      } catch (error) {
        results.push({ name, type: 'failure', error });
      }
    },
    // TODO should return an actual mock of something or the mock itself
    // mock(alreadyMock) -> alreadyMock
    // mock(fn) -> mockFn
    mock: (target) => {
      return {
        // TODO more API
        returnValue(v) {
          target.returnValue = v;
        },
      };
    },
    expect: (actual) => {
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
    },
  });
  let targetUrl = new URL(fileUrl(file, root));
  let code = await readFile(targetUrl, 'utf-8');
  let mocks = await parseMocks(code, targetUrl);
  let mocksMap = new Map();
  // nodeMap
  // modulesMap
  let mod = new SourceTextModule(code, { identifier: targetUrl.toString(), context });

  await mod.link(async (specifier, referencingModule) => {
    let resolvedPath = await import.meta.resolve(specifier, new URL(referencingModule.identifier));

    if (mocks.includes(resolvedPath)) {
      if (mocksMap.has(resolvedPath)) {
        return mocksMap.get(resolvedPath);
      }
      let mod = createMockModule(resolvedPath, context);
      mocksMap.set(resolvedPath, mod);
      return mod;
    }

    if (resolvedPath.startsWith('node:')) {
      // TODO memoize
      // TODO try synthetic
      throw new Error('implement me');
    }

    // TODO http modules

    // TODO memoize
    let code = await readFile(new URL(resolvedPath), 'utf-8');
    return new SourceTextModule(code, { identifier: resolvedPath, context });
  });

  try {
    await mod.evaluate();
    console.log(results);
  } catch (error) {
    console.log(error);
  }
}

function parseMocks(code, parentUrl) {
  return Promise.all(
    code.match(/@mock\s([^\s$*]+)/gm).map((s) => {
      return import.meta.resolve(s.slice(6), parentUrl);
    }),
  );
}

async function createMockModule(resolvedPath, context) {
  try {
    let filepath = new URL(resolvedPath).pathname;
    let assumedMockFilePath = resolve(dirname(filepath), '__mocks__', basename(filepath));
    let code = await readFile(assumedMockFilePath, 'utf-8');
    return new SourceTextModule(code, { identifier: resolvedPath, context });
  } catch (error) {
    let original = await import(resolvedPath);
    let keys = Object.keys(original);
    let mock = new SyntheticModule(
      keys,
      () => {
        for (let key of keys) {
          // TODO call tracking
          // TODO should just use mock constructor
          let fn = function () {
            return fn.returnValue;
          };
          mock.setExport(key, fn);
        }
      },
      { identifier: resolvedPath, context },
    );
    return mock;
  }
}

function fileUrl(filePath, root) {
  let pathName = resolve(root, filePath);
  pathName = pathName.replace(/\\/g, '/');

  // Windows drive letter must be prefixed with a slash.
  if (pathName[0] !== '/') {
    pathName = `/${pathName}`;
  }

  // Escape required characters for path components.
  // See: https://tools.ietf.org/html/rfc3986#section-3.3
  return encodeURI(`file://${pathName}`).replace(/[?#]/g, encodeURIComponent);
}
