import type { ParsedWorkbook } from '../model/normalized';
import { hashFiles, type HashableFile } from './hash';

type ImportFileIdentity<T extends HashableFile> = {
  index: number;
  file: T;
  name: string;
};

export type ImportResult<T extends HashableFile = HashableFile> =
  | (ImportFileIdentity<T> & {
      status: 'ready';
      hash: string;
      parsed: ParsedWorkbook;
    })
  | (ImportFileIdentity<T> & {
      status: 'duplicate';
      hash: string;
      duplicateReason: 'existing' | 'selection';
    })
  | (ImportFileIdentity<T> & {
      status: 'error';
      hash: string | null;
      message: string;
      // Present when the workbook parsed but was not accepted, such as a track mismatch.
      parsed: ParsedWorkbook | null;
    });

export type ImportProgressEvent<T extends HashableFile = HashableFile> =
  | (ImportFileIdentity<T> & {
      status: 'parsing';
      hash: string;
    })
  | ImportResult<T>;

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

/**
 * Hashes, deduplicates, parses, and track-validates files. Results and every
 * progress event are keyed by input index; parsed results settle in input order
 * so same-track validation never depends on parse completion order.
 */
export async function importWorkbookFiles<T extends HashableFile>(
  files: readonly T[],
  existingWorkbooks: readonly ParsedWorkbook[] = [],
  concurrency = 4,
  onProgress?: (event: ImportProgressEvent<T>) => void,
): Promise<ImportResult<T>[]> {
  const results: ImportResult<T>[] = [];

  let hashedFiles;
  try {
    hashedFiles = await hashFiles(files, concurrency);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The files could not be checked.';
    for (const [index, file] of files.entries()) {
      results[index] = {
        index,
        file,
        name: file.name,
        status: 'error',
        hash: null,
        message,
        parsed: null,
      };
      onProgress?.(results[index]);
    }
    return results;
  }

  const existingHashes = new Set(existingWorkbooks.map((workbook) => workbook.source.hash));
  const knownHashes = new Set(existingHashes);
  const candidates: Array<{ index: number; file: T; hash: string }> = [];

  for (const [index, { file, hash }] of hashedFiles.entries()) {
    if (knownHashes.has(hash)) {
      results[index] = {
        index,
        file,
        name: file.name,
        status: 'duplicate',
        hash,
        duplicateReason: existingHashes.has(hash) ? 'existing' : 'selection',
      };
      onProgress?.(results[index]);
      continue;
    }

    knownHashes.add(hash);
    candidates.push({ index, file, hash });
    onProgress?.({ index, file, name: file.name, status: 'parsing', hash });
  }

  const parsedByIndex = new Map<number, ImportResult<T>>();
  const acceptedWorkbooks = [...existingWorkbooks];
  let nextSettledIndex = 0;

  function settleInInputOrder() {
    while (nextSettledIndex < files.length) {
      if (results[nextSettledIndex]?.status === 'duplicate') {
        nextSettledIndex += 1;
        continue;
      }

      const result = parsedByIndex.get(nextSettledIndex);
      if (!result) {
        return;
      }

      const mismatch =
        result.status === 'ready' ? trackMismatchMessage(result.parsed, acceptedWorkbooks) : null;
      if (result.status === 'ready' && mismatch) {
        results[nextSettledIndex] = {
          ...result,
          status: 'error',
          message: mismatch,
        };
      } else {
        results[nextSettledIndex] = result;
        if (result.status === 'ready') {
          acceptedWorkbooks.push(result.parsed);
        }
      }

      onProgress?.(results[nextSettledIndex]);
      nextSettledIndex += 1;
    }
  }

  let nextCandidate = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), candidates.length);

  async function worker() {
    while (nextCandidate < candidates.length) {
      const { index, file, hash } = candidates[nextCandidate];
      nextCandidate += 1;

      try {
        const { parseWorkbookFile } = await import('./workbook');
        const parsed = await parseWorkbookFile(await file.arrayBuffer(), {
          id: hash,
          name: file.name,
          hash,
        });
        parsedByIndex.set(index, { index, file, name: file.name, status: 'ready', hash, parsed });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'The workbook could not be parsed.';
        parsedByIndex.set(index, {
          index,
          file,
          name: file.name,
          status: 'error',
          hash,
          message,
          parsed: null,
        });
      }

      settleInInputOrder();
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
