/**
 * Testes para Retriever
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IEmbeddingGenerator } from "../../../domain/interfaces/embeddingGenerator.interface.js";
import { Retriever } from "../../../domain/services/retriever.js";
import type { VectorDB } from "../../../infrastructure/storage/vectorDb.js";
import {
  createMockEmbeddingGenerator,
  createMockSearchResult,
  createMockVectorDB,
} from "../../helpers/mocks.js";

describe("Retriever", () => {
  let retriever: Retriever;
  let mockVectorDB: VectorDB;
  let mockEmbeddingGenerator: IEmbeddingGenerator;

  beforeEach(() => {
    mockVectorDB = createMockVectorDB();
    mockEmbeddingGenerator = createMockEmbeddingGenerator();
    retriever = new Retriever({
      vectorDb: mockVectorDB,
      embeddingGenerator: mockEmbeddingGenerator,
    });
  });

  describe("retrieve", () => {
    it("deve buscar documentos relevantes para query", async () => {
      const mockResults = [
        createMockSearchResult("Documento 1", 0.95),
        createMockSearchResult("Documento 2", 0.9),
      ];

      vi.spyOn(mockVectorDB, "search").mockResolvedValue(mockResults);
      vi.spyOn(mockEmbeddingGenerator, "generateEmbedding").mockResolvedValue(
        new Array(384).fill(0.1)
      );

      const results = await retriever.retrieve("Qual é o conteúdo?");

      expect(mockEmbeddingGenerator.generateEmbedding).toHaveBeenCalledWith("Qual é o conteúdo?");
      expect(mockVectorDB.search).toHaveBeenCalled();
      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBe(0.95);
    });

    it("deve usar topK padrão quando não especificado", async () => {
      vi.spyOn(mockVectorDB, "search").mockResolvedValue([]);
      vi.spyOn(mockEmbeddingGenerator, "generateEmbedding").mockResolvedValue(
        new Array(384).fill(0.1)
      );

      await retriever.retrieve("teste");

      expect(mockVectorDB.search).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ topK: 10 })
      );
    });

    it("deve usar topK customizado", async () => {
      vi.spyOn(mockVectorDB, "search").mockResolvedValue([]);
      vi.spyOn(mockEmbeddingGenerator, "generateEmbedding").mockResolvedValue(
        new Array(384).fill(0.1)
      );

      await retriever.retrieve("teste", { topK: 5 });

      expect(mockVectorDB.search).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ topK: 5 })
      );
    });

    it("deve passar filter para VectorDB", async () => {
      const filter = { source: "test.pdf" };
      vi.spyOn(mockVectorDB, "search").mockResolvedValue([]);
      vi.spyOn(mockEmbeddingGenerator, "generateEmbedding").mockResolvedValue(
        new Array(384).fill(0.1)
      );

      await retriever.retrieve("teste", { filter });

      expect(mockVectorDB.search).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ filter })
      );
    });

    it("deve retornar array vazio quando não encontra resultados", async () => {
      vi.spyOn(mockVectorDB, "search").mockResolvedValue([]);
      vi.spyOn(mockEmbeddingGenerator, "generateEmbedding").mockResolvedValue(
        new Array(384).fill(0.1)
      );

      const results = await retriever.retrieve("teste");

      expect(results).toEqual([]);
    });
  });
});
