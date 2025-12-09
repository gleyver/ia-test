/**
 * Serviço de Health Check
 * Centraliza lógica de verificação de saúde do sistema
 */
import "reflect-metadata";
import type { ResponseGenerator } from "../infrastructure/llm/generator.js";
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
export declare class HealthCheckService {
  private responseGenerator;
  constructor(responseGenerator: ResponseGenerator);
  checkAll(): Promise<HealthCheckResult>;
  checkOllama(): Promise<HealthStatus>;
  checkVectorDb(): Promise<HealthStatus>;
  checkRedis(): Promise<HealthStatus>;
  checkCircuitBreaker(): Promise<{
    state: string;
    stats: unknown;
  }>;
}
//# sourceMappingURL=healthCheckService.d.ts.map
