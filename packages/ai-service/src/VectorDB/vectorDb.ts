import mongoose, { type mongo } from "mongoose";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { Document } from "@langchain/core/documents";
import { embeddings } from "../Embeddings/embeddings";
import { connectDB } from "@repo/shared"

export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
    await connectDB(process.env.MONGODB_URI!);
    const collection: mongo.Collection = mongoose.connection.collection("documents");

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
    await vectorStore.addDocuments(docs);


}