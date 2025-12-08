/**
 * Serviço de processamento de queries
 * Isola lógica de negócio das rotas
 */

import { inject, injectable } from "inversify";
import "reflect-metadata";
import type { IResponseGenerator } from "../domain/interfaces/responseGenerator.interface.js";
import type { IRetriever } from "../domain/interfaces/retriever.interface.js";
import { ExecuteQueryUseCase } from "../domain/useCases/executeQueryUseCase.js";
import { Query } from "../domain/valueObjects/query.js";
import type { VectorDB } from "../infrastructure/storage/vectorDb.js";
import { queriesProcessed, queryProcessingDuration } from "../metrics/index.js";
import { ProcessingError } from "../shared/errors/errors.js";
import { logger } from "../shared/logging/logger.js";
import { TYPES } from "../shared/types/types.js";

export interface QueryResult {
  response: string;
  sources: string[];
  metadata: {
    model: string;
    numSources: number;
  };
}

@injectable()
export class QueryService {
  private executeQueryUseCase: ExecuteQueryUseCase;

  constructor(
    @inject(TYPES.RetrieverFactory) createRetriever: (vectorDb: VectorDB) => IRetriever,
    @inject(TYPES.ResponseGenerator) responseGenerator: IResponseGenerator
  ) {
    // Criar Use Case com dependências injetadas
    this.executeQueryUseCase = new ExecuteQueryUseCase(createRetriever, responseGenerator);
  }

  async executeQuery(
    query: string,
    vectorDb: VectorDB | null,
    hasFile: boolean
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Criar Query Value Object
      const queryVO = Query.fromString(query);

      // Executar Use Case
      const result = await this.executeQueryUseCase.execute({
        query: queryVO,
        vectorDb,
        hasFile,
      });

      const duration = (Date.now() - startTime) / 1000;
      queryProcessingDuration.observe({ has_file: hasFile ? "true" : "false" }, duration);
      queriesProcessed.inc({ has_file: hasFile ? "true" : "false" });

      logger.info(
        { queryLength: query.length, sourcesCount: result.sources.length, duration },
        `Query processada ${hasFile ? "com" : "sem"} arquivo`
      );

      return {
        response: result.response,
        sources: result.sources.map((s) => s.text),
        metadata: {
          model: "llama3.2",
          numSources: result.metadata.sourcesCount,
        },
      };
    } catch (error: unknown) {
      const duration = (Date.now() - startTime) / 1000;
      queriesProcessed.inc({ has_file: hasFile ? "true" : "false" });

      if (error instanceof ProcessingError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage, hasFile, duration }, "Erro ao processar query");
      throw new ProcessingError("Erro ao processar query", { originalError: errorMessage });
    }
  }
}
