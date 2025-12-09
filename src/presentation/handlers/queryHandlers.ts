/**
 * Handlers para rotas de query
 * Separa lógica de processamento das rotas
 */

import { unlink } from "fs/promises";
import { Context } from "hono";
import { Query } from "../../domain/valueObjects/query.js";
import { SessionId } from "../../domain/valueObjects/sessionId.js";
import { container, TYPES } from "../../infrastructure/container.js";
import type { VectorDB } from "../../infrastructure/storage/vectorDb.js";
import type { DocumentService } from "../../services/documentService.js";
import type { QueryService } from "../../services/queryService.js";
import { AppError, ProcessingError } from "../../shared/errors/errors.js";
import { logger } from "../../shared/logging/logger.js";
import type { FileLike } from "../../shared/types/types.js";

function getDocumentService(): DocumentService {
  return container.get<DocumentService>(TYPES.DocumentService);
}

function getQueryService(): QueryService {
  return container.get<QueryService>(TYPES.QueryService);
}

function createSessionVectorDB(sessionId: string): VectorDB {
  const factory = container.get<(sessionId: string) => VectorDB>(TYPES.VectorDBFactory);
  return factory(sessionId);
}

/**
 * Processa query com arquivo
 */
export async function handleQueryWithFile(
  c: Context,
  query: Query,
  sessionId: SessionId,
  file: FileLike
): Promise<Response> {
  const documentService = getDocumentService();
  const queryService = getQueryService();

  if (file.size > 0 && (file.tempPath || file.name)) {
    logger.info({ filename: file.name }, "Processando query com arquivo");

    try {
      // Processar arquivo
      await documentService.processAndIndex(file, sessionId.toString());

      // Criar VectorDB para buscar documentos
      const sessionVectorDb = createSessionVectorDB(sessionId.toString());
      await sessionVectorDb.initialize();

      // Executar query
      const result = await queryService.executeQuery(query.toString(), sessionVectorDb, true);

      return c.json({
        success: true,
        response: result.response,
        sources: result.sources,
        metadata: result.metadata,
        fileProcessed: file.name || null,
      });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        { error: errorMessage, sessionId: sessionId.toString() },
        "Erro ao processar documento"
      );
      throw new ProcessingError("Erro ao processar arquivo", {
        originalError: errorMessage,
        hint: "Verifique se o arquivo está em um formato suportado (PDF, DOCX, TXT, HTML)",
      });
    } finally {
      // Limpar arquivo temporário
      if (file.tempPath) {
        try {
          await unlink(file.tempPath);
        } catch {
          // Ignorar erros ao deletar
        }
      }
    }
  }

  // Se arquivo inválido, tratar como query sem arquivo
  return handleQueryWithoutFile(c, query);
}

/**
 * Processa query sem arquivo
 */
export async function handleQueryWithoutFile(c: Context, query: Query): Promise<Response> {
  const queryService = getQueryService();

  logger.info("Processando query sem arquivo");

  const result = await queryService.executeQuery(query.toString(), null, false);

  return c.json({
    success: true,
    response: result.response,
    sources: result.sources,
    metadata: result.metadata,
    fileProcessed: null,
  });
}

/**
 * Trata erros de query
 */
export function handleQueryError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error({ error: errorMessage }, "Erro na query");
  throw new ProcessingError("Erro ao processar query", { originalError: errorMessage });
}
