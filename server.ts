/**
 * Servidor RAG usando Hono.js
 * Execute: npm install && npm start
 *
 * Nota: O aviso sobre GNotificationCenterDelegate é inofensivo e ocorre porque
 * tanto canvas quanto sharp (dependência de @xenova/transformers) carregam
 * bibliotecas nativas com classes duplicadas. Isso não afeta a funcionalidade.
 */

// Suprimir avisos de conflito entre canvas e sharp (inofensivo, mas verboso)
// O sharp é uma dependência do @xenova/transformers e o aviso é emitido pelo runtime Objective-C
// Este é um problema conhecido no macOS quando canvas e sharp carregam bibliotecas nativas conflitantes
if (process.platform === "darwin") {
  // Interceptar stderr ANTES de qualquer import para capturar avisos de inicialização
  const originalWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = function (
    chunk: string | Uint8Array,
    encoding?: BufferEncoding | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void
  ): boolean {
    const str = typeof chunk === "string" ? chunk : chunk.toString();

    // Filtrar avisos sobre GNotificationCenterDelegate e conflitos de classes Objective-C
    // Padrões mais abrangentes para capturar todas as variações
    if (
      str.includes("GNotificationCenterDelegate") ||
      (str.includes("objc[") &&
        ((str.includes("Class") && str.includes("implemented in both")) ||
          str.includes("duplicate") ||
          (str.includes("libgio") && str.includes("libvips")))) ||
      (str.includes("libgio-2.0.0.dylib") && str.includes("libvips-cpp"))
    ) {
      return true; // Suprimir esse aviso específico
    }

    // Preservar comportamento original para outros erros
    if (typeof encoding === "function") {
      return originalWrite(chunk, encoding);
    }
    return originalWrite(chunk, encoding, cb);
  } as typeof process.stderr.write;
}

import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import "reflect-metadata";
import { config } from "./src/config/index.js";
import { container, TYPES } from "./src/infrastructure/container.js";
import type { EmbeddingGenerator } from "./src/infrastructure/embeddings.js";
import { DocumentProcessor } from "./src/infrastructure/processors/documentProcessor.js";
import type { SessionCleaner } from "./src/infrastructure/sessionManagement/sessionCleaner.js";
import { closeRedis } from "./src/redis/client.js";
import { logger } from "./src/shared/logging/logger.js";

// Carregar variáveis de ambiente
dotenv.config();

// Importar app Hono centralizado (todas as rotas estão lá)
import app from "./src/presentation/app.js";

// Iniciar servidor
const port = config.port;
let server: ReturnType<typeof serve> | null = null;

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Iniciando graceful shutdown");

  // Parar de aceitar novas conexões
  if (server) {
    server.close(() => {
      logger.info("Servidor HTTP fechado");
    });
  }

  // Finalizar operações pendentes
  try {
    await Promise.all([
      // Limpar OCR worker
      DocumentProcessor.cleanupOCRWorker(),

      // Parar session cleaner
      (async () => {
        try {
          const sessionCleaner = container.get<SessionCleaner>(TYPES.SessionCleaner);
          sessionCleaner.stop();
        } catch {
          // Ignorar se não estiver inicializado
        }
      })(),

      // Limpar cache de embeddings
      (async () => {
        try {
          const embeddingGenerator = container.get<EmbeddingGenerator>(TYPES.EmbeddingGenerator);
          embeddingGenerator.clearCache();
        } catch {
          // Ignorar se não estiver inicializado
        }
      })(),

      // Fechar Redis
      closeRedis(),
    ]);

    logger.info("Shutdown completo");
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, "Erro durante shutdown");
    process.exit(1);
  }
}

// Handlers de shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handler de erros não tratados
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
});

process.on("uncaughtException", (error) => {
  logger.error({ error: error.message, stack: error.stack }, "Uncaught Exception");
  gracefulShutdown("uncaughtException");
});

// Iniciar servidor
logger.info({ port, env: config.nodeEnv }, "Iniciando servidor RAG");

server = serve({
  fetch: app.fetch,
  port,
});

logger.info(`🚀 Servidor RAG rodando em http://localhost:${port}`);
