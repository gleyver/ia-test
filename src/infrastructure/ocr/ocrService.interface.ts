/**
 * Interface para serviços de OCR
 */

/**
 * Interface para serviços de OCR
 */
export interface IOCRService {
  /**
   * Extrai texto de um PDF escaneado usando OCR
   */
  extractText(pdfBuffer: Buffer): Promise<string>;

  /**
   * Verifica se um PDF precisa de OCR
   */
  needsOCR(pdfBuffer: Buffer, extractedText: string): Promise<boolean>;
}
