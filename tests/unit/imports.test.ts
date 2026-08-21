import { describe, expect, it } from 'vitest';

import { importWorkbookFiles } from '../../src/domain/parsing/imports';

describe('importWorkbookFiles', () => {
  it('reports invalid workbook content without throwing from the batch', async () => {
    const file = new File(['not an xlsx'], 'broken.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const batch = await importWorkbookFiles([file]);

    expect(batch.parsed).toHaveLength(0);
    expect(batch.failures[0]?.name).toBe('broken.xlsx');
    expect(batch.failures[0]?.message).toContain('could not be read');
  });
});
