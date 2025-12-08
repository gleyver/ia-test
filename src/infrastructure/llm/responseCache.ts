/**
 * Cache de respostas do LLM
 * Gerencia cache com TTL e tamanho máximo
 */

import { createHash } from "crypto";
import type { GenerateResult } from "./generator.js";

interface CachedResponse {
  response: GenerateResult;
  timestamp: number;
}

/**
 * Cache de respostas do LLM
 */
export class ResponseCache {
  private cache: Map<string, CachedResponse>;
  private maxAge: number; // em milissegundos
  public readonly maxSize: number;

  constructor(maxAgeMinutes: number = 5, maxSize: number = 1000) {
    this.cache = new Map();
    this.maxAge = maxAgeMinutes * 60 * 1000;
    this.maxSize = maxSize;
  }

  /**
   * Gera hash do prompt para usar como chave de cache
   */
  private getCacheKey(prompt: string): string {
    return createHash("sha256").update(prompt).digest("hex");
  }

  /**
   * Obtém resposta do cache se válida
   */
  get(prompt: string): GenerateResult | null {
    const key = this.getCacheKey(prompt);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Verificar se expirou
    const age = Date.now() - cached.timestamp;
    if (age > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  /**
   * Armazena resposta no cache
   */
  set(prompt: string, response: GenerateResult): void {
    const key = this.getCacheKey(prompt);

    // Limpar cache se exceder tamanho máximo
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove entradas mais antigas do cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Limpa cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna tamanho atual do cache
   */
  size(): number {
    return this.cache.size;
  }
}
