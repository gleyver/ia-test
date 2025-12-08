/**
 * Interface para processadores de documentos
 * Permite extensão sem modificar código existente (OCP)
 */
import type { ProcessResult } from "../../infrastructure/processors/documentProcessor.js";
/**
 * Interface para processadores de documentos
 */
export interface IDocumentProcessor {
  /**
   * Verifica se o processador pode processar a extensão
   */
  canProcess(extension: string): boolean;
  /**
   * Processa o arquivo e retorna texto e metadados
   */
  process(filePath: string): Promise<ProcessResult>;
  /**
   * Retorna lista de extensões suportadas
   */
  supportedExtensions(): string[];
}
//# sourceMappingURL=documentProcessor.interface.d.ts.map
