/**
 * Gerador de embeddings usando @xenova/transformers
 * Implementa Singleton Pattern + Cache para reduzir uso de memória e melhorar performance
 */
import type { Chunk } from "../domain/entities/chunker.js";
import type { TransformersPipeline } from "../shared/types/types.js";
export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}
import type { IEmbeddingGenerator } from "../domain/interfaces/embeddingGenerator.interface.js";
export declare class EmbeddingGenerator implements IEmbeddingGenerator {
  private static instance;
  private static sharedPipeline;
  private static sharedModel;
  private model;
  private cache;
  private maxCacheSize;
  private hits;
  private misses;
  private distributedCache;
  private constructor();
  /**
   * Singleton: retorna instância única do EmbeddingGenerator
   * Garante que apenas uma instância do modelo seja carregada em memória
   */
  static getInstance({ model }?: { model?: string }): EmbeddingGenerator;
  initialize(): Promise<TransformersPipeline>;
  /**
   * Gera hash SHA256 do texto para usar como chave de cache
   * Usa apenas primeiros 16 caracteres para economizar memória
   */
  private getCacheKey;
  /**
   * Limpa cache quando atinge tamanho máximo (LRU real)
   * Remove 20% dos itens menos usados recentemente
   */
  private evictCacheIfNeeded;
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(chunks: Chunk[]): Promise<ChunkWithEmbedding[]>;
  /**
   * Limpa cache manualmente (útil para testes ou quando necessário)
   */
  clearCache(): void;
  /**
   * Retorna estatísticas do cache com hit rate
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    hits: number;
    misses: number;
    totalRequests: number;
  };
}
//# sourceMappingURL=embeddings.d.ts.map
