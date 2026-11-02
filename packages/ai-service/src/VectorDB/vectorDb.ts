
import { configDotenv } from 'dotenv';

// console.log("=== DEBUG START ===");
// console.log("cwd:", process.cwd());
// console.log("__dirname:", __dirname);

const result = configDotenv({ path: "./.env" });

import mongoose, { type mongo } from "mongoose";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { Document } from "@langchain/core/documents";
import { embeddings } from "../Embeddings/embeddings";


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
console.log("This is the URL in vectorDB", process.env.MONGODB_URI!);
export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
    await client.connect();
    const db = client.db("LMS");
    const collection = db.collection("documents");

    return new MongoDBAtlasVectorSearch(embeddings,
        {
            collection,
            indexName: "vector-index",
            textKey: "text",
            embeddingKey: "embedding"
        }
    );
}

export async function addChunks(texts: string[], metadata: Record<string, unknown>[]): Promise<void> {
    const vectorStore = await getVectorStore();
    const docs = texts.map((text, i) => new Document({ pageContent: text, metadata: metadata[i] }));
    // Atlas vector index filter fields must include metadata keys used by retrieval filters.
    // LangChain calls `embeddings.embedDocuments` for these docs and stores the resulting vectors.
    await vectorStore.addDocuments(docs);


}