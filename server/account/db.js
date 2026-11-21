// Tiny durable JSON store for accounts, sessions, subscriptions, billing history and usage.
// The server is the only writer. Writes are serialised and atomic (temp file + rename).
// Designed to be swapped for PostgreSQL/Supabase later (same shapes as supabase/schema.sql billing tables).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data");
const FILE = path.join(DIR, "finova-db.json");

const empty = () => ({ users: {}, emails: {}, sessions: {}, subscriptions: {}, events: [], invoices: [], usage: {}, checkouts: {}, webhookIds: {}, playTokens: {}, metrics: {} });

let db = empty();
try {
  if (fs.existsSync(FILE)) db = { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
} catch (e) {
  console.error("[db] could not read store, starting empty:", e.message);
}

let pending = Promise.resolve();
function persist() {
  pending = pending.then(async () => {
    await fs.promises.mkdir(DIR, { recursive: true });
    const tmp = FILE + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(db), { mode: 0o600 });
    await fs.promises.rename(tmp, FILE);
  }).catch((e) => console.error("[db] write failed:", e.message));
  return pending;
}

/** Read-only access to the in-memory store. */
export const read = () => db;

/** Mutate the store inside a function, then persist. */
export async function write(fn) {
  const out = fn(db);
  await persist();
  return out;
}

export const DB_FILE = FILE;
