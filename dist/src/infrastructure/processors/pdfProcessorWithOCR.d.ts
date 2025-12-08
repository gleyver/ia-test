/**
 * Processador PDF com suporte a OCR
 * Estende PDFProcessor básico
 */
import type { IOCRService } from "../ocr/ocrService.interface.js";
import type { ProcessResult } from "./documentProcessor.js";
import { PDFProcessor } from "./pdfProcessor.js";
/**
 * Processador PDF com suporte a OCR
 */
export declare class PDFProcessorWithOCR extends PDFProcessor {
  private ocrService;
  constructor(ocrService: IOCRService);
  process(filePath: string): Promise<ProcessResult>;
}
//# sourceMappingURL=pdfProcessorWithOCR.d.ts.map
