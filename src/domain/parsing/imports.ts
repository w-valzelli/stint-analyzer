import type { ParsedWorkbook } from '../model/normalized';
import { hashFiles, type HashableFile, type HashedFile } from './hash';

export type ImportDuplicate = {
  name: string;
  hash: string;
  reason: 'existing' | 'selection';
};

export type ImportFailure = {
  name: string;
  hash: string;
  message: string;
};

export type ImportProgressEvent = {
  index: number;
  name: string;
  hash: string;
  status: 'parsing' | 'ready' | 'duplicate' | 'error';
  parsed?: ParsedWorkbook;
  message?: string;
  duplicateReason?: ImportDuplicate['reason'];
};

export type WorkbookImportBatch = {
  parsed: ParsedWorkbook[];
  duplicates: ImportDuplicate[];
  failures: ImportFailure[];
};

function normalizedTrackName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function trackMismatchMessage(
  candidate: ParsedWorkbook,
  existing: readonly ParsedWorkbook[],
): string | null {
  const candidateTrack = candidate.source.trackName?.trim();
  if (!candidateTrack) {
    return null;
  }

  const differentTrack = existing
    .map((workbook) => workbook.source.trackName?.trim())
    .filter((track): track is string => Boolean(track))
    .find((track) => normalizedTrackName(track) !== normalizedTrackName(candidateTrack));

  if (!differentTrack) {
    return null;
  }

  return `All imported lap data should use the same track. This file reports “${candidateTrack}”, but existing files report “${differentTrack}”.`;
}

export async function importWorkbookFiles<T extends HashableFile>(
  files: readonly T[],
  existingHashes: ReadonlySet<string> = new Set(),
  concurrency = 4,
  onProgress?: (event: ImportProgressEvent) => void,
): Promise<WorkbookImportBatch> {
  const hashedFiles = await hashFiles(files, concurrency);
  const knownHashes = new Set(existingHashes);
  const candidates: Array<HashedFile<T> & { index: number }> = [];
  const duplicates: ImportDuplicate[] = [];

  for (const [index, hashed] of hashedFiles.entries()) {
    if (knownHashes.has(hashed.hash)) {
      const reason = existingHashes.has(hashed.hash) ? 'existing' : 'selection';
      duplicates.push({ name: hashed.file.name, hash: hashed.hash, reason });
      onProgress?.({
        index,
        name: hashed.file.name,
        hash: hashed.hash,
        status: 'duplicate',
        duplicateReason: reason,
      });
      continue;
    }

    knownHashes.add(hashed.hash);
    candidates.push({ ...hashed, index });
    onProgress?.({ index, name: hashed.file.name, hash: hashed.hash, status: 'parsing' });
  }

  const parsed: ParsedWorkbook[] = [];
  const failures: ImportFailure[] = [];
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), candidates.length);

  async function worker() {
    while (nextIndex < candidates.length) {
      const index = nextIndex;
      nextIndex += 1;
      const candidate = candidates[index];

      try {
        const { parseWorkbookFile } = await import('./workbook');
        const result = await parseWorkbookFile(await candidate.file.arrayBuffer(), {
          id: candidate.hash,
          name: candidate.file.name,
          hash: candidate.hash,
        });
        parsed.push(result);
        onProgress?.({
          index: candidate.index,
          name: candidate.file.name,
          hash: candidate.hash,
          status: 'ready',
          parsed: result,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'The workbook could not be parsed.';
        failures.push({ name: candidate.file.name, hash: candidate.hash, message });
        onProgress?.({
          index: candidate.index,
          name: candidate.file.name,
          hash: candidate.hash,
          status: 'error',
          message,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return { parsed, duplicates, failures };
}
