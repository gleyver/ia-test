/**
 * Busca vetorial usando HNSW (Hierarchical Navigable Small World)
 * Implementação otimizada para grandes volumes de dados
 * Fallback para busca sequencial se HNSW não estiver disponível
 */
import type { IVectorSearch } from "../../domain/interfaces/vectorSearch.interface.js";
import type { Document, SearchOptions, SearchResult } from "../storage/vectorDb.js";
/**
 * Busca vetorial com HNSW index (quando disponível)
 * Fallback automático para busca sequencial
 */
export declare class HNSWVectorSearch implements IVectorSearch {
  private fallbackSearch;
  private indexes;
  private embeddingDimension;
  constructor();
  /**
   * Inicializa índice HNSW para uma coleção
   */
  private initializeIndex;
  /**
   * Atualiza índice quando novos documentos são adicionados
   */
  updateIndex(collectionName: string, newDocuments: Document[], dimension: number): Promise<void>;
  /**
   * Busca usando HNSW (se disponível) ou fallback sequencial
   */
  search(
    queryEmbedding: number[],
    documents: Document[],
    options?: SearchOptions
  ): Promise<SearchResult[]>;
  /**
   * Gera nome de coleção baseado em hash simples dos documentos
   */
  private getCollectionName;
  /**
   * Verifica se documento deve ser pulado (filtro)
   */
  private shouldSkipDocument;
  /**
   * Limpa índices de uma coleção
   */
  clearIndex(collectionName: string): void;
  /**
   * Limpa todos os índices
   */
  clearAllIndexes(): void;
  /**
   * Verifica se HNSW está disponível
   */
  static isAvailable(): boolean;
}
//# sourceMappingURL=hnswVectorSearch.d.ts.map
