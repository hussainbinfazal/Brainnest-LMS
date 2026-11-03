
import { configDotenv } from 'dotenv';

// console.log("=== DEBUG START ===");
// console.log("cwd:", process.cwd());
// console.log("__dirname:", __dirname);

const result = configDotenv({ path: "./.env" });
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { llm } from "../LLM/llm";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { logger } from "@repo/shared/server";


const RAG_LESSON_DESCRIPTION_PROMPT: ChatPromptTemplate = ChatPromptTemplate.fromTemplate(`
Write one concise lesson description using only the transcript context below.
Mention the lesson's main topics and learning outcomes when the context supports them.
Do not add facts that are not in the context or include commentary about the task.

Context:
{context}

Description request: {question}
`);
const RAG_PROMPT: ChatPromptTemplate = ChatPromptTemplate.fromTemplate(`
// Write one concise lesson description using only the transcript context below.
// Mention the lesson's main topics and learning outcomes when the context supports them.
// Do not add facts that are not in the context or include commentary about the task.

// Context:
// {context}

// Description request: {question}
// `);


function formatDocs(docs: { pageContent: string }[]): string {
    if (docs.length === 0) {
        logger.error("No lesson transcript chunks matched the retrieval filter");
        throw new Error("No lesson transcript chunks matched the retrieval filter");
    }
    return docs.map((d) => d.pageContent).join("\n\n");
}

export function buildRagChain(
    vectorStore: MongoDBAtlasVectorSearch,
    filter: MongoDBAtlasVectorSearch["FilterType"]
): RunnableSequence<string, string> {
    const retriever = vectorStore.asRetriever({ k: 5, filter });
    logger.info("Building RAG chain", { filter, retrieverType: retriever.constructor.name, vectorStoreType: vectorStore.constructor.name });
    let ragResponse = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocs),
            question: new RunnablePassthrough(),
        },
        RAG_PROMPT,
        llm,
        new StringOutputParser(),
    ]);
    console.log("RAG chain built", { ragResponseType: ragResponse.constructor.name, ragResponse: ragResponse });
    return ragResponse;
}

export function buildRagChainForLesson(
    vectorStore: MongoDBAtlasVectorSearch,
    filter: MongoDBAtlasVectorSearch["FilterType"]
): RunnableSequence<string, string> {
    try {
        const retriever = vectorStore.asRetriever({ k: 5, filter });
        logger.info("Building RAG chain for lesson", { filter, retrieverType: retriever.constructor.name, vectorStoreType: vectorStore.constructor.name });
        let ragResponse = RunnableSequence.from([
            {
                context: retriever.pipe(formatDocs),
                question: new RunnablePassthrough(),
            },
            RAG_LESSON_DESCRIPTION_PROMPT,
            llm,
            new StringOutputParser(),
        ]);
        console.log("RAG chain for lesson built", { ragResponseType: ragResponse.constructor.name, ragResponse: ragResponse });
        return ragResponse;
    } catch (error) {
        console.log("Error building RAG chain for lesson", { error, message: error instanceof Error ? error.message : "Unknown error" });
        logger.error("Error building RAG chain for lesson", { error, message: error instanceof Error ? error.message : "Unknown error" });
        throw error;
    }
}
