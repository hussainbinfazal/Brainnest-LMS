import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { llm } from "../LLM/llm";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";


const RAG_PROMPT: ChatPromptTemplate = ChatPromptTemplate.fromTemplate(`
You are a helpful teaching assistant for an online course platform.
Answer the question using ONLY the context below. If the answer isn't
in the context, say you don't know — don't make things up.

Context:
{context}

Question: {question}
`);

function formatDocs(docs: { pageContent: string }[]): string {
    return docs.map((d) => d.pageContent).join("\n\n");
}

export function buildRagChain(vectorStore: MongoDBAtlasVectorSearch): RunnableSequence<string, string> {
    const retriever = vectorStore.asRetriever({ k: 3 }); // top 3 relevant chunks

    return RunnableSequence.from([
        {
            context: retriever.pipe(formatDocs),
            question: new RunnablePassthrough(),
        },
        RAG_PROMPT,
        llm,
        new StringOutputParser(),
    ]);
}
