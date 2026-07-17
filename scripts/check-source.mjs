#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve('.');
const ignored = new Set(['.git', '.private', 'node_modules', 'dist', 'coverage', 'playwright-report', 'test-results']);
const ignoredFiles = new Set(['solutionBundle.generated.ts']);
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.md', '.json', '.yml', '.yaml', '.svg']);
const forbidden = [
  ['TO', 'DO'].join(''),
  ['FIX', 'ME'].join(''),
  ['lorem', 'ipsum'].join(' '),
  ['скоро', 'будет'].join(' '),
];

const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    if (ignoredFiles.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!textExtensions.has(extname(entry.name))) continue;
    const text = await readFile(path, 'utf8');
    for (const marker of forbidden) {
      if (text.toLocaleLowerCase('en-US').includes(marker.toLocaleLowerCase('en-US'))) {
        failures.push(`${relative(root, path)}: запрещённый маркер ${marker}`);
      }
    }
  }
}

await walk(root);
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Source marker scan passed.\n');
}
