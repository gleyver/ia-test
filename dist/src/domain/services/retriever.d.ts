/**
 * Retriever para busca de documentos
 * Implementa IRetriever
 */
import type { SearchResult, VectorDB } from "../../infrastructure/storage/vectorDb.js";
import type { IEmbeddingGenerator } from "../interfaces/embeddingGenerator.interface.js";
import type { IRetriever, RetrieveOptions } from "../interfaces/retriever.interface.js";
export declare class Retriever implements IRetriever {
  private vectorDb;
  private embeddingGenerator;
  constructor({
    vectorDb,
    embeddingGenerator,
  }: {
    vectorDb: VectorDB;
    embeddingGenerator: IEmbeddingGenerator;
  });
  retrieve(query: string, { topK, filter }?: RetrieveOptions): Promise<SearchResult[]>;
}
//# sourceMappingURL=retriever.d.ts.map
