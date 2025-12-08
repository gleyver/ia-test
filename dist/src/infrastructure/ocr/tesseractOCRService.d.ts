/**
 * Serviço de OCR usando Tesseract.js
 * Implementa IOCRService
 */
import type { IOCRService } from "./ocrService.interface.js";
/**
 * Serviço de OCR usando Tesseract.js
 * Gerencia worker global e processamento paralelo
 */
export declare class TesseractOCRService implements IOCRService {
  private static globalOCRWorker;
  private static workerInitializationPromise;
  /**
   * Obtém worker OCR global (singleton)
   */
  private getOCRWorker;
  /**
   * Limpa worker OCR global
   */
  static cleanupOCRWorker(): Promise<void>;
  /**
   * Verifica se PDF precisa de OCR
   */
  needsOCR(pdfBuffer: Buffer, extractedText: string): Promise<boolean>;
  /**
   * Extrai texto de PDF escaneado usando OCR
   */
  extractText(pdfBuffer: Buffer): Promise<string>;
  /**
   * Processa PDF usando pdf2pic (mais rápido)
   */
  private processWithPdf2Pic;
  /**
   * Processa página usando pdf2pic
   */
  private processPageWithPdf2Pic;
  /**
   * Processa PDF usando pdfjs-dist (fallback)
   */
  private processWithPdfJs;
  /**
   * Processa página usando pdfjs-dist
   */
  private processPageWithPdfJs;
  /**
   * Cria batch de páginas para processamento paralelo
   */
  private createPageBatch;
  /**
   * Limpa arquivo temporário
   */
  private cleanupTempFile;
}
//# sourceMappingURL=tesseractOCRService.d.ts.map
