const flushers = new Set<() => Promise<void>>();
/** Live editors register their serial write queue; navigation waits for durable work. */
export function registerDraftFlusher(flush: () => Promise<void>): () => void {
  flushers.add(flush); return () => { flushers.delete(flush); };
}
export async function flushDrafts(): Promise<void> { await Promise.all([...flushers].map(flush => flush())); }
