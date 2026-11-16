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

// Import the native driver's collection type
import type { Collection } from 'mongodb';

// Create the vector index only when it does not exist yet
export async function ensureVectorIndex(
  // Collection that holds the lesson chunks
  collection: Collection,
): Promise<void> {
  // Name your vector store already asks for
  const name = 'vector-index';
  // Look up an existing index with this name
  const existing = await collection.listSearchIndexes(name).toArray();
  // Stop here if it already exists, because creating twice throws an error
  if (existing.length > 0) return;
  // Create the vector index with the filter fields at the top level
  await collection.createSearchIndex({
    // Index name used by getVectorStore
    name,
    // Tell MongoDB this is a vector index
    type: 'vectorSearch',
    // Describe the vector field and the filter fields
    definition: {
      fields: [
        // Vector field; all-MiniLM-L6-v2 produces 384 dimensions
        { type: 'vector', path: 'embedding', numDimensions: 384, similarity: 'cosine' },
        // Fields used by preFilter must be declared here
        { type: 'filter', path: 'userId' },
        { type: 'filter', path: 'uploadId' },
        { type: 'filter', path: 'lessonId' },
        { type: 'filter', path: 'courseId' },
      ],
    },
  });
}
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
  await ensureVectorIndex(collection); //To create filter in the db on start up
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

// export async function deleteChunks(
//   uploadId: string,
//   userId: string,
// ): Promise<void> {
//   await client.connect();
//   await client
//     .db('LMS')
//     .collection('documents')
//     .deleteMany({
//       "metadata.uploadId": uploadId,
//       "metadata.userId": userId
//     });
// }
export async function deleteChunks(
  uploadId: string,
  userId: string,
): Promise<void> {
  await client.connect();
  await client
    .db('LMS')
    .collection('documents')
    .deleteMany({
      uploadId,
      userId
    });
}
