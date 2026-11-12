import { Document } from '@langchain/core/documents';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { configDotenv } from 'dotenv';
import { MongoClient } from 'mongodb';
import mongoose, { type mongo } from 'mongoose';

import { embeddings } from '../Embeddings/embeddings';

// console.log("=== DEBUG START ===");
// console.log("cwd:", process.cwd());
// console.log("__dirname:", __dirname);

const result = configDotenv({ path: './.env' });

// This is prod with mongo db atlas search
// export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
//     await connectDB(process.env.MONGODB_URI!);
//     const collection: mongo.Collection = mongoose.connection.collection("documents");

//     return new MongoDBAtlasVectorSearch(embeddings,
//         {
//             collection,
//             indexName: "vector-index",
//             textKey: "text",
//             embeddingKey: "embedding"
//         }
//     );
// }

///This is development mode with mongo db local

const client = new MongoClient(process.env.MONGODB_URI!);
console.log('This is the URL in vectorDB', process.env.MONGODB_URI!);
export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
  await client.connect();
  const db = client.db('LMS');
  const collection = db.collection('documents');

  return new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: 'vector-index',
    textKey: 'text',
    embeddingKey: 'embedding',
  });
}

export async function addChunks(
  texts: string[],
  metadata: Record<string, unknown>[],
): Promise<void> {
  const vectorStore = await getVectorStore();
  const docs = texts.map(
    (text, i) => new Document({ pageContent: text, metadata: metadata[i] }),
  );
  // Atlas vector index filter fields must include metadata keys used by retrieval filters.
  // LangChain calls `embeddings.embedDocuments` for these docs and stores the resulting vectors.
  await vectorStore.addDocuments(docs);
}

export async function deleteChunks(
  uploadId: string,
  userId: string,
): Promise<void> {
  await client.connect();
  await client
    .db('LMS')
    .collection('documents')
    .deleteMany({ uploadId, userId });
}
