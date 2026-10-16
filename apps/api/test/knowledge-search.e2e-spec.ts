import { count, eq, knowledgeChunks, knowledgeDocuments } from "@frontpilot/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from "../src/modules/knowledge/embeddings/embedding-provider";
import { KnowledgeSearchService } from "../src/modules/knowledge/knowledge-search.service";
import { VECTOR_STORE, type VectorStore } from "../src/modules/knowledge/vector-store/vector-store";
import { A, B } from "./fixtures";
import { createTestApp, type TestApp } from "./test-app";

// Vector search on the REAL Postgres + pgvector (HNSW index, tenant filter, transactions).
// Embeddings come from the deterministic fake (texts sharing words are similar),
// so results are predictable and no model is downloaded.

describe("Knowledge search with pgvector (e2e)", () => {
  let t: TestApp;
  let store: VectorStore;
  let embeddings: EmbeddingProvider;
  let search: KnowledgeSearchService;

  // Creates a document row (as ingestion will in R6) and returns its id.
  const createDocument = async (tenantId: string, title: string) => {
    const [doc] = await t.db
      .insert(knowledgeDocuments)
      .values({
        tenantId,
        title,
        sourceType: "text",
        contentHash: `${tenantId}-${title}`,
        embeddingModel: embeddings.model,
      })
      .returning({ id: knowledgeDocuments.id });
    return doc!.id;
  };

  // Embeds texts with the provider and stores them as the document's chunks.
  const saveChunks = async (tenantId: string, documentId: string, texts: string[]) => {
    const vectors = await embeddings.embedDocuments(texts);
    await store.saveDocumentChunks(
      tenantId,
      documentId,
      texts.map((content, i) => ({
        chunkIndex: i,
        heading: null,
        content,
        embedding: vectors[i]!,
      })),
    );
  };

  let servicesDoc: string;
  let draftDoc: string;
  let otherDoc: string;

  beforeAll(async () => {
    t = await createTestApp();
    store = t.app.get(VECTOR_STORE);
    embeddings = t.app.get(EMBEDDING_PROVIDER);
    search = t.app.get(KnowledgeSearchService);

    // Business A: a ready document with four services...
    servicesDoc = await createDocument(A.id, "Services");
    await saveChunks(A.id, servicesDoc, [
      "Drain cleaning for kitchen and bathroom drains, from $189.",
      "Leak repair for faucets, sinks and pipes, from $149.",
      "Water heater repair and installation, from $1,450.",
      "Our emergency line is open 24/7 for burst pipes.",
    ]);
    // ...and a document still being processed (no chunks saved → status stays "processing").
    draftDoc = await createDocument(A.id, "Draft");
    await t.db.insert(knowledgeChunks).values({
      tenantId: A.id,
      documentId: draftDoc,
      chunkIndex: 0,
      content: "Sump pump installation from $950.",
      embedding: (await embeddings.embedDocuments(["Sump pump installation from $950."]))[0]!,
    });

    // Business B: a chunk with the SAME words as A's best match.
    otherDoc = await createDocument(B.id, "Other services");
    await saveChunks(B.id, otherDoc, [
      "Drain cleaning for kitchen and bathroom drains, only $99 at Other Business.",
    ]);
  });
  afterAll(async () => {
    await t.close();
  });

  it("finds the most relevant chunk first, with its document title", async () => {
    const hits = await search.search(A.id, "kitchen drain cleaning");

    expect(hits[0]).toMatchObject({
      documentTitle: "Services",
      content: expect.stringContaining("Drain cleaning"),
    });
    expect(hits.map((h) => h.score)).toEqual([...hits.map((h) => h.score)].sort((a, b) => b - a)); // best first
  });

  it("never returns another business's chunks, even when they match perfectly", async () => {
    const hits = await search.search(A.id, "drain cleaning kitchen bathroom drains Other Business");

    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.documentId !== otherDoc)).toBe(true);
    // ...and B only sees B's.
    expect(
      (await search.search(B.id, "drain cleaning")).every((h) => h.documentId === otherDoc),
    ).toBe(true);
  });

  it("ignores documents that aren't ready yet", async () => {
    const hits = await search.search(A.id, "sump pump installation");

    expect(hits.some((h) => h.documentId === draftDoc)).toBe(false);
  });

  it("returns nothing when no chunk passes the minimum score", async () => {
    expect(await search.search(A.id, "who won the football game tonight")).toEqual([]);
  });

  it("returns at most `limit` hits", async () => {
    const hits = await search.search(A.id, "repair from pipes drains", { limit: 2, minScore: 0 });
    expect(hits).toHaveLength(2);
  });

  it("scores identical text as ~1 (same direction)", async () => {
    const [hit] = await search.search(A.id, "Leak repair for faucets, sinks and pipes, from $149.");
    expect(hit!.score).toBeCloseTo(1, 5);
  });

  it("re-saving a document replaces its chunks and marks it ready, atomically", async () => {
    const doc = await createDocument(A.id, "Price list");
    await saveChunks(A.id, doc, ["Old price list line one.", "Old price list line two."]);

    await saveChunks(A.id, doc, ["Toilet repair from $129."]);

    const chunks = await t.db
      .select()
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, doc));
    expect(chunks.map((c) => c.content)).toEqual(["Toilet repair from $129."]);
    const [row] = await t.db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.id, doc));
    expect(row).toMatchObject({ status: "ready", chunkCount: 1, error: null });
  });

  it("refuses to save chunks into another business's document, writing nothing", async () => {
    const [vector] = await embeddings.embedDocuments(["Sneaky chunk."]);

    await expect(
      store.saveDocumentChunks(A.id, otherDoc, [
        { chunkIndex: 9, heading: null, content: "Sneaky chunk.", embedding: vector! },
      ]),
    ).rejects.toThrow("not found for this business");
    const [{ n }] = (await t.db
      .select({ n: count() })
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, otherDoc))) as [{ n: number }];
    expect(n).toBe(1); // still only B's own chunk
  });

  it("rejects vectors of the wrong size before touching the database", async () => {
    await expect(
      store.saveDocumentChunks(A.id, servicesDoc, [
        { chunkIndex: 0, heading: null, content: "Bad", embedding: [1, 2, 3] },
      ]),
    ).rejects.toThrow("expected 384");
  });

  it("deleting a document deletes its chunks (cascade)", async () => {
    const doc = await createDocument(A.id, "Temporary");
    await saveChunks(A.id, doc, ["Temporary chunk one.", "Temporary chunk two."]);

    await t.db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, doc));

    const [{ n }] = (await t.db
      .select({ n: count() })
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, doc))) as [{ n: number }];
    expect(n).toBe(0);
  });
});
