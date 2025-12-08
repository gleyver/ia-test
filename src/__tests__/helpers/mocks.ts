/**
 * Mocks reutilizáveis para testes
 * Facilita criação de mocks consistentes em todos os testes
 */

import { vi } from "vitest";
import type { ProcessResult } from "../../documentProcessor.js";
import type { TextChunker } from "../../domain/entities/chunker.js";
import type { Retriever } from "../../domain/services/retriever.js";
import type { EmbeddingGenerator } from "../../infrastructure/embeddings.js";
import type { ResponseGenerator } from "../../infrastructure/llm/generator.js";
import type { DocumentProcessor } from "../../infrastructure/processors/documentProcessor.js";
import type { SearchResult, VectorDB } from "../../infrastructure/storage/vectorDb.js";

/**
 * Cria mock de EmbeddingGenerator
 */
export function createMockEmbeddingGenerator(): EmbeddingGenerator {
  return {
    generateEmbedding: vi.fn().mockResolvedValue(new Array(384).fill(0.1)),
    generateEmbeddings: vi
      .fn()
      .mockImplementation(async (chunks: Array<{ text: string; metadata?: unknown }>) => {
        return chunks.map((chunk) => ({
          ...chunk,
          embedding: new Array(384).fill(0.1),
        }));
      }),
    clearCache: vi.fn(),
    getCacheStats: vi.fn().mockReturnValue({
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: 50000,
      hitRate: 0,
      totalRequests: 0,
    }),
    initialize: vi.fn().mockResolvedValue(undefined),
  } as unknown as EmbeddingGenerator;
}

/**
 * Cria mock de ResponseGenerator
 */
export function createMockResponseGenerator(): ResponseGenerator {
  const mockCircuitBreaker = {
    getState: vi.fn().mockReturnValue("CLOSED"),
    getStats: vi.fn().mockReturnValue({
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: "CLOSED",
    }),
    reset: vi.fn(),
  };

  return {
    generate: vi.fn().mockResolvedValue({
      response: "Resposta mockada do LLM",
      sources: [],
      metadata: {
        model: "llama3.2",
        numSources: 0,
      },
    }),
    generateWithoutContext: vi.fn().mockResolvedValue({
      response: "Resposta mockada sem contexto",
      sources: [],
      metadata: {
        model: "llama3.2",
        numSources: 0,
      },
    }),
    getCircuitBreaker: vi.fn().mockReturnValue(mockCircuitBreaker),
  } as unknown as ResponseGenerator;
}

/**
 * Cria mock de DocumentProcessor
 */
export function createMockDocumentProcessor(): DocumentProcessor {
  return {
    process: vi.fn().mockResolvedValue({
      text: "Texto extraído do documento",
      metadata: {
        extension: ".pdf",
        pages: 1,
      },
    }),
    canProcess: vi.fn().mockReturnValue(true),
    supportedExtensions: vi.fn().mockReturnValue([".pdf", ".docx", ".txt"]),
  } as unknown as DocumentProcessor;
}

/**
 * Cria mock de VectorDB
 */
export function createMockVectorDB(): VectorDB {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    addDocuments: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([
      {
        text: "Documento relevante encontrado",
        similarity: 0.95,
        metadata: { source: "test.pdf" },
      },
    ]),
    getDocumentCount: vi.fn().mockReturnValue(10),
    clear: vi.fn().mockResolvedValue(undefined),
  } as unknown as VectorDB;
}

/**
 * Cria factory mock de VectorDB
 */
export function createMockVectorDBFactory(): (sessionId: string) => VectorDB {
  return (_sessionId: string) => {
    const vectorDb = createMockVectorDB();
    // Pode adicionar lógica específica baseada no sessionId se necessário
    return vectorDb;
  };
}

/**
 * Cria mock de Retriever
 */
export function createMockRetriever(): Retriever {
  return {
    retrieve: vi.fn().mockResolvedValue([
      {
        text: "Documento relevante",
        similarity: 0.95,
        metadata: { source: "test.pdf" },
      },
    ]),
  } as unknown as Retriever;
}

/**
 * Cria factory mock de Retriever
 */
export function createMockRetrieverFactory(): (vectorDb: VectorDB) => Retriever {
  return (_vectorDb: VectorDB) => {
    return createMockRetriever();
  };
}

/**
 * Cria mock de TextChunker
 */
export function createMockTextChunker(): TextChunker {
  return {
    createChunks: vi.fn().mockReturnValue([
      {
        text: "Chunk 1",
        metadata: { chunkIndex: 0, totalChunks: 2 },
      },
      {
        text: "Chunk 2",
        metadata: { chunkIndex: 1, totalChunks: 2 },
      },
    ]),
    countTokens: vi.fn().mockReturnValue(10),
  } as unknown as TextChunker;
}

/**
 * Helper para criar SearchResult mockado
 */
export function createMockSearchResult(
  text: string = "Documento relevante",
  similarity: number = 0.95
): SearchResult {
  return {
    id: "mock-id",
    text,
    similarity,
    distance: 1 - similarity,
    metadata: {
      source: "test.pdf",
      chunkIndex: 0,
    },
  };
}

/**
 * Helper para criar ProcessResult mockado
 */
export function createMockProcessResult(): ProcessResult {
  return {
    text: "Texto extraído do documento de teste",
    metadata: {
      extension: ".pdf",
      pages: 1,
      source: "test.pdf",
    },
  };
}
