export type HashableFile = {
  name: string;
  size?: number;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type HashedFile<T extends HashableFile = HashableFile> = {
  file: T;
  hash: string;
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashFile(file: HashableFile): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return bytesToHex(new Uint8Array(digest));
}

export async function hashFiles<T extends HashableFile>(
  files: readonly T[],
  concurrency = 4,
): Promise<HashedFile<T>[]> {
  const results: HashedFile<T>[] = [];
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), files.length);

  async function worker() {
    while (nextIndex < files.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = { file: files[index], hash: await hashFile(files[index]) };
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
