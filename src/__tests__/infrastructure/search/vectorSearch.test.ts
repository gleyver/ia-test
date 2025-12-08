/**
 * Testes para VectorSearch
 */

import { beforeEach, describe, expect, it } from "vitest";
import { VectorSearch } from "../../../infrastructure/search/vectorSearch.js";
import type { Document } from "../../../infrastructure/storage/vectorDb.js";
import { createTestEmbedding } from "../../helpers/factories.js";

describe("VectorSearch", () => {
  let vectorSearch: VectorSearch;

  beforeEach(() => {
    vectorSearch = new VectorSearch();
  });

  describe("search", () => {
    it("deve retornar array vazio quando não há documentos", async () => {
      const queryEmbedding = createTestEmbedding(384);
      const results = await vectorSearch.search(queryEmbedding, []);

      expect(results).toEqual([]);
    });

    it("deve buscar documentos relevantes", async () => {
      const queryEmbedding = createTestEmbedding(384, 0.5);
      const documents: Document[] = [
        {
          id: "1",
          text: "Documento relevante",
          embedding: Array.from(queryEmbedding),
          norm: 1,
          metadata: { source: "test.pdf" },
        },
        {
          id: "2",
          text: "Documento menos relevante",
          embedding: createTestEmbedding(384, 0.1),
          norm: 1,
          metadata: { source: "test2.pdf" },
        },
      ];

      const results = await vectorSearch.search(queryEmbedding, documents, { topK: 2 });

      expect(results.length).toBe(2);
      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    });

    it("deve respeitar topK", async () => {
      const queryEmbedding = createTestEmbedding(384);
      const documents: Document[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        text: `Documento ${i}`,
        embedding: createTestEmbedding(384, 0.5 + i * 0.01),
        norm: 1,
        metadata: { chunkIndex: i },
      }));

      const results = await vectorSearch.search(queryEmbedding, documents, { topK: 3 });

      expect(results.length).toBe(3);
    });

    it("deve usar busca sequencial para coleções pequenas", async () => {
      const queryEmbedding = createTestEmbedding(384);
      const documents: Document[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        text: `Documento ${i}`,
        embedding: createTestEmbedding(384),
        norm: 1,
        metadata: { chunkIndex: i },
      }));

      const results = await vectorSearch.search(queryEmbedding, documents, { topK: 5 });

      expect(results.length).toBe(5);
    });

    it("deve usar busca paralela para coleções grandes", async () => {
      const queryEmbedding = createTestEmbedding(384);
      const documents: Document[] = Array.from({ length: 2000 }, (_, i) => ({
        id: `${i}`,
        text: `Documento ${i}`,
        embedding: createTestEmbedding(384),
        norm: 1,
        metadata: { chunkIndex: i },
      }));

      const results = await vectorSearch.search(queryEmbedding, documents, { topK: 10 });

      expect(results.length).toBe(10);
    });

    it("deve aplicar filtro quando fornecido", async () => {
      const queryEmbedding = createTestEmbedding(384);
      const documents: Document[] = [
        {
          id: "1",
          text: "Documento 1",
          embedding: createTestEmbedding(384),
          norm: 1,
          metadata: { source: "test.pdf" },
        },
        {
          id: "2",
          text: "Documento 2",
          embedding: createTestEmbedding(384),
          norm: 1,
          metadata: { source: "other.pdf" },
        },
      ];

      const results = await vectorSearch.search(queryEmbedding, documents, {
        topK: 10,
        filter: { source: "test.pdf" },
      });

      expect(results.length).toBe(1);
      expect(results[0].metadata.source).toBe("test.pdf");
    });

    it("deve retornar resultados ordenados por similaridade", async () => {
      const queryEmbedding = createTestEmbedding(384, 0.5);
      const documents: Document[] = [
        {
          id: "1",
          text: "Menos relevante",
          embedding: createTestEmbedding(384, 0.1),
          norm: 1,
          metadata: {},
        },
        {
          id: "2",
          text: "Mais relevante",
          embedding: Array.from(queryEmbedding),
          norm: 1,
          metadata: {},
        },
      ];

      const results = await vectorSearch.search(queryEmbedding, documents, { topK: 2 });

      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    });

    it("deve calcular similarity corretamente", async () => {
      const queryEmbedding = createTestEmbedding(384, 0.5);
      const documents: Document[] = [
        {
          id: "1",
          text: "Documento",
          embedding: Array.from(queryEmbedding), // Mesmo embedding = alta similaridade
          norm: 1,
          metadata: {},
        },
      ];

      const results = await vectorSearch.search(queryEmbedding, documents, { topK: 1 });

      expect(results[0].similarity).toBeGreaterThan(0.9);
    });
  });
});
