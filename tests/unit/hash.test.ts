import { describe, expect, it } from 'vitest';

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

    const batch = await importWorkbookFiles([first, renamed, unique], new Set([existingHash]));

    expect(batch.duplicates).toEqual([
      { name: 'first.xlsx', hash: existingHash, reason: 'existing' },
      { name: 'renamed.xlsx', hash: existingHash, reason: 'existing' },
    ]);
  });

  it('marks same-selection duplicates separately', async () => {
    const first = new File(['same bytes'], 'first.xlsx');
    const renamed = new File(['same bytes'], 'renamed.xlsx');
    const batch = await importWorkbookFiles([first, renamed]);

    expect(batch.duplicates[0]).toMatchObject({ name: 'renamed.xlsx', reason: 'selection' });
  });
});
