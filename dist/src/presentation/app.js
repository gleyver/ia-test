/**
 * Aplicação Hono centralizada
 * Contém todas as rotas e lógica do sistema RAG
 * Pode ser usada tanto no servidor Node.js quanto no Azure Functions
 */
import { unlink } from "fs/promises";
import { Hono } from "hono";
import { cors } from "hono/cors";
import "reflect-metadata";
import { config } from "../config/index.js";
import { Query } from "../domain/valueObjects/query.js";
import { SessionId } from "../domain/valueObjects/sessionId.js";
import { container, TYPES } from "../infrastructure/container.js";
import { register } from "../metrics/index.js";
import { distributedRateLimitMiddleware } from "../rateLimiter/distributed.js";
import { AppError, ProcessingError, ValidationError } from "../shared/errors/errors.js";
import { logger } from "../shared/logging/logger.js";
import { FileAdapter } from "./adapters/fileAdapter.js";
import { FormDataParser } from "./parsers/formDataParser.js";
// Criar app Hono
const app = new Hono();
// CORS
app.use("/*", cors());
// Rate Limiting distribuído (aplicar em todas as rotas da API)
app.use("/api/*", distributedRateLimitMiddleware());
// Middleware de métricas HTTP
app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    const duration = (Date.now() - start) / 1000;
    const { httpRequestDuration, httpRequestsTotal } = await import("../metrics/index.js");
    httpRequestDuration.observe({ method: c.req.method, route: c.req.path, status: c.res.status.toString() }, duration);
    httpRequestsTotal.inc({
        method: c.req.method,
        route: c.req.path,
        status: c.res.status.toString(),
    });
});
// Tratamento de erros global
app.onError((err, c) => {
    const isDev = process.env.NODE_ENV !== "production";
    // Se for erro estruturado (AppError), usar seus dados
    if (err instanceof AppError) {
        logger.error({
            error: err.message,
            code: err.code,
            statusCode: err.statusCode,
            details: err.details,
            stack: isDev ? err.stack : undefined,
        }, "Erro na requisição");
        const responseBody = {
            error: err.message,
            code: err.code,
        };
        if (isDev && err.details) {
            responseBody.details = err.details;
        }
        return c.json(responseBody, err.statusCode);
    }
    // Erro genérico
    logger.error({
        error: err.message,
        stack: isDev ? err.stack : undefined,
    }, "Erro não tratado");
    return c.json({
        error: isDev ? err.message : "Erro interno do servidor",
        ...(isDev && { stack: err.stack }),
    }, 500);
});
// Obter serviços do container DI
function getDocumentService() {
    return container.get(TYPES.DocumentService);
}
function getQueryService() {
    return container.get(TYPES.QueryService);
}
function createSessionVectorDB(sessionId) {
    const factory = container.get(TYPES.VectorDBFactory);
    return factory(sessionId);
}
// Endpoint de métricas Prometheus
app.get("/metrics", async (c) => {
    return c.text(await register.metrics());
});
// ==================== ROTAS API ====================
// Health check
app.get("/api/health", async (c) => {
    // Verificar estado do Circuit Breaker
    let circuitBreakerState = "unknown";
    let circuitBreakerStats = null;
    try {
        const responseGenerator = container.get(TYPES.ResponseGenerator);
        const circuitBreaker = responseGenerator.getCircuitBreaker();
        if (circuitBreaker) {
            circuitBreakerState = circuitBreaker.getState();
            circuitBreakerStats = circuitBreaker.getStats();
        }
    }
    catch {
        // Ignorar erros ao verificar circuit breaker
    }
    const checks = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        dependencies: {
            ollama: await checkOllama(),
            vectorDb: await checkVectorDb(),
            redis: await checkRedis(),
            circuitBreaker: {
                state: circuitBreakerState,
                stats: circuitBreakerStats,
            },
        },
        memory: process.memoryUsage(),
    };
    const allHealthy = Object.values(checks.dependencies).every((d) => {
        if (typeof d === "object" && d !== null && "status" in d) {
            return d.status === "ok";
        }
        return true; // circuitBreaker não tem status
    });
    return c.json(checks, allHealthy ? 200 : 503);
});
async function checkOllama() {
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
async function checkVectorDb() {
    try {
        const { access, constants } = await import("fs/promises");
        await access(config.sessions.dbPath, constants.F_OK);
        return { status: "ok" };
    }
    catch {
        return { status: "ok", message: "Diretório será criado automaticamente" };
    }
}
async function checkRedis() {
    if (!config.redis.enabled) {
        return { status: "ok", message: "Redis desabilitado (usando memória)" };
    }
    try {
        const { getRedisClient } = await import("../redis/client.js");
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
// Upload e processar documento
app.post("/api/documents/upload", async (c) => {
    const formDataParser = new FormDataParser();
    const fileAdapter = new FileAdapter();
    const documentService = getDocumentService();
    try {
        const parsed = await formDataParser.parse(c);
        if (!parsed.file) {
            throw new ValidationError("Nenhum arquivo enviado");
        }
        const fileLike = fileAdapter.toFileLike(parsed.file);
        const sessionId = SessionId.generate();
        const result = await documentService.processAndIndex(fileLike, sessionId.toString());
        return c.json({
            success: true,
            sessionId: result.sessionId,
            filename: result.filename,
            chunksCreated: result.chunksCreated,
            metadata: result.metadata,
        });
    }
    catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, "Erro ao processar documento");
        throw new ProcessingError("Erro ao processar documento", { originalError: errorMessage });
    }
});
// Upload + Query em uma única chamada
app.post("/api/query", async (c) => {
    const formDataParser = new FormDataParser();
    const fileAdapter = new FileAdapter();
    const documentService = getDocumentService();
    const queryService = getQueryService();
    try {
        // Parse form-data
        const parsed = await formDataParser.parse(c);
        // Validar e criar Value Objects
        if (!parsed.query || typeof parsed.query !== "string") {
            throw new ValidationError("Query é obrigatória");
        }
        const query = Query.fromString(parsed.query);
        const sessionId = SessionId.generate();
        logger.debug({ sessionId: sessionId.toString() }, "Sessão criada");
        // CENÁRIO 1: COM arquivo
        if (parsed.file) {
            const fileLike = fileAdapter.toFileLike(parsed.file);
            if (fileLike.size > 0 && (fileLike.tempPath || fileLike.name)) {
                logger.info({ filename: fileLike.name }, "CENÁRIO 1: Arquivo enviado - Processando e respondendo baseado no arquivo");
                try {
                    // Processar arquivo usando serviço
                    await documentService.processAndIndex(fileLike, sessionId.toString());
                    // Criar VectorDB para buscar documentos
                    const sessionVectorDb = createSessionVectorDB(sessionId.toString());
                    await sessionVectorDb.initialize();
                    // Executar query usando serviço
                    const result = await queryService.executeQuery(query.toString(), sessionVectorDb, true);
                    return c.json({
                        success: true,
                        response: result.response,
                        sources: result.sources,
                        metadata: result.metadata,
                        fileProcessed: fileLike.name || null,
                    });
                }
                catch (error) {
                    if (error instanceof AppError) {
                        throw error;
                    }
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger.error({ error: errorMessage, sessionId: sessionId.toString() }, "Erro ao processar documento");
                    throw new ProcessingError("Erro ao processar arquivo", {
                        originalError: errorMessage,
                        hint: "Verifique se o arquivo está em um formato suportado (PDF, DOCX, TXT, HTML)",
                    });
                }
                finally {
                    // Limpar arquivo temporário (se foi criado pelo parser)
                    if (fileLike.tempPath) {
                        try {
                            await unlink(fileLike.tempPath);
                        }
                        catch {
                            // Ignorar erros ao deletar
                        }
                    }
                }
            }
        }
        // CENÁRIO 2: SEM arquivo
        logger.info("CENÁRIO 2: Sem arquivo - Respondendo usando conhecimento do modelo");
        const result = await queryService.executeQuery(query.toString(), null, false);
        return c.json({
            success: true,
            response: result.response,
            sources: result.sources,
            metadata: result.metadata,
            fileProcessed: null,
        });
    }
    catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, "Erro na query");
        throw new ProcessingError("Erro ao processar query", { originalError: errorMessage });
    }
});
// Informações da coleção (deprecated - agora cada sessão tem sua própria coleção)
app.get("/api/collection/info", async (c) => {
    try {
        const sessionCleaner = container.get(TYPES.SessionCleaner);
        const stats = await sessionCleaner.getStats();
        return c.json({
            message: "Coleções agora são isoladas por sessão. Cada requisição cria sua própria coleção.",
            stats: {
                totalSessions: stats.totalSessions,
                oldSessions: stats.oldSessions,
                totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2),
                oldSessionsSizeMB: (stats.oldSessionsSize / 1024 / 1024).toFixed(2),
            },
            note: "Sessões antigas são limpas automaticamente.",
        });
    }
    catch {
        return c.json({
            message: "Coleções agora são isoladas por sessão. Cada requisição cria sua própria coleção.",
            note: "Use o sessionId retornado nas respostas para identificar a coleção específica.",
        });
    }
});
// Resetar Circuit Breaker (útil quando está aberto)
app.post("/api/circuit-breaker/reset", async (c) => {
    try {
        const responseGenerator = container.get(TYPES.ResponseGenerator);
        const circuitBreaker = responseGenerator.getCircuitBreaker();
        if (circuitBreaker) {
            circuitBreaker.reset();
            return c.json({
                success: true,
                message: "Circuit Breaker resetado com sucesso",
                state: circuitBreaker.getState(),
            });
        }
        return c.json({ success: false, message: "Circuit Breaker não encontrado" }, 404);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, "Erro ao resetar Circuit Breaker");
        return c.json({ success: false, error: errorMessage }, 500);
    }
});
// Limpar coleção manualmente (útil para testes ou limpeza imediata)
app.delete("/api/collection", async (c) => {
    try {
        const sessionCleaner = container.get(TYPES.SessionCleaner);
        const result = await sessionCleaner.cleanupNow();
        return c.json({
            success: true,
            message: "Limpeza manual executada.",
            stats: {
                sessionsChecked: result.sessionsChecked,
                sessionsDeleted: result.sessionsDeleted,
                sizeFreedMB: (result.totalSizeFreed / 1024 / 1024).toFixed(2),
                errors: result.errors,
            },
        });
    }
    catch {
        return c.json({
            message: "Limpeza automática não está configurada.",
        });
    }
});
// Exportar app Hono
export default app;
//# sourceMappingURL=app.js.map