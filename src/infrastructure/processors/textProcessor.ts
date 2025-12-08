/**
 * Processador para arquivos de texto (TXT, HTML)
 */

import { readFile } from "fs/promises";
import { extname } from "path";
import type { ChunkMetadata } from "../../domain/entities/chunker.js";
import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
import { logger } from "../../shared/logging/logger.js";
import type { ProcessResult } from "./documentProcessor.js";

/**
 * Processador de arquivos de texto (TXT, HTML)
 */
export class TextProcessor implements IDocumentProcessor {
  canProcess(extension: string): boolean {
    const ext = extension.toLowerCase();
    return ext === ".txt" || ext === ".html" || ext === ".htm";
  }

  supportedExtensions(): string[] {
    return [".txt", ".html", ".htm"];
  }

  async process(filePath: string): Promise<ProcessResult> {
    const buffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    logger.info(
      `📄 Processando ${ext.toUpperCase()} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`
    );

    const text = buffer.toString("utf-8");

    const metadata: ChunkMetadata = {
      source: filePath,
      filename: filePath.split("/").pop(),
      extension: ext,
    };

    logger.info(`📄 Extração: ${text.length} caracteres`);

    return {
      text: text.trim(),
      metadata,
    };
  }
}
