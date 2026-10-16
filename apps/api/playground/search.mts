// R4 playground: chunk a real document (R3), embed it with the API's provider (R4),
// and search it, all in memory. R5 moves the vectors and the search into pgvector.
// Run from apps/api:  node playground/search.mts "do you install sump pumps?"
import { readFileSync } from "node:fs";
import { chunkText } from "../src/modules/knowledge/chunking/chunk-text.ts";
import { MiniLmEmbeddingProvider } from "../src/modules/knowledge/embeddings/minilm-embedding.provider.ts";

const question = process.argv[2] ?? "my kitchen sink is clogged";
const MIN_SCORE = 0.25; // from R0: below this, treat as "nothing relevant"

const provider = new MiniLmEmbeddingProvider();
const chunks = chunkText(readFileSync(new URL("./rapid-plumbing.md", import.meta.url), "utf8"));

// What gets embedded: the heading path + the chunk text ("contextual chunk header").
// A short chunk like "From $129." means nothing alone; with "… › Toilet repair" it does.
const inputs = chunks.map((c) => (c.heading ? `${c.heading}\n${c.content}` : c.content));

const vectors = await provider.embedDocuments(inputs); // one batched call for all chunks
const query = await provider.embedQuery(question);
const dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i]!, 0);

console.log(
  `${chunks.length} chunks embedded with ${provider.model} (${provider.dimensions} dims)`,
);
console.log(`\nQuestion: "${question}"\n`);
chunks
  .map((chunk, i) => ({ chunk, score: dot(query, vectors[i]!) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 3)
  .forEach(({ chunk, score }) => {
    const verdict = score >= MIN_SCORE ? "✅" : "⛔ below threshold";
    console.log(`${score.toFixed(3)} ${verdict}  [${chunk.heading ?? "no heading"}]`);
    console.log(`      ${chunk.content.slice(0, 110)}${chunk.content.length > 110 ? "…" : ""}`);
  });
