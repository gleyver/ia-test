/**
 * Rate Limiter Distribuído usando Redis
 * Funciona em múltiplas instâncias
 */

import { config } from "../config/index.js";
import { getRedisClient } from "../redis/client.js";
import { RateLimitError } from "../shared/errors/errors.js";
import { logger } from "../shared/logging/logger.js";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

class DistributedRateLimiter {
  private redis = getRedisClient();
  private windowMs: number;
  private maxRequests: number;
  private fallbackToMemory: boolean = true;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor({
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
  }: {
    windowMs?: number;
    maxRequests?: number;
  } = {}) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    if (!this.redis) {
      logger.warn("Redis não disponível, usando rate limiter em memória (não distribuído)");
      this.fallbackToMemory = true;
    } else {
      this.fallbackToMemory = false;
      logger.info(
        { windowMs: this.windowMs, maxRequests: this.maxRequests },
        "Rate limiter distribuído configurado (Redis)"
      );
    }
  }

  /**
   * Verifica se requisição deve ser permitida
   */
  async check(key: string): Promise<RateLimitResult> {
    if (this.redis && !this.fallbackToMemory) {
      return this.checkWithRedis(key);
    }
    return this.checkWithMemory(key);
  }

  private async checkWithRedis(key: string): Promise<RateLimitResult> {
    if (!this.redis) {
      return this.checkWithMemory(key);
    }

    try {
      const redisKey = `ratelimit:${key}`;
      const now = Date.now();
      const windowStart = now - this.windowMs;

      // Usar pipeline para múltiplas operações atômicas
      const pipeline = this.redis.pipeline();

      // Remover entradas expiradas (usando sorted set)
      pipeline.zremrangebyscore(redisKey, 0, windowStart);

      // Contar requisições na janela
      pipeline.zcard(redisKey);

      // Adicionar requisição atual
      pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Definir TTL
      pipeline.expire(redisKey, Math.ceil(this.windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error("Pipeline execution failed");
      }

      const count = (results[1]?.[1] as number) || 0;
      const allowed = count < this.maxRequests;
      const remaining = Math.max(0, this.maxRequests - count - 1);
      const resetTime = now + this.windowMs;

      if (!allowed) {
        logger.warn({ key, count, maxRequests: this.maxRequests }, "Rate limit excedido");
      }

      return {
        allowed,
        remaining,
        resetTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        { error: errorMessage },
        "Erro no rate limiter Redis, usando fallback em memória"
      );
      this.fallbackToMemory = true;
      return this.checkWithMemory(key);
    }
  }

  private checkWithMemory(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.memoryStore.get(key);

    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs;
      this.memoryStore.set(key, {
        count: 1,
        resetTime,
      });

      // Limpar entradas expiradas periodicamente
      this.cleanupMemoryStore();

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    this.memoryStore.set(key, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (now > entry.resetTime) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Obtém chave do cliente (IP ou identificador)
   */
  getKey(ip: string | null, userId?: string): string {
    if (userId) {
      return `user:${userId}`;
    }
    return `ip:${ip || "unknown"}`;
  }
}

// Singleton
let rateLimiterInstance: DistributedRateLimiter | null = null;

export function getDistributedRateLimiter(): DistributedRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new DistributedRateLimiter({
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests,
    });
  }
  return rateLimiterInstance;
}

/**
 * Middleware de rate limiting para Hono (distribuído)
 */
export function distributedRateLimitMiddleware() {
  const limiter = getDistributedRateLimiter();

  return async (
    c: {
      req: { header: (name: string) => string | undefined };
      header: (name: string, value: string) => void;
    },
    next: () => Promise<void>
  ) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      c.req.header("cf-connecting-ip") ||
      "unknown";

    const key = limiter.getKey(ip);
    const result = await limiter.check(key);

    c.header("X-RateLimit-Limit", String(config.rateLimit.maxRequests));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.resetTime / 1000)));

    if (!result.allowed) {
      logger.warn({ ip, key }, "Rate limit excedido");
      throw new RateLimitError(
        `Muitas requisições. Tente novamente após ${new Date(result.resetTime).toISOString()}`,
        {
          resetTime: result.resetTime,
          remaining: result.remaining,
        }
      );
    }

    await next();
  };
}
