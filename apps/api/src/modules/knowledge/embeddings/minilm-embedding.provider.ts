import { Logger, type OnApplicationBootstrap } from "@nestjs/common";
import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import type { EmbeddingProvider } from "./embedding-provider";

// Runs all-MiniLM-L6-v2 locally, inside the API process: no API key, no cost, no network
// after the first download. Same model as sentence-transformers in Python (384 dimensions).
// Reads at most ~256 tokens per text, so chunks must stay small (see chunkText).
export class MiniLmEmbeddingProvider implements EmbeddingProvider, OnApplicationBootstrap {
  readonly model = "onnx-community/all-MiniLM-L6-v2-ONNX";
  readonly dimensions = 384;

  private readonly logger = new Logger("Embeddings");
  private pipelinePromise: Promise<FeatureExtractionPipeline> | undefined;

  // Texts per model call: batching is much faster than one call per text,
  // and bounding the batch keeps memory flat for very large documents.
  private static readonly BATCH_SIZE = 32;

  // Start loading the model when the API boots, without blocking startup,
  // so the first real request doesn't pay the loading time.
  onApplicationBootstrap() {
    void this.pipeline().catch((error: unknown) =>
      this.logger.error("Embedding model failed to load", error as Error),
    );
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += MiniLmEmbeddingProvider.BATCH_SIZE) {
      vectors.push(...(await this.embed(texts.slice(i, i + MiniLmEmbeddingProvider.BATCH_SIZE))));
    }
    return vectors;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embed([text]);
    return vector!;
  }

  private async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const extractor = await this.pipeline();
    // mean pooling: one vector per text (average of its word pieces);
    // normalize: length 1, so cosine similarity = dot product (as in the R0 playground).
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    return output.tolist() as number[][];
  }

  // Load the model once and share it. Concurrent callers wait for the same promise;
  // if loading fails, the next call retries instead of caching the failure.
  private pipeline(): Promise<FeatureExtractionPipeline> {
    this.pipelinePromise ??= (async () => {
      const started = Date.now();
      // Imported lazily: the library is large, and tests using the fake never load it.
      const { pipeline } = await import("@huggingface/transformers");
      const extractor = (await pipeline("feature-extraction", this.model, {
        dtype: "fp32", // explicit precision: the same model + dtype always gives the same vectors
      })) as unknown as FeatureExtractionPipeline;
      this.logger.log(`${this.model} loaded in ${Date.now() - started} ms`);
      return extractor;
    })().catch((error: unknown) => {
      this.pipelinePromise = undefined;
      throw error;
    });
    return this.pipelinePromise;
  }
}
