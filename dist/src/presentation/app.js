/**
 * Aplicação Hono centralizada
 * Contém todas as rotas e lógica do sistema RAG
 * Pode ser usada tanto no servidor Node.js quanto no Azure Functions
 */
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
import { handleQueryError, handleQueryWithFile, handleQueryWithoutFile, } from "./handlers/queryHandlers.js";
import { optionalAuth } from "./middleware/authMiddleware.js";
import { optionalPermission } from "./middleware/optionalPermissionMiddleware.js";
import { FormDataParser } from "./parsers/formDataParser.js";
import authRoutes from "./routes/authRoutes.js";
// Criar app Hono
const app = new Hono();
// CORS restritivo
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
app.use("/*", cors({
    origin: (origin) => {
        // Permitir requisições sem origin (ex: Postman, curl)
        if (!origin) {
            return origin;
        }
        // Verificar se origin está na lista permitida
        if (allowedOrigins.includes(origin)) {
            return origin;
        }
        // Em desenvolvimento, permitir localhost
        if (config.nodeEnv === "development" && origin.includes("localhost")) {
            return origin;
        }
        return null; // Bloquear origem não permitida
    },
    credentials: true,
    maxAge: 86400, // 24 horas
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
}));
// Rate Limiting distribuído (aplicar em todas as rotas da API)
app.use("/api/*", distributedRateLimitMiddleware());
// Autenticação opcional para todas as rotas da API
// Rotas específicas podem usar requireAuth() para tornar obrigatório
app.use("/api/*", optionalAuth());
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
// Endpoint de métricas Prometheus
app.get("/metrics", async (c) => {
    return c.text(await register.metrics());
});
// Rotas de autenticação (sem autenticação obrigatória)
app.route("/api/auth", authRoutes);
// ==================== ROTAS API ====================
// Health check (sem autenticação)
app.get("/api/health", async (c) => {
    try {
        const healthCheckService = container.get(TYPES.HealthCheckService);
        const result = await healthCheckService.checkAll();
        const allHealthy = Object.values(result.dependencies).every((d) => {
            if (typeof d === "object" && d !== null && "status" in d) {
                return d.status === "ok";
            }
            return true; // circuitBreaker não tem status
        });
        return c.json(result, allHealthy ? 200 : 503);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, "Erro no health check");
        return c.json({
            status: "error",
            message: "Erro ao verificar saúde do sistema",
        }, 503);
    }
});
// Upload e processar documento (autenticação opcional, mas valida permissão se autenticado)
app.post("/api/documents/upload", optionalAuth(), optionalPermission("document", "upload"), async (c) => {
    const formDataParser = new FormDataParser();
    const fileAdapter = new FileAdapter();
    const documentService = container.get(TYPES.DocumentService);
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
// Upload + Query em uma única chamada (autenticação opcional)
app.post("/api/query", optionalAuth(), optionalPermission("query", "create"), async (c) => {
    const formDataParser = new FormDataParser();
    const fileAdapter = new FileAdapter();
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
        // Processar com ou sem arquivo
        if (parsed.file) {
            const fileLike = fileAdapter.toFileLike(parsed.file);
            return await handleQueryWithFile(c, query, sessionId, fileLike);
        }
        return await handleQueryWithoutFile(c, query);
    }
    catch (error) {
        return handleQueryError(error);
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
// Limpar coleção manualmente (autenticação opcional, mas valida permissão se autenticado)
app.delete("/api/collection", optionalAuth(), optionalPermission("collection", "delete"), async (c) => {
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