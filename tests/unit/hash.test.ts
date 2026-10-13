import { describe, expect, it } from 'vitest';

import type { ParsedWorkbook } from '../../src/domain/model/normalized';
import { hashFile } from '../../src/domain/parsing/hash';
import { importWorkbookFiles } from '../../src/domain/parsing/imports';

describe('source hashing', () => {
  it('creates a stable SHA-256 hash for file bytes', async () => {
    const file = new File(['same bytes'], 'first.xlsx');
    const sameBytes = new File(['same bytes'], 'renamed.xlsx');

    expect(await hashFile(file)).toBe(await hashFile(sameBytes));
    expect((await hashFile(file)).length).toBe(64);
  });

  it('partitions duplicate bytes from a single selection and existing imports', async () => {
    const first = new File(['same bytes'], 'first.xlsx');
    const renamed = new File(['same bytes'], 'renamed.xlsx');
    const unique = new File(['different bytes'], 'unique.xlsx');
    const existingHash = await hashFile(first);

    const existing = { source: { hash: existingHash } } as ParsedWorkbook;

    const results = await importWorkbookFiles([first, renamed, unique], [existing]);

    expect(results.filter((result) => result.status === 'duplicate')).toEqual([
      {
        index: 0,
        file: first,
        name: 'first.xlsx',
        status: 'duplicate',
        hash: existingHash,
        duplicateReason: 'existing',
      },
      {
        index: 1,
        file: renamed,
        name: 'renamed.xlsx',
        status: 'duplicate',
        hash: existingHash,
        duplicateReason: 'existing',
      },
    ]);
  });

  it('marks same-selection duplicates separately', async () => {
    const first = new File(['same bytes'], 'first.xlsx');
    const renamed = new File(['same bytes'], 'renamed.xlsx');
    const results = await importWorkbookFiles([first, renamed]);

    expect(results[1]).toMatchObject({
      name: 'renamed.xlsx',
      status: 'duplicate',
      duplicateReason: 'selection',
    });
  });
});
