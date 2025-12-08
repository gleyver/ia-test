/**
 * Mocks reutilizáveis para testes
 * Facilita criação de mocks consistentes em todos os testes
 */
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
export declare function createMockEmbeddingGenerator(): EmbeddingGenerator;
/**
 * Cria mock de ResponseGenerator
 */
export declare function createMockResponseGenerator(): ResponseGenerator;
/**
 * Cria mock de DocumentProcessor
 */
export declare function createMockDocumentProcessor(): DocumentProcessor;
/**
 * Cria mock de VectorDB
 */
export declare function createMockVectorDB(): VectorDB;
/**
 * Cria factory mock de VectorDB
 */
export declare function createMockVectorDBFactory(): (sessionId: string) => VectorDB;
/**
 * Cria mock de Retriever
 */
export declare function createMockRetriever(): Retriever;
/**
 * Cria factory mock de Retriever
 */
export declare function createMockRetrieverFactory(): (vectorDb: VectorDB) => Retriever;
/**
 * Cria mock de TextChunker
 */
export declare function createMockTextChunker(): TextChunker;
/**
 * Helper para criar SearchResult mockado
 */
export declare function createMockSearchResult(text?: string, similarity?: number): SearchResult;
/**
 * Helper para criar ProcessResult mockado
 */
export declare function createMockProcessResult(): ProcessResult;
//# sourceMappingURL=mocks.d.ts.map
