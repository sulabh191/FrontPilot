import { describe, expect, it } from "vitest";
import { FakeEmbeddingProvider } from "./fake-embedding.provider";

// The fake stands in for the real model in tests, so it must behave like one where it matters.
const dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i]!, 0);

describe("FakeEmbeddingProvider", () => {
  const provider = new FakeEmbeddingProvider();

  it("returns one 384-number vector per text, in order", async () => {
    const vectors = await provider.embedDocuments([
      "drain cleaning",
      "leak repair",
      "water heaters",
    ]);

    expect(vectors).toHaveLength(3);
    for (const vector of vectors) expect(vector).toHaveLength(384);
  });

  it("is deterministic: the same text always gives the same vector", async () => {
    expect(await provider.embedQuery("Drain cleaning from $189")).toEqual(
      await provider.embedQuery("Drain cleaning from $189"),
    );
  });

  it("returns normalized vectors (length 1), like the real model", async () => {
    const vector = await provider.embedQuery("We fix leaking sinks and pipes");
    expect(Math.hypot(...vector)).toBeCloseTo(1, 10);
  });

  it("scores texts that share words higher than unrelated ones", async () => {
    const [query, drains, weather] = await provider.embedDocuments([
      "kitchen drain cleaning",
      "Drain cleaning: kitchen, bathroom and main lines",
      "The weather is lovely today",
    ]);

    expect(dot(query!, drains!)).toBeGreaterThan(dot(query!, weather!));
  });

  it("gives text with no words a valid unit vector (a zero vector has no direction)", async () => {
    const vector = await provider.embedQuery("!!! ---");
    expect(Math.hypot(...vector)).toBeCloseTo(1, 10);
  });

  it("returns nothing for an empty batch", async () => {
    expect(await provider.embedDocuments([])).toEqual([]);
  });
});
