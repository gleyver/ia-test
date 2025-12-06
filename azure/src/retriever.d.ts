/**
 * Retriever para busca de documentos
 */
import type { EmbeddingGenerator } from "./embeddings.js";
import type { DocumentFilter } from "./types.js";
import type { SearchResult, VectorDB } from "./vectorDb.js";
export interface RetrieveOptions {
  topK?: number;
  filter?: DocumentFilter;
}
export declare class Retriever {
  private vectorDb;
  private embeddingGenerator;
  constructor({
    vectorDb,
    embeddingGenerator,
  }: {
    vectorDb: VectorDB;
    embeddingGenerator: EmbeddingGenerator;
  });
  retrieve(query: string, { topK, filter }?: RetrieveOptions): Promise<SearchResult[]>;
}
//# sourceMappingURL=retriever.d.ts.map
