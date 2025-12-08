/**
 * Processador PDF com suporte a OCR
 * Estende PDFProcessor básico
 */

import { readFile } from "fs/promises";
import { PDFParse } from "pdf-parse";
import { logger } from "../../shared/logging/logger.js";
import type { IOCRService } from "../ocr/ocrService.interface.js";
import type { ProcessResult } from "./documentProcessor.js";
import { PDFProcessor } from "./pdfProcessor.js";

/**
 * Processador PDF com suporte a OCR
 */
export class PDFProcessorWithOCR extends PDFProcessor {
  constructor(private ocrService: IOCRService) {
    super();
  }

  async process(filePath: string): Promise<ProcessResult> {
    const buffer = await readFile(filePath);
    const result = await super.process(filePath);

    // Verificar se precisa OCR
    const parser = new PDFParse({ data: buffer });
    const info = await parser.getInfo();
    const shouldUseOCR =
      result.text.length < 1000 || (result.text.length < 200 && (info.total || 0) > 0);

    if (shouldUseOCR) {
      logger.warn(
        { textLength: result.text.length, pages: info.total },
        "PDF extraiu pouco texto. Tentando OCR..."
      );

      try {
        const ocrText = await this.ocrService.extractText(buffer);

        if (ocrText && ocrText.length > 0) {
          if (ocrText.length > result.text.length * 1.2) {
            // OCR extraiu significativamente mais
            logger.info(
              { ocrLength: ocrText.length, originalLength: result.text.length },
              "OCR extraiu mais texto - usando OCR como principal"
            );
            result.text = ocrText;
            result.metadata.usedOCR = true;
          } else {
            // Combinar ambos
            logger.info(
              { ocrLength: ocrText.length, originalLength: result.text.length },
              "Combinando texto original com OCR"
            );
            result.text = result.text + "\n\n=== Texto adicional do OCR ===\n" + ocrText;
            result.metadata.usedOCR = true;
          }
        } else {
          logger.warn("OCR não retornou texto. Mantendo texto original.");
          result.metadata.usedOCR = false;
        }
      } catch (ocrError: unknown) {
        const errorMessage = ocrError instanceof Error ? ocrError.message : String(ocrError);
        logger.warn({ error: errorMessage }, "Erro ao tentar OCR");
        result.metadata.usedOCR = false;
      }
    } else {
      result.metadata.usedOCR = false;
    }

    // Adicionar metadados do PDF se disponíveis
    if (info.info && typeof info.info === "object") {
      const infoParts: string[] = [];
      Object.entries(info.info).forEach(([key, value]) => {
        if (value && typeof value === "string" && value.length > 0) {
          infoParts.push(`${key}: ${value}`);
        }
      });
      if (infoParts.length > 0) {
        result.text += "\n\n=== Metadados do PDF ===\n" + infoParts.join("\n");
      }
    }

    await parser.destroy();

    logger.info(
      {
        textLength: result.text.length,
        pages: info.total,
        usedOCR: result.metadata.usedOCR || false,
      },
      "PDF processado"
    );

    return result;
  }
}
