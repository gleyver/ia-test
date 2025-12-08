/**
 * Gerador de respostas usando Ollama
 * Implementa Pool de Conexões + Retry com Backoff + Cache de Respostas
 */
import { CircuitBreaker } from "../circuitBreaker/circuitBreaker.js";
import type { SearchResult } from "../storage/vectorDb.js";
export interface GenerateResult {
  response: string;
  sources: string[];
  metadata: {
    model: string;
    numSources: number;
  };
}
import type { IResponseGenerator } from "../../domain/interfaces/responseGenerator.interface.js";
export declare class ResponseGenerator implements IResponseGenerator {
  private static instance;
  private static sharedPool;
  private constructor();
  /**
   * Singleton: retorna instância única do ResponseGenerator
   * Compartilha pool de Ollama entre todas as requisições
   */
  static getInstance({
    model,
    ollamaUrl,
  }?: {
    model?: string;
    ollamaUrl?: string;
  }): ResponseGenerator;
  private getPool;
  buildContext(retrievedDocs: SearchResult[]): string;
  buildPrompt(query: string, context: string, systemMessage?: string | null): string;
  generate(
    query: string,
    retrievedDocs: SearchResult[],
    systemMessage?: string | null
  ): Promise<GenerateResult>;
  /**
   * Gera resposta sem contexto de documentos (chamada direta ao modelo)
   * Usado quando não há arquivo enviado
   */
  generateWithoutContext(query: string): Promise<GenerateResult>;
  /**
   * Retorna estatísticas do pool de Ollama
   */
  getPoolStats(): {
    queueLength: number;
    activeRequests: number;
    maxConcurrent: number;
    cacheSize: number;
    cacheMaxSize: number;
  };
  /**
   * Retorna o Circuit Breaker do pool (para monitoramento e reset)
   */
  getCircuitBreaker(): CircuitBreaker | null;
}
//# sourceMappingURL=generator.d.ts.map
