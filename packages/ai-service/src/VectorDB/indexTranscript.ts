import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { addChunks, deleteChunks } from "./vectorDb";
import { chunkText } from "../Scrapper/chunker";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Poll until all our chunks are visible in the search index
export async function waitUntilSearchable(
  // Store used for the probe query
  vectorStore: MongoDBAtlasVectorSearch,
  // Same filter the RAG chain will use
  filter: Record<string, unknown>,
  // Number of chunks we just inserted
  expected: number,
  // Give up after this long
  timeoutMs = 30_000,
): Promise<void> {
  // Compute the moment we stop waiting
  const deadline = Date.now() + timeoutMs;
  // Keep probing until the deadline
  while (Date.now() < deadline) {
    // Ask for up to `expected` chunks that match the filter
    const hits = await vectorStore.similaritySearch('lesson', expected, {
      preFilter: filter,
    });
    // Stop as soon as every chunk is visible
    if (hits.length >= expected) return;
    // Wait one second before probing again
    await sleep(1000);
  }
  // Fail loudly, so the job does not continue with an empty index
  throw new Error(`Index not ready after ${timeoutMs}ms`);
}

// Replace old chunks with new ones, then wait for the index
export async function indexTranscript(
  // Store to write into
  vectorStore: MongoDBAtlasVectorSearch,
  // Clean speech text
  speech: string,
  // Metadata saved on every chunk
  metadata: Record<string, unknown>,
  // Ids used to scope the delete and the filter
  ids: { uploadId: string; userId: string },
  // Filter used to probe the index
  filter: Record<string, unknown>,
): Promise<void> {
  // Delete old chunks first, so retries never duplicate
  await deleteChunks(ids.uploadId, ids.userId);
  // Split the transcript into chunks
  const chunks = await chunkText(speech);
  // Insert chunks with their metadata
  await addChunks(
    chunks,
    chunks.map((_, chunkIndex) => ({ ...metadata, uploadId: ids.uploadId, chunkIndex })),
  );
  // Block until the index can actually return them
  await waitUntilSearchable(vectorStore, filter, chunks.length);
}