/**
 * Processador específico para arquivos PDF
 */

import { readFile } from "fs/promises";
import { PDFParse } from "pdf-parse";
import type { ChunkMetadata } from "../../domain/entities/chunker.js";
import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
import { logger } from "../../shared/logging/logger.js";
import type { PDFInfo, PDFMetadata } from "../../shared/types/types.js";
import type { ProcessResult } from "./documentProcessor.js";

/**
 * Processador de arquivos PDF
 */
export class PDFProcessor implements IDocumentProcessor {
  canProcess(extension: string): boolean {
    return extension === ".pdf";
  }

  supportedExtensions(): string[] {
    return [".pdf"];
  }

  async process(filePath: string): Promise<ProcessResult> {
    const buffer = await readFile(filePath);
    logger.info(`📄 Processando PDF (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);

    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const info = await parser.getInfo();

    const text = textResult.text || "";
    const metadata: ChunkMetadata = {
      source: filePath,
      filename: filePath.split("/").pop(),
      extension: ".pdf",
      pages: info.total,
    };

    // Converter info.info para PDFInfo
    if (info.info && typeof info.info === "object") {
      const infoObj: Record<string, string | number | boolean | undefined> = {};
      Object.entries(info.info).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          infoObj[key] = value;
        }
      });
      metadata.info = infoObj as PDFInfo;
    }

    // Converter metadata para PDFMetadata
    if (info.metadata && typeof info.metadata === "object") {
      const metaObj: Record<string, string | number | boolean | PDFInfo | undefined> = {};
      const metadataObj = info.metadata as unknown as Record<string, unknown>;
      Object.entries(metadataObj).forEach(([key, value]) => {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          (value && typeof value === "object")
        ) {
          metaObj[key] = value as string | number | boolean | PDFInfo | undefined;
        }
      });
      metadata.metadata = metaObj as PDFMetadata;
    }

    logger.info(`📄 Extração inicial: ${text.length} caracteres de ${info.total} páginas`);

    // Se texto extraído for muito curto, pode ser PDF escaneado (precisa OCR)
    // Mas isso será tratado pelo DocumentProcessor orquestrador
    return {
      text: text.trim(),
      metadata,
    };
  }
}
