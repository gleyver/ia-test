/**
 * Registry de processadores de documentos
 * Implementa Strategy Pattern + Registry Pattern
 * Permite adicionar novos processadores sem modificar código existente (OCP)
 */

import type { IDocumentProcessor } from "../../domain/interfaces/documentProcessor.interface.js";
import { ProcessingError } from "../../shared/errors/errors.js";
import { logger } from "../../shared/logging/logger.js";

/**
 * Registry de processadores de documentos
 */
export class ProcessorRegistry {
  private processors: IDocumentProcessor[] = [];

  /**
   * Registra um processador
   */
  register(processor: IDocumentProcessor): void {
    this.processors.push(processor);
    logger.debug(
      { extensions: processor.supportedExtensions() },
      `Processador registrado: ${processor.constructor.name}`
    );
  }

  /**
   * Obtém processador para uma extensão
   */
  getProcessor(extension: string): IDocumentProcessor {
    const processor = this.processors.find((p) => p.canProcess(extension));

    if (!processor) {
      throw new ProcessingError(`Nenhum processador encontrado para extensão: ${extension}`, {
        supportedExtensions: this.getAllSupportedExtensions(),
      });
    }

    return processor;
  }

  /**
   * Retorna todas as extensões suportadas
   */
  getAllSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    this.processors.forEach((processor) => {
      processor.supportedExtensions().forEach((ext) => extensions.add(ext));
    });
    return Array.from(extensions);
  }

  /**
   * Verifica se uma extensão é suportada
   */
  isSupported(extension: string): boolean {
    return this.processors.some((p) => p.canProcess(extension));
  }
}
