/**
 * Cliente Redis para cache distribuído e rate limiting
 * Com connection pooling otimizado para alta concorrência
 */
import Redis from "ioredis";
import { config } from "../config/index.js";
import { logger } from "../shared/logging/logger.js";
let redisClient = null;
export function getRedisClient() {
    if (!config.redis.enabled) {
        return null;
    }
    if (!redisClient) {
        try {
            redisClient = new Redis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password,
                db: config.redis.db,
                // Connection pooling otimizado
                family: 4, // IPv4
                keepAlive: 30000, // Keep-alive de 30s
                connectTimeout: 10000, // Timeout de conexão de 10s
                lazyConnect: false, // Conectar imediatamente
                // Retry strategy melhorada
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                // Pool configuration (ioredis gerencia automaticamente)
                enableReadyCheck: true,
                enableOfflineQueue: true,
                maxRetriesPerRequest: 3,
                // Performance
                enableAutoPipelining: true, // Pipeline automático para múltiplas operações
                // Connection pool size (padrão do ioredis é ilimitado, mas controlado pelo sistema)
            });
            redisClient.on("connect", () => {
                logger.info("Redis conectado");
            });
            redisClient.on("ready", () => {
                logger.info("Redis pronto para receber comandos");
            });
            redisClient.on("error", (error) => {
                logger.error({ error: error.message }, "Erro no Redis");
            });
            redisClient.on("close", () => {
                logger.warn("Conexão Redis fechada");
            });
            redisClient.on("reconnecting", (delay) => {
                logger.info({ delay }, "Reconectando ao Redis");
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ error: errorMessage }, "Falha ao conectar Redis");
            return null;
        }
    }
    return redisClient;
}
export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info("Redis desconectado");
    }
}
//# sourceMappingURL=client.js.map