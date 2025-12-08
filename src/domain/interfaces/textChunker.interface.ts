/**
 * Interface para chunkers de texto
 */

import type { Chunk, ChunkMetadata } from "../../domain/entities/chunker.js";

/**
 * Interface para chunkers de texto
 */
export interface ITextChunker {
  /**
   * Divide texto em chunks
   */
  createChunks(text: string, metadata?: ChunkMetadata): Chunk[];

  /**
   * Conta tokens em um texto
   */
  countTokens(text: string): number;
}
