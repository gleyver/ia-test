/**
 * Processador específico para arquivos PDF
 */
import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
import type { ProcessResult } from "./documentProcessor.js";
/**
 * Processador de arquivos PDF
 */
export declare class PDFProcessor implements IDocumentProcessor {
  canProcess(extension: string): boolean;
  supportedExtensions(): string[];
  process(filePath: string): Promise<ProcessResult>;
}
//# sourceMappingURL=pdfProcessor.d.ts.map
