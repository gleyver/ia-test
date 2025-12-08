/**
 * Processador específico para arquivos DOCX
 */

import { readFile } from "fs/promises";
import mammoth from "mammoth";
import type { ChunkMetadata } from "../../domain/entities/chunker.js";
import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
import { logger } from "../../shared/logging/logger.js";
import type { ProcessResult } from "./documentProcessor.js";

/**
 * Processador de arquivos DOCX
 */
export class DOCXProcessor implements IDocumentProcessor {
  canProcess(extension: string): boolean {
    return extension === ".docx";
  }

  supportedExtensions(): string[] {
    return [".docx"];
  }

  async process(filePath: string): Promise<ProcessResult> {
    const buffer = await readFile(filePath);
    logger.info(`📄 Processando DOCX (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);

    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    const metadata: ChunkMetadata = {
      source: filePath,
      filename: filePath.split("/").pop(),
      extension: ".docx",
    };

    logger.info(`📄 Extração: ${text.length} caracteres`);

    return {
      text: text.trim(),
      metadata,
    };
  }
}
