/**
 * Container de DI para testes
 * Permite criar containers isolados com mocks para cada teste
 */
import { Container } from "inversify";
import "reflect-metadata";
import type { TextChunker } from "../../domain/entities/chunker.js";
import type { Retriever } from "../../domain/services/retriever.js";
import type { EmbeddingGenerator } from "../../infrastructure/embeddings.js";
import type { ResponseGenerator } from "../../infrastructure/llm/generator.js";
import type { DocumentProcessor } from "../../infrastructure/processors/documentProcessor.js";
import type { VectorDB } from "../../infrastructure/storage/vectorDb.js";
/**
 * Cria um container de testes vazio
 * Use este container para injetar mocks específicos para cada teste
 */
export declare function createTestContainer(): Container;
/**
 * Cria um container de testes com mocks padrão
 * Útil para testes que não precisam de configuração específica
 */
export declare function createTestContainerWithMocks(): Container;
/**
 * Helper para criar bindings de mocks no container
 */
export interface MockBindings {
  embeddingGenerator?: EmbeddingGenerator;
  responseGenerator?: ResponseGenerator;
  documentProcessor?: DocumentProcessor;
  vectorDbFactory?: (sessionId: string) => VectorDB;
  retrieverFactory?: (vectorDb: VectorDB) => Retriever;
  textChunker?: TextChunker;
}
/**
 * Aplica mocks ao container de testes
 */
export declare function bindMocks(container: Container, mocks: MockBindings): void;
//# sourceMappingURL=testContainer.d.ts.map
