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
import { TYPES } from "../../shared/types/types.js";

/**
 * Cria um container de testes vazio
 * Use este container para injetar mocks específicos para cada teste
 */
export function createTestContainer(): Container {
  return new Container();
}

/**
 * Cria um container de testes com mocks padrão
 * Útil para testes que não precisam de configuração específica
 */
export function createTestContainerWithMocks(): Container {
  const container = createTestContainer();

  // Adicionar mocks padrão aqui se necessário
  // Exemplo:
  // container.bind<EmbeddingGenerator>(TYPES.EmbeddingGenerator).toConstantValue(createMockEmbeddingGenerator());

  return container;
}

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
export function bindMocks(container: Container, mocks: MockBindings): void {
  if (mocks.embeddingGenerator) {
    container
      .bind<EmbeddingGenerator>(TYPES.EmbeddingGenerator)
      .toConstantValue(mocks.embeddingGenerator);
  }

  if (mocks.responseGenerator) {
    container
      .bind<ResponseGenerator>(TYPES.ResponseGenerator)
      .toConstantValue(mocks.responseGenerator);
  }

  if (mocks.documentProcessor) {
    container
      .bind<DocumentProcessor>(TYPES.DocumentProcessor)
      .toConstantValue(mocks.documentProcessor);
  }

  if (mocks.vectorDbFactory) {
    container
      .bind<(sessionId: string) => VectorDB>(TYPES.VectorDBFactory)
      .toConstantValue(mocks.vectorDbFactory);
  }

  if (mocks.retrieverFactory) {
    container
      .bind<(vectorDb: VectorDB) => Retriever>(TYPES.RetrieverFactory)
      .toConstantValue(mocks.retrieverFactory);
  }

  if (mocks.textChunker) {
    container.bind<TextChunker>(TYPES.TextChunker).toConstantValue(mocks.textChunker);
  }
}
