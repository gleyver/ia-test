/**
 * Implementação de busca vetorial
 * Separa lógica de busca da persistência
 */
import type { IVectorSearch } from "../../domain/interfaces/vectorSearch.interface.js";
import type { Document, SearchOptions, SearchResult } from "../storage/vectorDb.js";
/**
 * Busca vetorial usando cosine similarity
 */
export declare class VectorSearch implements IVectorSearch {
  search(
    queryEmbedding: number[],
    documents: Document[],
    options?: SearchOptions
  ): Promise<SearchResult[]>;
  /**
   * Busca sequencial (para coleções pequenas)
   */
  private searchSequential;
  /**
   * Busca paralela (para coleções grandes)
   */
  private searchParallel;
  /**
   * Busca em um batch de documentos
   */
  private searchBatch;
  /**
   * Verifica se documento deve ser pulado (filtro)
   */
  private shouldSkipDocument;
  /**
   * Adiciona resultado ao heap mantendo top K
   */
  private addToHeap;
  /**
   * Extrai resultados do heap ordenados
   */
  private extractResults;
  /**
   * Mescla resultados de múltiplos batches mantendo top K
   */
  private mergeResults;
}
//# sourceMappingURL=vectorSearch.d.ts.map
