/**
 * Chunker de texto para Node.js
 */
import type { PDFInfo, PDFMetadata } from "./types.js";
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
export declare class TextChunker {
  private chunkSize;
  private chunkOverlap;
  constructor({ chunkSize, chunkOverlap }?: { chunkSize?: number; chunkOverlap?: number });
  countTokens(text: string): number;
  createChunks(text: string, metadata?: ChunkMetadata): Chunk[];
}
//# sourceMappingURL=chunker.d.ts.map
