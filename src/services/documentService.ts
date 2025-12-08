/**
 * Serviço de processamento de documentos
 * Isola lógica de negócio das rotas
 */

import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import { inject, injectable } from "inversify";
import { tmpdir } from "os";
import { join } from "path";
import "reflect-metadata";
import type { IDocumentProcessor } from "../domain/interfaces/documentProcessor.interface.js";
import type { IEmbeddingGenerator } from "../domain/interfaces/embeddingGenerator.interface.js";
import type { ITextChunker } from "../domain/interfaces/textChunker.interface.js";
import { ProcessDocumentUseCase } from "../domain/useCases/processDocumentUseCase.js";
import { sanitizeFilename, validateFile } from "../domain/validators.js";
import { FileSize } from "../domain/valueObjects/fileSize.js";
import { SessionId } from "../domain/valueObjects/sessionId.js";
import type { VectorDB } from "../infrastructure/storage/vectorDb.js";
import { documentProcessingDuration, documentsProcessed } from "../metrics/index.js";
import { ProcessingError } from "../shared/errors/errors.js";
import { logger } from "../shared/logging/logger.js";
import type { FileLike } from "../shared/types/types.js";
import { TYPES } from "../shared/types/types.js";

export interface ProcessResult {
  sessionId: string;
  filename: string;
  chunksCreated: number;
  metadata: unknown;
}

@injectable()
export class DocumentService {
  private processDocumentUseCase: ProcessDocumentUseCase;

  constructor(
    @inject(TYPES.DocumentProcessor) documentProcessor: IDocumentProcessor,
    @inject(TYPES.TextChunker) chunker: ITextChunker,
    @inject(TYPES.EmbeddingGenerator) embeddingGenerator: IEmbeddingGenerator,
    @inject(TYPES.VectorDBFactory) createVectorDb: (sessionId: string) => VectorDB
  ) {
    // Criar Use Case com dependências injetadas
    this.processDocumentUseCase = new ProcessDocumentUseCase(
      documentProcessor,
      chunker,
      embeddingGenerator,
      createVectorDb
    );
  }

  async processAndIndex(file: FileLike, sessionId?: string): Promise<ProcessResult> {
    const startTime = Date.now();
    const finalSessionId = sessionId ? SessionId.fromString(sessionId) : SessionId.generate();
    let tempPath: string | null = null;
    let shouldCleanup = false;

    try {
      // Validar tamanho do arquivo usando Value Object
      const fileSize = FileSize.fromBytes(file.size);
      if (fileSize.exceedsMax()) {
        throw new ProcessingError(
          `Arquivo muito grande: ${fileSize.toFormattedString()}. Máximo permitido: ${FileSize.fromBytes(FileSize.MAX_BYTES).toFormattedString()}`
        );
      }

      // Se já tem tempPath (do Busboy), usar diretamente
      if (file.tempPath) {
        tempPath = file.tempPath;
        // Validar arquivo
        const { readFile, stat } = await import("fs/promises");
        const buffer = await readFile(tempPath);
        const stats = await stat(tempPath);
        await validateFile(buffer, file.name || "file", stats.size);
      } else {
        // Validar arquivo
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await validateFile(buffer, file.name || "file", file.size);

        // Sanitizar nome do arquivo
        const sanitizedFilename = sanitizeFilename(file.name || "file");

        // Salvar arquivo temporário
        tempPath = join(tmpdir(), `${randomUUID()}-${sanitizedFilename}`);
        await writeFile(tempPath, buffer);
        shouldCleanup = true; // Marcar para limpar apenas se criamos o arquivo
      }

      // Executar Use Case
      const result = await this.processDocumentUseCase.execute({
        file: { ...file, name: tempPath },
        sessionId: finalSessionId,
      });

      const duration = (Date.now() - startTime) / 1000;
      const extension = (result.metadata as { extension?: string })?.extension || "unknown";
      documentProcessingDuration.observe({ type: extension }, duration);
      documentsProcessed.inc({ type: extension, status: "success" });

      logger.info(
        { sessionId: result.sessionId.toString(), chunksCount: result.chunksCreated, duration },
        "Documento processado e indexado"
      );

      // Obter nome do arquivo sanitizado
      const filename = file.name ? sanitizeFilename(file.name) : "file";

      return {
        sessionId: result.sessionId.toString(),
        filename,
        chunksCreated: result.chunksCreated,
        metadata: result.metadata,
      };
    } catch (error: unknown) {
      const duration = (Date.now() - startTime) / 1000;
      documentsProcessed.inc({ type: "unknown", status: "error" });

      // Limpar arquivo temporário em caso de erro (apenas se criamos)
      if (tempPath && shouldCleanup) {
        try {
          await unlink(tempPath);
        } catch {
          // Ignorar erro ao deletar
        }
      }

      if (error instanceof ProcessingError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        { error: errorMessage, sessionId: finalSessionId.toString(), duration },
        "Erro ao processar documento"
      );
      throw new ProcessingError("Erro ao processar documento", { originalError: errorMessage });
    }
  }
}
