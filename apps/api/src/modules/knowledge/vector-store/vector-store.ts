// Stores chunk vectors and finds the closest ones to a query, always within ONE business.
// The rest of the app depends on this interface; PgVectorStore implements it with pgvector.
// (A QdrantVectorStore could implement the same interface without changing any caller.)

export type ChunkToStore = {
  chunkIndex: number;
  heading: string | null;
  content: string;
  embedding: number[];
};

export type SearchHit = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  heading: string | null;
  content: string;
  score: number; // cosine similarity: ~1 = same meaning, ~0 = unrelated
};

export type SearchOptions = {
  limit: number; // at most this many hits (top-k)
  minScore: number; // drop hits below this similarity ("nothing relevant found")
};

// From the R0 experiments: top 5 so the LLM can pick, 0.25 as the starting threshold
// (to be tuned with real questions in R11).
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = { limit: 5, minScore: 0.25 };

export interface VectorStore {
  /**
   * Replaces ALL chunks of a document and marks it ready, in one transaction:
   * search sees either the old chunks or the new ones, never a half-processed document.
   */
  saveDocumentChunks(tenantId: string, documentId: string, chunks: ChunkToStore[]): Promise<void>;

  /** The business's most similar chunks from READY documents, best first. */
  search(tenantId: string, queryVector: number[], options?: SearchOptions): Promise<SearchHit[]>;
}

export const VECTOR_STORE = Symbol("VECTOR_STORE");
