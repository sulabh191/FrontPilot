import { Module } from "@nestjs/common";
import { embeddingProviders } from "./embeddings/embedding.providers";
import { EMBEDDING_PROVIDER } from "./embeddings/embedding-provider";
import { KnowledgeSearchService } from "./knowledge-search.service";
import { PgVectorStore } from "./vector-store/pg-vector-store";
import { VECTOR_STORE } from "./vector-store/vector-store";

// The knowledge base (RAG): chunking, embeddings, vector search; soon ingestion
// and the agent's search tool.
@Module({
  providers: [
    ...embeddingProviders,
    { provide: VECTOR_STORE, useClass: PgVectorStore },
    KnowledgeSearchService,
  ],
  exports: [EMBEDDING_PROVIDER, VECTOR_STORE, KnowledgeSearchService],
})
export class KnowledgeModule {}
