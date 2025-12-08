/**
 * Registry de processadores de documentos
 * Implementa Strategy Pattern + Registry Pattern
 * Permite adicionar novos processadores sem modificar código existente (OCP)
 */
import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
/**
 * Registry de processadores de documentos
 */
export declare class ProcessorRegistry {
  private processors;
  /**
   * Registra um processador
   */
  register(processor: IDocumentProcessor): void;
  /**
   * Obtém processador para uma extensão
   */
  getProcessor(extension: string): IDocumentProcessor;
  /**
   * Retorna todas as extensões suportadas
   */
  getAllSupportedExtensions(): string[];
  /**
   * Verifica se uma extensão é suportada
   */
  isSupported(extension: string): boolean;
}
//# sourceMappingURL=processorRegistry.d.ts.map
