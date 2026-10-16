import { Module } from "@nestjs/common";
import { embeddingProviders } from "./embeddings/embedding.providers";
import { EMBEDDING_PROVIDER } from "./embeddings/embedding-provider";

// The knowledge base (RAG): chunking, embeddings, and soon vector search,
// ingestion and the agent's search tool.
@Module({
  providers: [...embeddingProviders],
  exports: [EMBEDDING_PROVIDER],
})
export class KnowledgeModule {}
