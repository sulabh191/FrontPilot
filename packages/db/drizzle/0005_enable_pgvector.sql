-- Custom SQL migration file, put your code below! --
-- pgvector: adds the vector column type, distance operators (<=> cosine) and vector indexes.
CREATE EXTENSION IF NOT EXISTS vector;