/**
 * Retriever para busca de documentos
 * Implementa IRetriever
 */
import type { IEmbeddingGenerator } from "./domain/interfaces/embeddingGenerator.interface.js";
import type { IRetriever, RetrieveOptions } from "./domain/interfaces/retriever.interface.js";
import type { SearchResult, VectorDB } from "./vectorDb.js";
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
