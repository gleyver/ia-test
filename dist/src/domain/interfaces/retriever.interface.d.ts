/**
 * Interface para retrievers
 */
import type { SearchResult } from "../../infrastructure/storage/vectorDb.js";
import type { DocumentFilter } from "../../shared/types/types.js";
export interface RetrieveOptions {
  topK?: number;
  filter?: DocumentFilter;
}
/**
 * Interface para retrievers
 */
export interface IRetriever {
  /**
   * Busca documentos relevantes para uma query
   */
  retrieve(query: string, options?: RetrieveOptions): Promise<SearchResult[]>;
}
//# sourceMappingURL=retriever.interface.d.ts.map
