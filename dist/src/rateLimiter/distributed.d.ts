/**
 * Rate Limiter Distribuído usando Redis
 * Funciona em múltiplas instâncias
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}
declare class DistributedRateLimiter {
  private redis;
  private windowMs;
  private maxRequests;
  private fallbackToMemory;
  private memoryStore;
  constructor({ windowMs, maxRequests }?: { windowMs?: number; maxRequests?: number });
  /**
   * Verifica se requisição deve ser permitida
   */
  check(key: string): Promise<RateLimitResult>;
  private checkWithRedis;
  private checkWithMemory;
  private cleanupMemoryStore;
  /**
   * Obtém chave do cliente (IP ou identificador)
   */
  getKey(ip: string | null, userId?: string): string;
}
export declare function getDistributedRateLimiter(): DistributedRateLimiter;
/**
 * Middleware de rate limiting para Hono (distribuído)
 */
export declare function distributedRateLimitMiddleware(): (
  c: {
    req: {
      header: (name: string) => string | undefined;
    };
    header: (name: string, value: string) => void;
  },
  next: () => Promise<void>
) => Promise<void>;
export {};
//# sourceMappingURL=distributed.d.ts.map
