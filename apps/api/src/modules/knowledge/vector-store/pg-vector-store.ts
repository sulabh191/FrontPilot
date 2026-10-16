import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  cosineDistance,
  type Database,
  EMBEDDING_DIMENSIONS,
  eq,
  knowledgeChunks,
  knowledgeDocuments,
  sql,
} from "@frontpilot/db";
import { DATABASE } from "../../../database/database.constants";
import {
  type ChunkToStore,
  DEFAULT_SEARCH_OPTIONS,
  type SearchHit,
  type SearchOptions,
  type VectorStore,
} from "./vector-store";

// Rows per INSERT: big documents are written in a few multi-row statements,
// not one statement per chunk (fast) nor one giant statement (Postgres parameter limits).
const INSERT_BATCH = 100;

// Vector search with pgvector, inside our own Postgres: chunks and their vectors live in
// the same table, so tenant filters, joins, transactions and cascades all just work.
@Injectable()
export class PgVectorStore implements VectorStore {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async saveDocumentChunks(
    tenantId: string,
    documentId: string,
    chunks: ChunkToStore[],
  ): Promise<void> {
    // Clear message here instead of a Postgres error on every insert.
    const wrongSize = chunks.find((c) => c.embedding.length !== EMBEDDING_DIMENSIONS);
    if (wrongSize) {
      throw new Error(
        `Chunk ${wrongSize.chunkIndex} has ${wrongSize.embedding.length} dimensions, expected ${EMBEDDING_DIMENSIONS}`,
      );
    }

    await this.db.transaction(async (tx) => {
      // 1. The document must belong to this business. FOR UPDATE locks its row, so two
      //    re-processings of the same document run one after the other, not interleaved.
      const [document] = await tx
        .select({ id: knowledgeDocuments.id })
        .from(knowledgeDocuments)
        .where(
          and(eq(knowledgeDocuments.id, documentId), eq(knowledgeDocuments.tenantId, tenantId)),
        )
        .for("update");
      if (!document) throw new Error(`Document ${documentId} not found for this business`);

      // 2. Swap old chunks for new ones (re-processing an updated document).
      await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
      for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
        await tx
          .insert(knowledgeChunks)
          .values(
            chunks.slice(i, i + INSERT_BATCH).map((chunk) => ({ tenantId, documentId, ...chunk })),
          );
      }

      // 3. Only now does the document become searchable.
      await tx
        .update(knowledgeDocuments)
        .set({ status: "ready", error: null, chunkCount: chunks.length, updatedAt: new Date() })
        .where(eq(knowledgeDocuments.id, documentId));
    });
  }

  async search(
    tenantId: string,
    queryVector: number[],
    options: SearchOptions = DEFAULT_SEARCH_OPTIONS,
  ): Promise<SearchHit[]> {
    // embedding <=> query  (cosine DISTANCE: 0 = same direction); similarity = 1 - distance.
    const distance = cosineDistance(knowledgeChunks.embedding, queryVector);

    const rows = await this.db.transaction(async (tx) => {
      // The HNSW index finds nearest vectors first and applies WHERE filters afterwards;
      // with many businesses in one table, too few candidates could survive the tenant filter.
      // pgvector 0.8 "iterative scan" keeps walking the index until LIMIT rows pass the filters.
      // SET LOCAL: only for this transaction, never leaks to other queries on the connection.
      await tx.execute(sql`SET LOCAL hnsw.iterative_scan = relaxed_order`);

      return tx
        .select({
          chunkId: knowledgeChunks.id,
          documentId: knowledgeChunks.documentId,
          documentTitle: knowledgeDocuments.title,
          heading: knowledgeChunks.heading,
          content: knowledgeChunks.content,
          score: sql<number>`1 - (${distance})`,
        })
        .from(knowledgeChunks)
        .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
        .where(
          and(
            eq(knowledgeChunks.tenantId, tenantId), // only this business, always
            eq(knowledgeDocuments.status, "ready"), // never half-processed documents
          ),
        )
        .orderBy(distance) // nearest first: this is what uses the HNSW index
        .limit(options.limit);
    });

    // relaxed_order may return results slightly out of order, so sort again;
    // the threshold is applied here so it never prevents the index from being used.
    return rows
      .map((row) => ({ ...row, score: Number(row.score) }))
      .filter((hit) => hit.score >= options.minScore)
      .sort((a, b) => b.score - a.score);
  }
}
