/**
 * Chunker de texto para Node.js
 */
import type { PDFInfo, PDFMetadata } from "../../shared/types/types.js";
export interface ChunkMetadata {
  source?: string;
  filename?: string;
  extension?: string;
  pages?: number;
  info?: PDFInfo;
  metadata?: PDFMetadata;
  usedOCR?: boolean;
  chunkIndex?: number;
  tokens?: number;
  totalChunks?: number;
}
export interface Chunk {
  text: string;
  metadata: ChunkMetadata;
}
import type { ITextChunker } from "../interfaces/textChunker.interface.js";
export declare class TextChunker implements ITextChunker {
  private chunkSize;
  private chunkOverlap;
  constructor({ chunkSize, chunkOverlap }?: { chunkSize?: number; chunkOverlap?: number });
  countTokens(text: string): number;
  createChunks(text: string, metadata?: ChunkMetadata): Chunk[];
}
//# sourceMappingURL=chunker.d.ts.map
