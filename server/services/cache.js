// Tiny in-memory TTL cache with in-flight request de-duplication.
const store = new Map();
const inflight = new Map();

export async function cached(key, ttlMs, fn) {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const value = await fn();
      store.set(key, { value, exp: Date.now() + ttlMs });
      return value;
    } catch (e) {
      if (hit) return hit.value; // serve stale on failure
      throw e;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}
