/**
 * Retriever para busca de documentos
 * Implementa IRetriever
 */

import type { SearchResult, VectorDB } from "../../infrastructure/storage/vectorDb.js";
import { logger } from "../../shared/logging/logger.js";
import type { IEmbeddingGenerator } from "../interfaces/embeddingGenerator.interface.js";
import type { IRetriever, RetrieveOptions } from "../interfaces/retriever.interface.js";

export class Retriever implements IRetriever {
  private vectorDb: VectorDB;
  private embeddingGenerator: IEmbeddingGenerator;

  constructor({
    vectorDb,
    embeddingGenerator,
  }: {
    vectorDb: VectorDB;
    embeddingGenerator: IEmbeddingGenerator;
  }) {
    this.vectorDb = vectorDb;
    this.embeddingGenerator = embeddingGenerator;
  }

  async retrieve(
    query: string,
    { topK = 10, filter = null }: RetrieveOptions = {}
  ): Promise<SearchResult[]> {
    // Gerar embedding da query
    logger.debug({ query }, "Gerando embedding da query");
    const queryEmbedding = await this.embeddingGenerator.generateEmbedding(query);
    logger.debug({ dimensions: queryEmbedding.length }, "Embedding gerado");

    // Buscar na Vector DB (aumentar topK para pegar mais contexto)
    const results = await this.vectorDb.search(queryEmbedding, { topK, filter });

    if (results.length > 0) {
      logger.debug(
        {
          resultsCount: results.length,
          similarities: results.map((r) => r.similarity.toFixed(3)),
        },
        "Resultados encontrados"
      );
    } else {
      logger.warn("Nenhum resultado encontrado na busca");
    }

    return results;
  }
}
