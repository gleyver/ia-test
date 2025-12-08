/**
 * Interface para geradores de embeddings
 */
import type { Chunk } from "../../domain/entities/chunker.js";
import type { ChunkWithEmbedding } from "../../infrastructure/embeddings.js";
export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
  totalRequests: number;
}
/**
 * Interface para geradores de embeddings
 */
export interface IEmbeddingGenerator {
  /**
   * Gera embedding para um texto
   */
  generateEmbedding(text: string): Promise<number[]>;
  /**
   * Gera embeddings para múltiplos chunks
   */
  generateEmbeddings(chunks: Chunk[]): Promise<ChunkWithEmbedding[]>;
  /**
   * Retorna estatísticas do cache
   */
  getCacheStats(): CacheStats;
  /**
   * Limpa cache
   */
  clearCache(): void | Promise<void>;
}
//# sourceMappingURL=embeddingGenerator.interface.d.ts.map
