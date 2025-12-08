/**
 * Cliente Redis para cache distribuído e rate limiting
 */

import Redis from "ioredis";
import { config } from "../config/index.js";
import { logger } from "../shared/logging/logger.js";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
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
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      redisClient.on("connect", () => {
        logger.info("Redis conectado");
      });

      redisClient.on("error", (error) => {
        logger.error({ error: error.message }, "Erro no Redis");
      });

      redisClient.on("close", () => {
        logger.warn("Conexão Redis fechada");
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Falha ao conectar Redis");
      return null;
    }
  }

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis desconectado");
  }
}
