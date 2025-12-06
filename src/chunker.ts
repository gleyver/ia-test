/**
 * Chunker de texto para Node.js
 */

import type { PDFInfo, PDFMetadata } from "./types.js";

// ChunkMetadata com tipos específicos
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

export class TextChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor({
    chunkSize = 1000,
    chunkOverlap = 200,
  }: { chunkSize?: number; chunkOverlap?: number } = {}) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  // Aproximação: 1 token ≈ 4 caracteres
  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  createChunks(text: string, metadata: ChunkMetadata = {}): Chunk[] {
    if (!text.trim()) return [];

    const chunks: Chunk[] = [];
    const textLength = text.length;
    let start = 0;

    while (start < textLength) {
      const end = start + this.chunkSize * 4;

      if (end >= textLength) {
        const chunk = text.slice(start).trim();
        if (chunk) {
          chunks.push({
            text: chunk,
            metadata: {
              ...metadata,
              chunkIndex: chunks.length,
              tokens: this.countTokens(chunk),
            },
          });
        }
        break;
      }

      // Ajustar fim para não cortar palavras
      const adjustPositions = [
        text.lastIndexOf("\n\n", end),
        text.lastIndexOf("\n", end),
        text.lastIndexOf(". ", end),
        text.lastIndexOf(" ", end),
      ];

      const bestPos = Math.max(...adjustPositions.filter((pos) => pos > start), end);
      const chunk = text.slice(start, bestPos).trim();

      if (chunk) {
        chunks.push({
          text: chunk,
          metadata: {
            ...metadata,
            chunkIndex: chunks.length,
            tokens: this.countTokens(chunk),
          },
        });
      }

      // Mover start considerando overlap
      const overlapStart = bestPos - this.chunkOverlap * 4;
      start = overlapStart > start ? overlapStart : bestPos;
    }

    // Adicionar total_chunks
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }
}
