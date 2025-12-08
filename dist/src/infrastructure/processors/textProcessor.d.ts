/**
 * Processador para arquivos de texto (TXT, HTML)
 */
import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
import type { ProcessResult } from "./documentProcessor.js";
/**
 * Processador de arquivos de texto (TXT, HTML)
 */
export declare class TextProcessor implements IDocumentProcessor {
  canProcess(extension: string): boolean;
  supportedExtensions(): string[];
  process(filePath: string): Promise<ProcessResult>;
}
//# sourceMappingURL=textProcessor.d.ts.map
