import type { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EMBEDDING_DIMENSIONS } from "@frontpilot/db";
import type { Env } from "../../../config/env.schema";
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from "./embedding-provider";
import { FakeEmbeddingProvider } from "./fake-embedding.provider";
import { MiniLmEmbeddingProvider } from "./minilm-embedding.provider";

// Configuration picks the implementation once, at startup (like SMS_PROVIDER).
export function createEmbeddingProvider(kind: Env["EMBEDDINGS_PROVIDER"]): EmbeddingProvider {
  const provider = kind === "fake" ? new FakeEmbeddingProvider() : new MiniLmEmbeddingProvider();

  // Fail fast: vectors of the wrong length would be rejected by Postgres on every insert.
  // Switching to a model with a different size needs a migration (new column) and re-embedding.
  if (provider.dimensions !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding model ${provider.model} produces ${provider.dimensions} dimensions, ` +
        `but the database column is vector(${EMBEDDING_DIMENSIONS}).`,
    );
  }
  return provider;
}

export const embeddingProviders: Provider[] = [
  {
    provide: EMBEDDING_PROVIDER,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) =>
      createEmbeddingProvider(config.get("EMBEDDINGS_PROVIDER", { infer: true })),
  },
];
