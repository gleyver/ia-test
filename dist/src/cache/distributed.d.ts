/**
 * Cache Distribuído de Embeddings usando Redis
 * Compartilhado entre múltiplas instâncias
 */
export declare class DistributedEmbeddingCache {
  private redis;
  private fallbackCache;
  private maxFallbackSize;
  /**
   * Gera hash do texto para usar como chave de cache
   */
  private getCacheKey;
  /**
   * Obtém embedding do cache
   */
  get(text: string): Promise<number[] | null>;
  /**
   * Armazena embedding no cache
   */
  set(text: string, embedding: number[]): Promise<void>;
  /**
   * Limpa cache
   */
  clear(): Promise<void>;
  /**
   * Limpa cache fallback quando atinge tamanho máximo
   */
  private evictFallbackIfNeeded;
  /**
   * Retorna estatísticas do cache
   */
  getStats(): Promise<{
    redisEnabled: boolean;
    redisSize?: number;
    fallbackSize: number;
  }>;
}
export declare function getDistributedEmbeddingCache(): DistributedEmbeddingCache;
//# sourceMappingURL=distributed.d.ts.map
