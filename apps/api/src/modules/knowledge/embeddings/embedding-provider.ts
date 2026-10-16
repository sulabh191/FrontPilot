// Turns text into vectors. Everything else in the knowledge base depends on this
// interface, never on a specific model, so the provider can change by configuration
// (local MiniLM today; Voyage, OpenAI or Qdrant Cloud Inference later) and tests use a fake.

export interface EmbeddingProvider {
  /** Model identifier, stored on each document (knowledge_documents.embedding_model). */
  readonly model: string;
  /** Length of every vector; must equal the database column (vector(384)). */
  readonly dimensions: number;

  /**
   * Vectors for document chunks, in the same order as the input.
   * Separate from embedQuery because some models embed questions and passages
   * differently (e.g. "query:" / "passage:" prefixes, or an input_type parameter).
   */
  embedDocuments(texts: string[]): Promise<number[][]>;

  /** Vector for a search query (a customer's question). */
  embedQuery(text: string): Promise<number[]>;
}

// Injection token for the active EmbeddingProvider.
export const EMBEDDING_PROVIDER = Symbol("EMBEDDING_PROVIDER");
