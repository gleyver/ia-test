/**
 * Processador de documentos para Node.js
 * Orquestra processadores específicos usando Registry Pattern
 * Suporta OCR para PDFs escaneados (gratuito e local)
 */
import { extname } from "path";
import { TesseractOCRService } from "./infrastructure/ocr/tesseractOCRService.js";
import { DOCXProcessor } from "./infrastructure/processors/docxProcessor.js";
import { PDFProcessorWithOCR } from "./infrastructure/processors/pdfProcessorWithOCR.js";
import { ProcessorRegistry } from "./infrastructure/processors/processorRegistry.js";
import { TextProcessor } from "./infrastructure/processors/textProcessor.js";
import { logger } from "./shared/logging/logger.js";
export class DocumentProcessor {
    static registry = null;
    static ocrService = null;
    constructor() {
        // Inicializar registry na primeira vez
        if (!DocumentProcessor.registry) {
            DocumentProcessor.initializeRegistry();
        }
    }
    /**
     * Inicializa registry com todos os processadores
     */
    static initializeRegistry() {
        DocumentProcessor.registry = new ProcessorRegistry();
        DocumentProcessor.ocrService = new TesseractOCRService();
        // Registrar processadores
        DocumentProcessor.registry.register(new TextProcessor());
        DocumentProcessor.registry.register(new DOCXProcessor());
        DocumentProcessor.registry.register(new PDFProcessorWithOCR(DocumentProcessor.ocrService));
        logger.info({ extensions: DocumentProcessor.registry.getAllSupportedExtensions() }, "Processadores de documentos registrados");
    }
    /**
     * Limpa worker OCR global (útil para testes ou shutdown)
     */
    static async cleanupOCRWorker() {
        if (DocumentProcessor.ocrService) {
            await TesseractOCRService.cleanupOCRWorker();
        }
    }
    /**
     * @deprecated Use process() que agora usa registry pattern
     * Mantido para compatibilidade
     */
    async extractTextWithOCR(pdfBuffer) {
        if (!DocumentProcessor.ocrService) {
            DocumentProcessor.initializeRegistry();
        }
        return DocumentProcessor.ocrService.extractText(pdfBuffer);
    }
    canProcess(extension) {
        if (!DocumentProcessor.registry) {
            DocumentProcessor.initializeRegistry();
        }
        return DocumentProcessor.registry.isSupported(extension);
    }
    supportedExtensions() {
        if (!DocumentProcessor.registry) {
            DocumentProcessor.initializeRegistry();
        }
        return DocumentProcessor.registry.getAllSupportedExtensions();
    }
    async process(filePath) {
        if (!DocumentProcessor.registry) {
            DocumentProcessor.initializeRegistry();
        }
        const ext = extname(filePath).toLowerCase();
        const processor = DocumentProcessor.registry.getProcessor(ext);
        logger.info({ extension: ext, processor: processor.constructor.name }, "Processando documento");
        const result = await processor.process(filePath);
        result.text = this.normalizeText(result.text);
        return result;
    }
    normalizeText(text) {
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
//# sourceMappingURL=documentProcessor.js.map