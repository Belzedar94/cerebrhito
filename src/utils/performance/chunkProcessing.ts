export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>,
  onChunkComplete?: (results: R[]) => void
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);

    if (onChunkComplete) {
      onChunkComplete(chunkResults);
    }
  }

  return results;
}