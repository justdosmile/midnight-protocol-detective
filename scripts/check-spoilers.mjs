#!/usr/bin/env node

import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve('.');
const privateInput = join(root, '.private', 'solution-input.json');
const ignoredDirectories = new Set([
  '.git',
  '.private',
  'node_modules',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
]);
const textExtensions = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.md', '.json', '.yml', '.yaml', '.svg',
]);

try {
  await access(privateInput);
} catch {
  process.stdout.write('Spoiler scan skipped: private reference is not present.\n');
  process.exit(0);
}

const privateData = JSON.parse(await readFile(privateInput, 'utf8'));
const reveal = privateData.reveal ?? {};
const sensitivePassages = [
  reveal.motive,
  reveal.method,
  reveal.falseAlibi,
  ...(Array.isArray(reveal.paragraphs) ? reveal.paragraphs : []),
]
  .filter((value) => typeof value === 'string' && value.trim().length >= 40)
  .map((value) => value.toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ').trim());

const leaks = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!textExtensions.has(extname(entry.name))) continue;
    const text = (await readFile(path, 'utf8'))
      .toLocaleLowerCase('ru-RU')
      .replace(/\s+/g, ' ');
    if (sensitivePassages.some((passage) => text.includes(passage))) {
      leaks.push(relative(root, path));
    }
  }
}

await walk(root);

if (leaks.length) {
  process.stderr.write(`Spoiler scan failed in: ${leaks.join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Spoiler scan passed (${sensitivePassages.length} private passages checked).\n`);
}
