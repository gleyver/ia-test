/**
 * Serviço de Health Check
 * Centraliza lógica de verificação de saúde do sistema
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { access, constants } from "fs/promises";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { config } from "../config/index.js";
import { getRedisClient } from "../redis/client.js";
import { logger } from "../shared/logging/logger.js";
import { TYPES } from "../shared/types/types.js";
let HealthCheckService = class HealthCheckService {
    responseGenerator;
    constructor(responseGenerator) {
        this.responseGenerator = responseGenerator;
    }
    async checkAll() {
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
    async checkOllama() {
        try {
            const response = await fetch(`${config.ollama.url}/api/tags`, {
                signal: AbortSignal.timeout(3000),
            });
            return response.ok ? { status: "ok" } : { status: "error", message: `HTTP ${response.status}` };
        }
        catch (error) {
            return {
                status: "error",
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async checkVectorDb() {
        try {
            await access(config.sessions.dbPath, constants.F_OK);
            return { status: "ok" };
        }
        catch {
            return { status: "ok", message: "Diretório será criado automaticamente" };
        }
    }
    async checkRedis() {
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
        }
        catch (error) {
            return {
                status: "error",
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async checkCircuitBreaker() {
        try {
            const circuitBreaker = this.responseGenerator.getCircuitBreaker();
            if (circuitBreaker) {
                return {
                    state: circuitBreaker.getState(),
                    stats: circuitBreaker.getStats(),
                };
            }
            return { state: "unknown", stats: null };
        }
        catch (error) {
            logger.warn({ error }, "Erro ao verificar circuit breaker");
            return { state: "unknown", stats: null };
        }
    }
};
HealthCheckService = __decorate([
    injectable(),
    __param(0, inject(TYPES.ResponseGenerator)),
    __metadata("design:paramtypes", [Function])
], HealthCheckService);
export { HealthCheckService };
//# sourceMappingURL=healthCheckService.js.map