/**
 * Rate Limiter simples em memória
 * Protege contra DDoS e abuso de API
 */
declare class RateLimiter {
  private store;
  private windowMs;
  private maxRequests;
  private cleanupInterval;
  constructor({
    windowMs, // 15 minutos padrão
    maxRequests,
  }?: {
    windowMs?: number;
    maxRequests?: number;
  });
  /**
   * Verifica se requisição deve ser permitida
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  };
  /**
   * Limpa entradas expiradas
   */
  private cleanup;
  /**
   * Obtém chave do cliente (IP ou identificador)
   */
  getKey(ip: string | null, userId?: string): string;
  /**
   * Para limpeza ao desligar
   */
  stop(): void;
}
export declare function getRateLimiter(): RateLimiter;
export { distributedRateLimitMiddleware } from "./rateLimiter/distributed.js";
/**
 * Middleware de rate limiting para Hono
 * @deprecated Use distributedRateLimitMiddleware() para suporte a múltiplas instâncias
 */
export declare function rateLimitMiddleware(): (
  c: {
    req: {
      header: (name: string) => string | undefined;
    };
    header: (name: string, value: string) => void;
  },
  next: () => Promise<void>
) => Promise<void>;
//# sourceMappingURL=rateLimiter.d.ts.map
