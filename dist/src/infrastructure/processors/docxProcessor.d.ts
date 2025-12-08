/**
 * Processador específico para arquivos DOCX
 */
import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
import type { ProcessResult } from "./documentProcessor.js";
/**
 * Processador de arquivos DOCX
 */
export declare class DOCXProcessor implements IDocumentProcessor {
  canProcess(extension: string): boolean;
  supportedExtensions(): string[];
  process(filePath: string): Promise<ProcessResult>;
}
//# sourceMappingURL=docxProcessor.d.ts.map
