import type { EmbeddingProvider } from "./embedding-provider";

// A tiny, deterministic stand-in for a real model, for tests and CI:
// instant, free, no download, and the same text always gives the same vector.
//
// Each word is hashed to one of the vector's positions ("bag of words"), so texts that
// SHARE WORDS get similar vectors. Real meaning (synonyms, typos) is not understood,
// but it's enough to test search end to end: "drain cleaning" finds the drain chunk.
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly model = "fake-bag-of-words";

  constructor(readonly dimensions = 384) {}

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.vectorFor(text));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.vectorFor(text);
  }

  private vectorFor(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    for (const word of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
      vector[fnv1a(word) % this.dimensions]! += 1;
    }
    const length = Math.hypot(...vector);
    // A zero vector has no direction, so cosine distance is undefined for it.
    // Text with no words gets a fixed unit vector instead.
    if (length === 0) return vector.map((_, i) => (i === 0 ? 1 : 0));
    return vector.map((value) => value / length); // normalized, like the real model
  }
}

// FNV-1a: a small, fast, well-spread string hash (the same word → the same position).
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
