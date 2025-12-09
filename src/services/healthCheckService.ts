/**
 * Serviço de Health Check
 * Centraliza lógica de verificação de saúde do sistema
 */

import { access, constants } from "fs/promises";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { config } from "../config/index.js";
import type { ResponseGenerator } from "../infrastructure/llm/generator.js";
import { getRedisClient } from "../redis/client.js";
import { logger } from "../shared/logging/logger.js";
import { TYPES } from "../shared/types/types.js";

export interface HealthStatus {
  status: "ok" | "error";
  message?: string;
}

export interface HealthCheckResult {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  dependencies: {
    ollama: HealthStatus;
    vectorDb: HealthStatus;
    redis: HealthStatus;
    circuitBreaker: {
      state: string;
      stats: unknown;
    };
  };
  memory: NodeJS.MemoryUsage;
}

@injectable()
export class HealthCheckService {
  constructor(@inject(TYPES.ResponseGenerator) private responseGenerator: ResponseGenerator) {}

  async checkAll(): Promise<HealthCheckResult> {
    const [ollama, vectorDb, redis, circuitBreaker] = await Promise.all([
      this.checkOllama(),
      this.checkVectorDb(),
      this.checkRedis(),
      this.checkCircuitBreaker(),
    ]);

    const allHealthy = [ollama, vectorDb, redis].every((d) => d.status === "ok");

    return {
      status: allHealthy ? "ok" : "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        ollama,
        vectorDb,
        redis,
        circuitBreaker,
      },
      memory: process.memoryUsage(),
    };
  }

  async checkOllama(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${config.ollama.url}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok
        ? { status: "ok" }
        : { status: "error", message: `HTTP ${response.status}` };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkVectorDb(): Promise<HealthStatus> {
    try {
      await access(config.sessions.dbPath, constants.F_OK);
      return { status: "ok" };
    } catch {
      return { status: "ok", message: "Diretório será criado automaticamente" };
    }
  }

  async checkRedis(): Promise<HealthStatus> {
    if (!config.redis.enabled) {
      return { status: "ok", message: "Redis desabilitado (usando memória)" };
    }
    try {
      const redis = getRedisClient();
      if (!redis) {
        return { status: "error", message: "Redis não conectado" };
      }
      await redis.ping();
      return { status: "ok" };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkCircuitBreaker(): Promise<{ state: string; stats: unknown }> {
    try {
      const circuitBreaker = this.responseGenerator.getCircuitBreaker();
      if (circuitBreaker) {
        return {
          state: circuitBreaker.getState(),
          stats: circuitBreaker.getStats(),
        };
      }
      return { state: "unknown", stats: null };
    } catch (error) {
      logger.warn({ error }, "Erro ao verificar circuit breaker");
      return { state: "unknown", stats: null };
    }
  }
}
