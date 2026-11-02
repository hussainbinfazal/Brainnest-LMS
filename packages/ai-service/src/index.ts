import { configDotenv } from 'dotenv';

// console.log("=== DEBUG START ===");
// console.log("cwd:", process.cwd());
// console.log("__dirname:", __dirname);

const result = configDotenv({ path: "./.env" });

// console.log("dotenv result:", result);