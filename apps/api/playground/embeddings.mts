// R0 playground: embeddings and semantic search, step by step.
// Run from apps/api:  node playground/embeddings.mts
// Learning sandbox only: outside src/, so it's not part of the API build.
// The texts below are SAMPLE data for experimenting; real knowledge will come
// from documents the owner uploads (text, then PDFs).

import { pipeline } from "@huggingface/transformers";

// 1. Load the embedding model once. The first run downloads it (cached afterwards).
//    all-MiniLM-L6-v2 (ONNX build): the same model as sentence-transformers in Python.
const embed = await pipeline("feature-extraction", "onnx-community/all-MiniLM-L6-v2-ONNX");

// 2. One customer question, and the business "knowledge" to search.
//    The last line is a deliberately unrelated control.
const question = "do you install sump pumps?";

const knowledge = [
  "Drain cleaning: kitchen, bathroom and main lines, from $189.",
  "Leak repair: sinks, faucets, pipes and fixtures, from $149.",
  "Water heaters: tank and tankless, repair or replace, from $1,450 installed.",
  "24/7 emergency line for burst pipes and flooding.",
  "Hours: Monday to Friday 7 AM to 7 PM.",
  "The weather is lovely today.",
  "Rapid Plumbing has served Springfield families for many years. ".repeat(40) + "We also install sump pumps.",
];

// 3. Turn every text into a vector, in ONE batched call.
//    pooling "mean": one vector per word piece → averaged into one vector per text.
//    normalize: every vector gets length 1, so cosine similarity = dot product.
const output = await embed([question, ...knowledge], { pooling: "mean", normalize: true });
const [q, ...docs] = output.tolist() as number[][];

console.log(`Each text became ${q!.length} numbers. First 5 of the question:`, q!.slice(0, 5));

// 4. Similarity of two normalized vectors: multiply position by position, add up.
//    1 ≈ same meaning, ~0 ≈ unrelated. A vector database computes exactly this, at scale.
const dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i]!, 0);

// 5. Semantic search: score every line against the question, best first.
console.log(`\nQuestion: "${question}"`);
knowledge
  .map((text, i) => ({ score: dot(q!, docs[i]!), text }))
  .sort((a, b) => b.score - a.score)
  .forEach(({ score, text }) => console.log(score.toFixed(3), text));
