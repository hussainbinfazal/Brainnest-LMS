import { ChatGroq } from "@langchain/groq";


if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
}

export const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
});



// // packages/ai-service/src/test-llm.ts
// import { llm } from "./llm.js";

// const response = await llm.invoke("Explain what a binary search tree is in 2 sentences.");
// console.log(response.content);