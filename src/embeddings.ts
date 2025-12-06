/**
 * Gerador de embeddings usando @xenova/transformers
 */

import { pipeline } from "@xenova/transformers";
import type { Chunk } from "./chunker.js";
import type { TransformersOutput, TransformersPipeline } from "./types.js";

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}

export class EmbeddingGenerator {
  private model: string;
  private pipeline: TransformersPipeline | null;

  constructor({ model = "Xenova/all-MiniLM-L6-v2" }: { model?: string } = {}) {
    this.model = model;
    this.pipeline = null;
  }

  async initialize(): Promise<TransformersPipeline> {
    if (!this.pipeline) {
      console.log(`🔄 Carregando modelo de embeddings: ${this.model}...`);
      this.pipeline = (await pipeline(
        "feature-extraction",
        this.model
      )) as unknown as TransformersPipeline;
      console.log("✅ Modelo carregado!");
    }
    return this.pipeline;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const pipe = await this.initialize();
    const output = (await pipe(text, { pooling: "mean", normalize: true })) as TransformersOutput;
    return Array.from(output.data);
  }

  async generateEmbeddings(chunks: Chunk[]): Promise<ChunkWithEmbedding[]> {
    const pipe = await this.initialize();
    const texts = chunks.map((c) => c.text);

    // Processar em lote
    const outputs = (await pipe(texts, {
      pooling: "mean",
      normalize: true,
    })) as TransformersOutput[];

    // Adicionar embeddings aos chunks
    const result: ChunkWithEmbedding[] = chunks.map((chunk, i) => {
      const embedding = Array.from(outputs[i].data);
      console.log(
        `  📦 Chunk ${i + 1}: ${chunk.text.substring(0, 50)}... → embedding ${embedding.length}D`
      );
      return {
        ...chunk,
        embedding: embedding,
      };
    });

    return result;
  }
}
