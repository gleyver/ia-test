/**
 * Serviço de processamento de queries
 * Isola lógica de negócio das rotas
 */
import "reflect-metadata";
import type { IResponseGenerator } from "../domain/interfaces/responseGenerator.interface.js";
import type { IRetriever } from "../domain/interfaces/retriever.interface.js";
import type { VectorDB } from "../infrastructure/storage/vectorDb.js";
export interface QueryResult {
  response: string;
  sources: string[];
  metadata: {
    model: string;
    numSources: number;
  };
}
export declare class QueryService {
  private executeQueryUseCase;
  constructor(
    createRetriever: (vectorDb: VectorDB) => IRetriever,
    responseGenerator: IResponseGenerator
  );
  executeQuery(query: string, vectorDb: VectorDB | null, hasFile: boolean): Promise<QueryResult>;
}
//# sourceMappingURL=queryService.d.ts.map
