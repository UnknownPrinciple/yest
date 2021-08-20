import { SourceTextModule, SyntheticModule, createContext } from 'vm';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
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
  let context = createContext({
    console,
    test: async (name, fn) => {
      try {
        await fn();
        results.push({ name, type: 'success' });
      } catch (error) {
        results.push({ name, type: 'failure', error });
      }
    },
    mock: (target) => {
      return {
        returnValue(v) {
          target.returnValue = v;
        },
      };
    },
    expect: (actual) => {
      return {
        toBe(expected) {
          if (actual !== expected) {
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
  let mod = new SourceTextModule(code, { identifier: targetUrl.toString(), context });

  await mod.link(async (specifier, referencingModule) => {
    let resolvedPath = await import.meta.resolve(specifier, targetUrl);

    if (mocks.includes(resolvedPath)) {
      if (mocksMap.has(resolvedPath)) {
        return mocksMap.get(resolvedPath);
      }
      let mod = createMockModule(resolvedPath, context);
      mocksMap.set(resolvedPath, mod);
      return mod;
    }

    if (resolvedPath.startsWith('node:')) {
      throw new Error('implement me');
    }

    let code = await readFile(new URL(resolvedPath), 'utf-8');
    return new SourceTextModule(code, {
      context,
      identifier: resolvedPath,
    });
  });

  try {
    await mod.evaluate();
    console.log('done');
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
  let original = await import(resolvedPath);
  let keys = Object.keys(original);
  let mockFns = keys.map((key) => {
    let fn = function () {
      return fn.returnValue;
    };
    return fn;
  });
  let mock = new SyntheticModule(
    keys,
    () => {
      keys.forEach((key, index) => {
        mock.setExport(key, mockFns[index]);
      });
    },
    {
      context,
      identifier: resolvedPath,
    },
  );
  return mock;
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
