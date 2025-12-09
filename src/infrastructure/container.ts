/**
 * Container de Injeção de Dependências usando Inversify
 */

import { Container } from "inversify";
import "reflect-metadata";
import { getDistributedEmbeddingCache } from "../cache/distributed.js";
import { config } from "../config/index.js";
import { TextChunker } from "../domain/entities/chunker.js";
import { Retriever } from "../domain/services/retriever.js";
import { DocumentService } from "../services/documentService.js";
import { HealthCheckService } from "../services/healthCheckService.js";
import { QueryService } from "../services/queryService.js";
import { TYPES } from "../shared/types/types.js";
import { EmbeddingGenerator } from "./embeddings.js";
import { ResponseGenerator } from "./llm/generator.js";
import { DocumentProcessor } from "./processors/documentProcessor.js";
import { SessionCleaner } from "./sessionManagement/sessionCleaner.js";
import { VectorDB } from "./storage/vectorDb.js";

// Re-exportar TYPES para compatibilidade
export { TYPES };

// Criar container
export const container = new Container();

// Bindings de Core (singletons)
container.bind<DocumentProcessor>(TYPES.DocumentProcessor).to(DocumentProcessor).inSingletonScope();

container
  .bind<TextChunker>(TYPES.TextChunker)
  .toDynamicValue(() => {
    return new TextChunker({
      chunkSize: config.rag.chunkSize,
      chunkOverlap: config.rag.chunkOverlap,
    });
  })
  .inSingletonScope();

container
  .bind<EmbeddingGenerator>(TYPES.EmbeddingGenerator)
  .toDynamicValue(() => {
    return EmbeddingGenerator.getInstance({
      model: config.rag.embeddingModel,
    });
  })
  .inSingletonScope();

container
  .bind<ResponseGenerator>(TYPES.ResponseGenerator)
  .toDynamicValue(() => {
    return ResponseGenerator.getInstance({
      model: config.ollama.model,
      ollamaUrl: config.ollama.url,
    });
  })
  .inSingletonScope();

container
  .bind<SessionCleaner>(TYPES.SessionCleaner)
  .toDynamicValue(() => {
    const cleaner = new SessionCleaner({
      dbPath: config.sessions.dbPath,
      maxAgeMinutes: config.sessions.maxAgeMinutes,
    });
    cleaner.start(config.sessions.cleanupIntervalMinutes);
    return cleaner;
  })
  .inSingletonScope();

// Factory para VectorDB (cria nova instância por sessão)
container.bind<(sessionId: string) => VectorDB>(TYPES.VectorDBFactory).toFactory(() => {
  return (sessionId: string) => {
    return new VectorDB({
      collectionName: `session-${sessionId}`,
    });
  };
});

// Factory para Retriever
container.bind<(vectorDb: VectorDB) => Retriever>(TYPES.RetrieverFactory).toFactory(() => {
  return (vectorDb: VectorDB) => {
    const embeddingGenerator = container.get<EmbeddingGenerator>(TYPES.EmbeddingGenerator);
    return new Retriever({
      vectorDb,
      embeddingGenerator,
    });
  };
});

// Bindings de Services
container.bind<DocumentService>(TYPES.DocumentService).to(DocumentService).inSingletonScope();

container.bind<QueryService>(TYPES.QueryService).to(QueryService).inSingletonScope();

container
  .bind<HealthCheckService>(TYPES.HealthCheckService)
  .to(HealthCheckService)
  .inSingletonScope();

// Cache (singleton)
container
  .bind(TYPES.EmbeddingCache)
  .toDynamicValue(() => getDistributedEmbeddingCache())
  .inSingletonScope();
