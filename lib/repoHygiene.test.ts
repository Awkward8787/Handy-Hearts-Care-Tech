import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');
const forbidden = [
  /pk_live_/,
  /pk_test_/,
  /sk_live_/,
  /sk_test_/,
  /whsec_/,
  /GEMINI_API_KEY/,
  /process\.env\.API_KEY/,
  /awkwardjmusic@gmail\.com/,
  /whfhisdlbovwggqiqhfr/,
  /@google\/genai/,
];

function files(directory: string): string[] {
  const skip = new Set(['node_modules', 'dist', 'coverage', 'data', '.git']);
  return readdirSync(directory).flatMap((name) => {
    if (skip.has(name)) return [];
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) return files(full);
    return [full];
  });
}

describe('repository hygiene', () => {
  it('does not ship AI Studio secrets, live keys, or the removed customer backdoor', () => {
    const offenders: string[] = [];
    for (const file of files(root)) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.includes(`${path.sep}docs${path.sep}`)) continue;
      if (file.endsWith('package-lock.json')) continue;
      const text = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(text)) offenders.push(`${path.relative(root, file)} matches ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
    expect(() => statSync(path.join(root, 'metadata.json'))).toThrow();
  });
});
