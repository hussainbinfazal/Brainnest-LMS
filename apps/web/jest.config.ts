import type { Config } from "jest";
import nextJest from "next/jest.js";
 
const createJestConfig = nextJest({
  dir: "./",
});
 
const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};
 
// next/jest handles SWC transforms, CSS/image mocks, and env loading for us
export default createJestConfig(config);