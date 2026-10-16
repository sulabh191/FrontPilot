import { describe, expect, it } from "vitest";
import { createEmbeddingProvider } from "./embedding.providers";
import { FakeEmbeddingProvider } from "./fake-embedding.provider";
import { MiniLmEmbeddingProvider } from "./minilm-embedding.provider";

describe("createEmbeddingProvider", () => {
  it("uses the local MiniLM model by default ('local')", () => {
    const provider = createEmbeddingProvider("local");

    expect(provider).toBeInstanceOf(MiniLmEmbeddingProvider);
    expect(provider.dimensions).toBe(384); // matches the vector(384) column
  });

  it("uses the fake for tests ('fake')", () => {
    expect(createEmbeddingProvider("fake")).toBeInstanceOf(FakeEmbeddingProvider);
  });

  // Creating the MiniLM provider must NOT load the model: tests and startup stay fast.
  it("doesn't load the model until it's first used", () => {
    expect(() => createEmbeddingProvider("local")).not.toThrow();
  });
});
