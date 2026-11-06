// Spec 001 REQ-008(c): point Git at the versioned hooks in .githooks/ so the
// pre-commit secret scan runs on every commit. Runs from `npm install`
// (prepare) and `npm run hooks:install`. Skipped in CI and outside a Git
// work tree.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

if (process.env.CI) {
  console.log('hooks: CI environment detected, skipping hook installation.');
  process.exit(0);
}

try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
} catch {
  console.log('hooks: not inside a Git work tree, skipping hook installation.');
  process.exit(0);
}

if (!existsSync('.githooks/pre-commit')) {
  console.error('hooks: .githooks/pre-commit is missing.');
  process.exit(1);
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
console.log('hooks: pre-commit secret scan enabled (core.hooksPath = .githooks).');
