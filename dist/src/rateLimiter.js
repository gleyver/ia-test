/**
 * Rate Limiter simples em memória
 * Protege contra DDoS e abuso de API
 */
import { distributedRateLimitMiddleware } from "./rateLimiter/distributed.js";
import { logger } from "./shared/logging/logger.js";
class RateLimiter {
    store = new Map();
    windowMs;
    maxRequests;
    cleanupInterval;
    constructor({ windowMs = 15 * 60 * 1000, // 15 minutos padrão
    maxRequests = 100, // 100 requisições por janela
     } = {}) {
        this.windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || windowMs;
        this.maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || maxRequests;
        // Limpar entradas expiradas a cada minuto
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 1000);
        logger.info({
            windowMs: this.windowMs,
            maxRequests: this.maxRequests,
        }, "Rate limiter configurado");
    }
    /**
     * Verifica se requisição deve ser permitida
     */
    check(key) {
        const now = Date.now();
        const entry = this.store.get(key);
        // Se não existe ou expirou, criar nova entrada
        if (!entry || now > entry.resetTime) {
            const resetTime = now + this.windowMs;
            this.store.set(key, {
                count: 1,
                resetTime,
            });
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetTime,
            };
        }
        // Se excedeu limite, negar
        if (entry.count >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }
        // Incrementar contador
        entry.count++;
        this.store.set(key, entry);
        return {
            allowed: true,
            remaining: this.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }
    /**
     * Limpa entradas expiradas
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.debug({ cleaned, remaining: this.store.size }, "Rate limiter cleanup");
        }
    }
    /**
     * Obtém chave do cliente (IP ou identificador)
     */
    getKey(ip, userId) {
        // Se tiver userId, usar como chave (mais preciso)
        if (userId) {
            return `user:${userId}`;
        }
        // Caso contrário, usar IP
        return `ip:${ip || "unknown"}`;
    }
    /**
     * Para limpeza ao desligar
     */
    stop() {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}
// Singleton do rate limiter
let rateLimiterInstance = null;
export function getRateLimiter() {
    if (!rateLimiterInstance) {
        rateLimiterInstance = new RateLimiter({
            windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
            maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        });
    }
    return rateLimiterInstance;
}
// Re-exportar o distribuído
export { distributedRateLimitMiddleware } from "./rateLimiter/distributed.js";
/**
 * Middleware de rate limiting para Hono
 * @deprecated Use distributedRateLimitMiddleware() para suporte a múltiplas instâncias
 */
export function rateLimitMiddleware() {
    // Re-exportar o distribuído como padrão
    return distributedRateLimitMiddleware();
}
//# sourceMappingURL=rateLimiter.js.map