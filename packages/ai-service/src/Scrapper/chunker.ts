// packages/ai-service/src/chunker.ts
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { logger } from '@repo/shared/server';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
});

export async function chunkText(text: string): Promise<string[]> {
  logger.info(`Chunking text of length ${text.length}`);
  return splitter.splitText(text);
}
