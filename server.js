// Entry point: load .env next to this file first, then start the API (services read keys at import time).
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env"), quiet: true });
await import("./server/index.js");
