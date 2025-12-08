/**
 * Processador específico para arquivos PDF
 */
import { readFile } from "fs/promises";
import { PDFParse } from "pdf-parse";
import { logger } from "../../shared/logging/logger.js";
/**
 * Processador de arquivos PDF
 */
export class PDFProcessor {
    canProcess(extension) {
        return extension === ".pdf";
    }
    supportedExtensions() {
        return [".pdf"];
    }
    async process(filePath) {
        const buffer = await readFile(filePath);
        logger.info(`📄 Processando PDF (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        const info = await parser.getInfo();
        const text = textResult.text || "";
        const metadata = {
            source: filePath,
            filename: filePath.split("/").pop(),
            extension: ".pdf",
            pages: info.total,
        };
        // Converter info.info para PDFInfo
        if (info.info && typeof info.info === "object") {
            const infoObj = {};
            Object.entries(info.info).forEach(([key, value]) => {
                if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                    infoObj[key] = value;
                }
            });
            metadata.info = infoObj;
        }
        // Converter metadata para PDFMetadata
        if (info.metadata && typeof info.metadata === "object") {
            const metaObj = {};
            const metadataObj = info.metadata;
            Object.entries(metadataObj).forEach(([key, value]) => {
                if (typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean" ||
                    (value && typeof value === "object")) {
                    metaObj[key] = value;
                }
            });
            metadata.metadata = metaObj;
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
//# sourceMappingURL=pdfProcessor.js.map