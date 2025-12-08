/**
 * Processador de documentos para Node.js
 * Orquestra processadores específicos usando Registry Pattern
 * Suporta OCR para PDFs escaneados (gratuito e local)
 */

import { extname } from "path";
import type { ChunkMetadata } from "./domain/entities/chunker.js";
import { TesseractOCRService } from "./infrastructure/ocr/tesseractOCRService.js";
import { DOCXProcessor } from "./infrastructure/processors/docxProcessor.js";
import { PDFProcessorWithOCR } from "./infrastructure/processors/pdfProcessorWithOCR.js";
import { ProcessorRegistry } from "./infrastructure/processors/processorRegistry.js";
import { TextProcessor } from "./infrastructure/processors/textProcessor.js";
import { logger } from "./shared/logging/logger.js";

export interface ProcessResult {
  text: string;
  metadata: ChunkMetadata;
}

import type { IDocumentProcessor } from "./domain/interfaces/documentProcessor.interface.js";

export class DocumentProcessor implements IDocumentProcessor {
  private static registry: ProcessorRegistry | null = null;
  private static ocrService: TesseractOCRService | null = null;

  constructor() {
    // Inicializar registry na primeira vez
    if (!DocumentProcessor.registry) {
      DocumentProcessor.initializeRegistry();
    }
  }

  /**
   * Inicializa registry com todos os processadores
   */
  private static initializeRegistry(): void {
    DocumentProcessor.registry = new ProcessorRegistry();
    DocumentProcessor.ocrService = new TesseractOCRService();

    // Registrar processadores
    DocumentProcessor.registry.register(new TextProcessor());
    DocumentProcessor.registry.register(new DOCXProcessor());
    DocumentProcessor.registry.register(new PDFProcessorWithOCR(DocumentProcessor.ocrService));

    logger.info(
      { extensions: DocumentProcessor.registry.getAllSupportedExtensions() },
      "Processadores de documentos registrados"
    );
  }

  /**
   * Limpa worker OCR global (útil para testes ou shutdown)
   */
  static async cleanupOCRWorker(): Promise<void> {
    if (DocumentProcessor.ocrService) {
      await TesseractOCRService.cleanupOCRWorker();
    }
  }

  /**
   * @deprecated Use process() que agora usa registry pattern
   * Mantido para compatibilidade
   */
  async extractTextWithOCR(pdfBuffer: Buffer): Promise<string> {
    if (!DocumentProcessor.ocrService) {
      DocumentProcessor.initializeRegistry();
    }
    return DocumentProcessor.ocrService!.extractText(pdfBuffer);
  }

  canProcess(extension: string): boolean {
    if (!DocumentProcessor.registry) {
      DocumentProcessor.initializeRegistry();
    }
    return DocumentProcessor.registry!.isSupported(extension);
  }

  supportedExtensions(): string[] {
    if (!DocumentProcessor.registry) {
      DocumentProcessor.initializeRegistry();
    }
    return DocumentProcessor.registry!.getAllSupportedExtensions();
  }

  async process(filePath: string): Promise<ProcessResult> {
    if (!DocumentProcessor.registry) {
      DocumentProcessor.initializeRegistry();
    }

    const ext = extname(filePath).toLowerCase();
    const processor = DocumentProcessor.registry!.getProcessor(ext);

    logger.info({ extension: ext, processor: processor.constructor.name }, "Processando documento");

    const result = await processor.process(filePath);
    result.text = this.normalizeText(result.text);

    return result;
  }

  normalizeText(text: string): string {
    // Remover caracteres de controle
    text = text.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g, "");
    // Normalizar quebras de linha
    text = text.replace(/\r\n|\r/g, "\n");
    // Normalizar espaços múltiplos
    text = text.replace(/[ \t]+/g, " ");
    // Remover linhas vazias múltiplas
    text = text.replace(/\n{3,}/g, "\n\n");
    return text.trim();
  }
}
