/**
 * Interface para busca vetorial
 */

import type {
  Document,
  SearchOptions,
  SearchResult,
} from "../../infrastructure/storage/vectorDb.js";

/**
 * Interface para busca vetorial
 */
export interface IVectorSearch {
  /**
   * Busca documentos similares usando embedding
   */
  search(
    queryEmbedding: number[],
    documents: Document[],
    options: SearchOptions
  ): Promise<SearchResult[]>;
}
