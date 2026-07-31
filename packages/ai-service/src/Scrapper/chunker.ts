// packages/ai-service/src/chunker.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
});

export async function chunkText(text: string): Promise<string[]> {
  return splitter.splitText(text);
}