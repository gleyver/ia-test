/**
 * Processador de documentos para Node.js
 * Orquestra processadores específicos usando Registry Pattern
 * Suporta OCR para PDFs escaneados (gratuito e local)
 */
import type { ChunkMetadata } from "./domain/entities/chunker.js";
export interface ProcessResult {
  text: string;
  metadata: ChunkMetadata;
}
import type { IDocumentProcessor } from "./domain/interfaces/documentProcessor.interface.js";
export declare class DocumentProcessor implements IDocumentProcessor {
  private static registry;
  private static ocrService;
  constructor();
  /**
   * Inicializa registry com todos os processadores
   */
  private static initializeRegistry;
  /**
   * Limpa worker OCR global (útil para testes ou shutdown)
   */
  static cleanupOCRWorker(): Promise<void>;
  /**
   * @deprecated Use process() que agora usa registry pattern
   * Mantido para compatibilidade
   */
  extractTextWithOCR(pdfBuffer: Buffer): Promise<string>;
  canProcess(extension: string): boolean;
  supportedExtensions(): string[];
  process(filePath: string): Promise<ProcessResult>;
  normalizeText(text: string): string;
}
//# sourceMappingURL=documentProcessor.d.ts.map
