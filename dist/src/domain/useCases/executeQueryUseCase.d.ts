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
  sources: Array<{
    text: string;
    similarity: number;
    metadata?: unknown;
  }>;
  metadata: {
    hasContext: boolean;
    sourcesCount: number;
  };
}
/**
 * Use Case para executar query
 */
export declare class ExecuteQueryUseCase {
  private createRetriever;
  private responseGenerator;
  constructor(
    createRetriever: (vectorDb: VectorDB) => IRetriever,
    responseGenerator: IResponseGenerator
  );
  execute(command: ExecuteQueryCommand): Promise<ExecuteQueryResult>;
}
//# sourceMappingURL=executeQueryUseCase.d.ts.map
