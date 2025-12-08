/**
 * Use Case: Executar query
 * Encapsula lógica de negócio para execução de queries
 */

import type { VectorDB } from "../../infrastructure/storage/vectorDb.js";
import type { IResponseGenerator } from "../interfaces/responseGenerator.interface.js";
import type { IRetriever } from "../interfaces/retriever.interface.js";
import { Query } from "../valueObjects/query.js";

export interface ExecuteQueryCommand {
  query: Query;
  vectorDb: VectorDB | null;
  hasFile: boolean;
}

export interface ExecuteQueryResult {
  response: string;
  sources: Array<{ text: string; similarity: number; metadata?: unknown }>;
  metadata: {
    hasContext: boolean;
    sourcesCount: number;
  };
}

/**
 * Use Case para executar query
 */
export class ExecuteQueryUseCase {
  constructor(
    private createRetriever: (vectorDb: VectorDB) => IRetriever,
    private responseGenerator: IResponseGenerator
  ) {}

  async execute(command: ExecuteQueryCommand): Promise<ExecuteQueryResult> {
    const queryString = command.query.toString();

    // Se tem arquivo e VectorDB, buscar contexto
    if (command.hasFile && command.vectorDb) {
      await command.vectorDb.initialize();
      const retriever = this.createRetriever(command.vectorDb);
      const retrievedDocs = await retriever.retrieve(queryString, { topK: 5 });

      if (retrievedDocs.length > 0) {
        // Gerar resposta com contexto
        const result = await this.responseGenerator.generate(queryString, retrievedDocs);

        return {
          response: result.response,
          sources: retrievedDocs.map((doc) => ({
            text: doc.text,
            similarity: doc.similarity,
            metadata: doc.metadata,
          })),
          metadata: {
            hasContext: true,
            sourcesCount: retrievedDocs.length,
          },
        };
      }
    }

    // Sem contexto ou sem documentos encontrados - usar conhecimento do modelo
    const result = await this.responseGenerator.generateWithoutContext(queryString);

    return {
      response: result.response,
      sources: [],
      metadata: {
        hasContext: false,
        sourcesCount: 0,
      },
    };
  }
}
