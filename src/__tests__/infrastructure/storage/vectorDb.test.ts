/**
 * Testes para VectorDB
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { VectorDB } from "../../../infrastructure/storage/vectorDb.js";
import { createTestChunks, createTestEmbedding } from "../../helpers/factories.js";

// Mock do repositório
vi.mock("../../../infrastructure/storage/jsonDocumentRepository.js", () => {
  const mockRepository = {
    load: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  return {
    JsonDocumentRepository: class {
      constructor() {
        return mockRepository;
      }
    },
  };
});

vi.mock("../../../infrastructure/storage/fileSystemStorage.js", () => {
  return {
    FileSystemStorage: class {
      constructor() {
        // Mock vazio
      }
    },
  };
});

describe("VectorDB", () => {
  let vectorDb: VectorDB;

  beforeEach(() => {
    vectorDb = new VectorDB({ collectionName: "test-collection" });
  });

  describe("constructor", () => {
    it("deve criar VectorDB com nome de coleção padrão", () => {
      const db = new VectorDB();
      expect(db).toBeInstanceOf(VectorDB);
    });

    it("deve criar VectorDB com nome de coleção customizado", () => {
      const db = new VectorDB({ collectionName: "custom-collection" });
      expect(db).toBeInstanceOf(VectorDB);
    });
  });

  describe("initialize", () => {
    it("deve inicializar VectorDB", async () => {
      await vectorDb.initialize();
      const info = await vectorDb.getCollectionInfo();
      expect(info.collectionName).toBe("test-collection");
    });

    it("não deve inicializar duas vezes", async () => {
      await vectorDb.initialize();
      await vectorDb.initialize(); // Segunda chamada não deve fazer nada
      const info = await vectorDb.getCollectionInfo();
      expect(info.documentCount).toBe(0);
    });
  });

  describe("addDocuments", () => {
    it("deve adicionar documentos à coleção", async () => {
      const chunks = createTestChunks(2).map((chunk) => ({
        ...chunk,
        embedding: createTestEmbedding(384),
      }));

      await vectorDb.initialize();
      await vectorDb.addDocuments(chunks);

      const info = await vectorDb.getCollectionInfo();
      expect(info.documentCount).toBe(2);
    });

    it("deve inicializar automaticamente se não inicializado", async () => {
      const chunks = createTestChunks(1).map((chunk) => ({
        ...chunk,
        embedding: createTestEmbedding(384),
      }));

      await vectorDb.addDocuments(chunks);

      const info = await vectorDb.getCollectionInfo();
      expect(info.documentCount).toBe(1);
    });

    it("deve pré-computar norms para embeddings", async () => {
      const embedding = createTestEmbedding(384, 0.5);
      const chunks = [
        {
          text: "Teste",
          embedding: Array.from(embedding),
          metadata: { chunkIndex: 0 },
        },
      ];

      await vectorDb.initialize();
      await vectorDb.addDocuments(chunks);

      // Verificar que norm foi calculado (através da busca)
      const results = await vectorDb.search(embedding, { topK: 1 });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("search", () => {
    it("deve retornar array vazio quando coleção está vazia", async () => {
      await vectorDb.initialize();
      const queryEmbedding = createTestEmbedding(384);
      const results = await vectorDb.search(queryEmbedding);

      expect(results).toEqual([]);
    });

    it("deve buscar documentos relevantes", async () => {
      const queryEmbedding = createTestEmbedding(384, 0.5);
      const chunks = [
        {
          text: "Documento relevante",
          embedding: Array.from(queryEmbedding),
          metadata: { source: "test.pdf" },
        },
        {
          text: "Documento menos relevante",
          embedding: createTestEmbedding(384, 0.1),
          metadata: { source: "test2.pdf" },
        },
      ];

      await vectorDb.initialize();
      await vectorDb.addDocuments(chunks);

      const results = await vectorDb.search(queryEmbedding, { topK: 2 });

      expect(results.length).toBe(2);
      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    });

    it("deve respeitar topK", async () => {
      const queryEmbedding = createTestEmbedding(384);
      const chunks = createTestChunks(10).map((chunk, i) => ({
        ...chunk,
        embedding: createTestEmbedding(384, 0.5 + i * 0.01),
      }));

      await vectorDb.initialize();
      await vectorDb.addDocuments(chunks);

      const results = await vectorDb.search(queryEmbedding, { topK: 3 });

      expect(results.length).toBe(3);
    });

    it("deve inicializar automaticamente antes de buscar", async () => {
      const queryEmbedding = createTestEmbedding(384);
      const results = await vectorDb.search(queryEmbedding);

      expect(results).toEqual([]);
    });
  });

  describe("getCollectionInfo", () => {
    it("deve retornar informações da coleção", async () => {
      await vectorDb.initialize();
      const info = await vectorDb.getCollectionInfo();

      expect(info).toHaveProperty("collectionName");
      expect(info).toHaveProperty("documentCount");
      expect(info.collectionName).toBe("test-collection");
      expect(info.documentCount).toBe(0);
    });

    it("deve retornar contagem correta de documentos", async () => {
      const chunks = createTestChunks(5).map((chunk) => ({
        ...chunk,
        embedding: createTestEmbedding(384),
      }));

      await vectorDb.initialize();
      await vectorDb.addDocuments(chunks);

      const info = await vectorDb.getCollectionInfo();
      expect(info.documentCount).toBe(5);
    });
  });

  describe("deleteCollection", () => {
    it("deve deletar coleção", async () => {
      const chunks = createTestChunks(2).map((chunk) => ({
        ...chunk,
        embedding: createTestEmbedding(384),
      }));

      await vectorDb.initialize();
      await vectorDb.addDocuments(chunks);
      await vectorDb.deleteCollection();

      const info = await vectorDb.getCollectionInfo();
      expect(info.documentCount).toBe(0);
    });
  });
});
