/**
 * Gerador de embeddings usando @xenova/transformers
 */
import type { Chunk } from "./chunker.js";
import type { TransformersPipeline } from "./types.js";
export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}
export declare class EmbeddingGenerator {
  private model;
  private pipeline;
  constructor({ model }?: { model?: string });
  initialize(): Promise<TransformersPipeline>;
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(chunks: Chunk[]): Promise<ChunkWithEmbedding[]>;
}
//# sourceMappingURL=embeddings.d.ts.map
