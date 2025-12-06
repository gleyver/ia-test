/**
 * Processador de documentos para Node.js
 * Suporta OCR para PDFs escaneados (gratuito e local)
 */
import { Worker } from "tesseract.js";
import type { ChunkMetadata } from "./chunker.js";
export interface ProcessResult {
  text: string;
  metadata: ChunkMetadata;
}
export declare class DocumentProcessor {
  private ocrWorker;
  constructor();
  getOCRWorker(): Promise<Worker>;
  extractTextWithOCR(pdfBuffer: Buffer): Promise<string>;
  process(filePath: string): Promise<ProcessResult>;
  normalizeText(text: string): string;
}
//# sourceMappingURL=documentProcessor.d.ts.map
