import { describe, expect, it } from "vitest";
import { chunkText, type ChunkOptions } from "./chunk-text";

// Small limits keep the test texts short and readable.
const small: ChunkOptions = { maxChars: 200, overlapChars: 40 };

// 30 distinct sentences (~45 characters each): long enough to need several chunks.
const sentences = Array.from(
  { length: 30 },
  (_, i) => `Sentence ${i + 1} explains plumbing topic ${i + 1}.`,
);
const longText = sentences.join(" ");

describe("chunkText", () => {
  it("returns no chunks for empty or blank text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("keeps a short text without headings as one chunk", () => {
    expect(chunkText("We fix leaks. From $149.")).toEqual([
      { index: 0, heading: null, content: "We fix leaks. From $149." },
    ]);
  });

  it("labels chunks with their heading path", () => {
    const chunks = chunkText("# Services\n## Drain cleaning\nFrom $189.");

    // "Services" has no text of its own, so it produces no chunk, only the path.
    expect(chunks).toEqual([
      { index: 0, heading: "Services › Drain cleaning", content: "From $189." },
    ]);
  });

  it("replaces a heading with its sibling instead of nesting it", () => {
    const chunks = chunkText(
      "# Services\n## Drain cleaning\nFrom $189.\n## Leak repair\nFrom $149.",
    );

    expect(chunks.map((c) => c.heading)).toEqual([
      "Services › Drain cleaning",
      "Services › Leak repair",
    ]);
  });

  it("keeps text before the first heading, with no heading", () => {
    const chunks = chunkText("Welcome to Rapid Plumbing.\n# Services\nWe fix leaks.");

    expect(chunks.map((c) => [c.heading, c.content])).toEqual([
      [null, "Welcome to Rapid Plumbing."],
      ["Services", "We fix leaks."],
    ]);
  });

  it("treats '#hashtag' (no space) as text, not a heading", () => {
    expect(chunkText("#plumbing is our life")[0]).toMatchObject({
      heading: null,
      content: "#plumbing is our life",
    });
  });

  it("splits a long section into several chunks, none over the limit", () => {
    const chunks = chunkText(longText, small);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.content.length).toBeLessThanOrEqual(small.maxChars);
  });

  it("starts each chunk with the end of the previous one (overlap)", () => {
    const chunks = chunkText(longText, small);

    for (let i = 1; i < chunks.length; i++) {
      const overlap = chunks[i]!.content.split("\n")[0]!; // the first line is the carried-over text
      expect(chunks[i - 1]!.content.endsWith(overlap)).toBe(true);
    }
  });

  it("never overlaps across sections", () => {
    const chunks = chunkText(`# First\n${longText}\n# Second\nOnly this.`, small);

    expect(chunks.at(-1)).toMatchObject({ heading: "Second", content: "Only this." });
  });

  it("splits text with no sentence breaks at word boundaries", () => {
    const chunks = chunkText("word ".repeat(500), small);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(small.maxChars);
      expect(chunk.content.split(/\s+/).every((w) => w === "word")).toBe(true); // no word cut in half
    }
  });

  it("hard-cuts a single 'word' longer than the limit (e.g. a long URL)", () => {
    const chunks = chunkText("x".repeat(450), small);

    expect(chunks.map((c) => c.content.length)).toEqual([200, 200, 50]);
  });

  it("treats Windows line endings exactly like Unix ones", () => {
    const text = `# Services\n## Drain cleaning\nFrom $189.\n\n${longText}`;

    expect(chunkText(text.replace(/\n/g, "\r\n"), small)).toEqual(chunkText(text, small));
  });

  it("numbers chunks 0, 1, 2… across the whole document", () => {
    const chunks = chunkText(`# A\n${longText}\n# B\n${longText}`, small);

    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
  });

  it("never loses text: every sentence appears in some chunk", () => {
    const chunks = chunkText(`# Services\n${longText}`, small);

    for (const sentence of sentences) {
      expect(chunks.some((c) => c.content.includes(sentence))).toBe(true);
    }
  });

  it("uses safe defaults: ~800 characters with overlap", () => {
    const chunks = chunkText(Array.from({ length: 40 }, () => longText).join("\n\n"));

    for (const chunk of chunks) expect(chunk.content.length).toBeLessThanOrEqual(800);
  });
});
