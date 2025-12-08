/**
 * Processador para arquivos de texto (TXT, HTML)
 */
import { readFile } from "fs/promises";
import { extname } from "path";
import { logger } from "../../shared/logging/logger.js";
/**
 * Processador de arquivos de texto (TXT, HTML)
 */
export class TextProcessor {
    canProcess(extension) {
        const ext = extension.toLowerCase();
        return ext === ".txt" || ext === ".html" || ext === ".htm";
    }
    supportedExtensions() {
        return [".txt", ".html", ".htm"];
    }
    async process(filePath) {
        const buffer = await readFile(filePath);
        const ext = extname(filePath).toLowerCase();
        logger.info(`📄 Processando ${ext.toUpperCase()} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);
        const text = buffer.toString("utf-8");
        const metadata = {
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
//# sourceMappingURL=textProcessor.js.map