import { Inject, Injectable } from "@nestjs/common";
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from "./embeddings/embedding-provider";
import {
  DEFAULT_SEARCH_OPTIONS,
  type SearchHit,
  type SearchOptions,
  VECTOR_STORE,
  type VectorStore,
} from "./vector-store/vector-store";

// "Find what this business's documents say about this question."
// Used by the agent's search tool (R7) and the owner's test-search endpoint (R6).
@Injectable()
export class KnowledgeSearchService {
  constructor(
    @Inject(EMBEDDING_PROVIDER) private readonly embeddings: EmbeddingProvider,
    @Inject(VECTOR_STORE) private readonly store: VectorStore,
  ) {}

  async search(
    tenantId: string,
    question: string,
    options: SearchOptions = DEFAULT_SEARCH_OPTIONS,
  ): Promise<SearchHit[]> {
    const text = question.trim();
    if (!text) return [];
    const queryVector = await this.embeddings.embedQuery(text);
    return this.store.search(tenantId, queryVector, options);
  }
}
