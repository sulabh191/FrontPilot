// R3 playground: see how a real document is split into chunks.
// Run from apps/api:  node playground/chunking.mts [maxChars] [overlapChars]
import { readFileSync } from "node:fs";
import { chunkText, DEFAULT_CHUNK_OPTIONS } from "../src/modules/knowledge/chunking/chunk-text.ts";

const text = readFileSync(new URL("./rapid-plumbing.md", import.meta.url), "utf8");

// Optional overrides from the terminal, to experiment with sizes: e.g. "300 60".
const maxChars = Number(process.argv[2] ?? DEFAULT_CHUNK_OPTIONS.maxChars);
const overlapChars = Number(process.argv[3] ?? DEFAULT_CHUNK_OPTIONS.overlapChars);

const chunks = chunkText(text, { maxChars, overlapChars });

console.log(
  `${text.length} characters → ${chunks.length} chunks (max ${maxChars}, overlap ${overlapChars})\n`,
);
for (const chunk of chunks) {
  console.log(`#${chunk.index}  [${chunk.heading ?? "no heading"}]  ${chunk.content.length} chars`);
  console.log(chunk.content);
  console.log("-".repeat(60));
}
