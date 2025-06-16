// Test setup file
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.development.secrets" });

// Set test timeout to accommodate API calls and retries
jest.setTimeout(180000); // 3 minutes like pixellab-js
