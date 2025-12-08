/**
 * Registry de processadores de documentos
 * Implementa Strategy Pattern + Registry Pattern
 * Permite adicionar novos processadores sem modificar código existente (OCP)
 */
import { ProcessingError } from "../../shared/errors/errors.js";
import { logger } from "../../shared/logging/logger.js";
/**
 * Registry de processadores de documentos
 */
export class ProcessorRegistry {
    processors = [];
    /**
     * Registra um processador
     */
    register(processor) {
        this.processors.push(processor);
        logger.debug({ extensions: processor.supportedExtensions() }, `Processador registrado: ${processor.constructor.name}`);
    }
    /**
     * Obtém processador para uma extensão
     */
    getProcessor(extension) {
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
    getAllSupportedExtensions() {
        const extensions = new Set();
        this.processors.forEach((processor) => {
            processor.supportedExtensions().forEach((ext) => extensions.add(ext));
        });
        return Array.from(extensions);
    }
    /**
     * Verifica se uma extensão é suportada
     */
    isSupported(extension) {
        return this.processors.some((p) => p.canProcess(extension));
    }
}
//# sourceMappingURL=processorRegistry.js.map