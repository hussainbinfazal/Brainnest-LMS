
import { configDotenv } from 'dotenv';

console.log("=== DEBUG START AI SERVICE ===");
console.log("cwd:", process.cwd());
console.log("__dirname:", __dirname);

const result = configDotenv({ path: "./.env" });
import { ChatGroq } from "@langchain/groq";
import Groq from "groq-sdk";


if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
}

export const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
});

export const voiceLLM = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});


// // packages/ai-service/src/test-llm.ts
// import { llm } from "./llm.js";

// const response = await llm.invoke("Explain what a binary search tree is in 2 sentences.");
// console.log(response.content);