/**
 * Cache Distribuído de Embeddings usando Redis
 * Compartilhado entre múltiplas instâncias
 */

import { createHash } from "crypto";
import { getRedisClient } from "../redis/client.js";
import { logger } from "../shared/logging/logger.js";

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 dias em segundos

export class DistributedEmbeddingCache {
  private redis = getRedisClient();
  private fallbackCache: Map<string, { embedding: number[]; lastUsed: number }> = new Map();
  private maxFallbackSize = 10000;

  /**
   * Gera hash do texto para usar como chave de cache
   */
  private getCacheKey(text: string): string {
    return createHash("sha256").update(text).digest("hex").substring(0, 16);
  }

  /**
   * Obtém embedding do cache
   */
  async get(text: string): Promise<number[] | null> {
    const key = this.getCacheKey(text);

    if (this.redis) {
      try {
        const cached = await this.redis.get(`embedding:${key}`);
        if (cached) {
          logger.debug({ cacheKey: key.substring(0, 8) }, "Cache hit Redis");
          return JSON.parse(cached);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn({ error: errorMessage }, "Erro ao buscar no Redis, usando fallback");
      }
    }

    // Fallback para cache em memória
    const cached = this.fallbackCache.get(key);
    if (cached) {
      cached.lastUsed = Date.now();
      logger.debug({ cacheKey: key.substring(0, 8) }, "Cache hit memória");
      return cached.embedding;
    }

    return null;
  }

  /**
   * Armazena embedding no cache
   */
  async set(text: string, embedding: number[]): Promise<void> {
    const key = this.getCacheKey(text);

    if (this.redis) {
      try {
        await this.redis.setex(`embedding:${key}`, CACHE_TTL, JSON.stringify(embedding));
        logger.debug({ cacheKey: key.substring(0, 8) }, "Embedding cacheado no Redis");
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn({ error: errorMessage }, "Erro ao salvar no Redis, usando fallback");
      }
    }

    // Fallback para cache em memória
    this.evictFallbackIfNeeded();
    this.fallbackCache.set(key, {
      embedding,
      lastUsed: Date.now(),
    });
    logger.debug({ cacheKey: key.substring(0, 8) }, "Embedding cacheado em memória");
  }

  /**
   * Limpa cache
   */
  async clear(): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys("embedding:*");
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn({ error: errorMessage }, "Erro ao limpar cache Redis");
      }
    }
    this.fallbackCache.clear();
    logger.info("Cache de embeddings limpo");
  }

  /**
   * Limpa cache fallback quando atinge tamanho máximo
   */
  private evictFallbackIfNeeded(): void {
    if (this.fallbackCache.size >= this.maxFallbackSize) {
      // Remover 20% mais antigos
      const entries = Array.from(this.fallbackCache.entries())
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed)
        .slice(0, Math.floor(this.maxFallbackSize * 0.2));

      entries.forEach(([key]) => this.fallbackCache.delete(key));
      logger.debug({ removed: entries.length }, "Cache fallback limpo");
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  async getStats(): Promise<{
    redisEnabled: boolean;
    redisSize?: number;
    fallbackSize: number;
  }> {
    let redisSize: number | undefined;
    if (this.redis) {
      try {
        const keys = await this.redis.keys("embedding:*");
        redisSize = keys.length;
      } catch {
        // Ignorar erro
      }
    }

    return {
      redisEnabled: this.redis !== null,
      redisSize,
      fallbackSize: this.fallbackCache.size,
    };
  }
}

// Singleton
let cacheInstance: DistributedEmbeddingCache | null = null;

export function getDistributedEmbeddingCache(): DistributedEmbeddingCache {
  if (!cacheInstance) {
    cacheInstance = new DistributedEmbeddingCache();
  }
  return cacheInstance;
}
