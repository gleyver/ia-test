/**
 * Cache de respostas do LLM
 * Gerencia cache com TTL e tamanho máximo
 */
import type { GenerateResult } from "./generator.js";
/**
 * Cache de respostas do LLM
 */
export declare class ResponseCache {
  private cache;
  private maxAge;
  readonly maxSize: number;
  constructor(maxAgeMinutes?: number, maxSize?: number);
  /**
   * Gera hash do prompt para usar como chave de cache
   */
  private getCacheKey;
  /**
   * Obtém resposta do cache se válida
   */
  get(prompt: string): GenerateResult | null;
  /**
   * Armazena resposta no cache
   */
  set(prompt: string, response: GenerateResult): void;
  /**
   * Remove entradas mais antigas do cache
   */
  private evictOldest;
  /**
   * Limpa cache
   */
  clear(): void;
  /**
   * Retorna tamanho atual do cache
   */
  size(): number;
}
//# sourceMappingURL=responseCache.d.ts.map
