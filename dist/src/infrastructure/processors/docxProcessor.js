/**
 * Processador específico para arquivos DOCX
 */
import { readFile } from "fs/promises";
import mammoth from "mammoth";
import { logger } from "../../shared/logging/logger.js";
/**
 * Processador de arquivos DOCX
 */
export class DOCXProcessor {
    canProcess(extension) {
        return extension === ".docx";
    }
    supportedExtensions() {
        return [".docx"];
    }
    async process(filePath) {
        const buffer = await readFile(filePath);
        logger.info(`📄 Processando DOCX (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        const metadata = {
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
//# sourceMappingURL=docxProcessor.js.map