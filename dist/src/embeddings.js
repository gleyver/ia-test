/**
 * Gerador de embeddings usando @xenova/transformers
 */
import { pipeline } from "@xenova/transformers";
export class EmbeddingGenerator {
    model;
    pipeline;
    constructor({ model = "Xenova/all-MiniLM-L6-v2" } = {}) {
        this.model = model;
        this.pipeline = null;
    }
    async initialize() {
        if (!this.pipeline) {
            console.log(`🔄 Carregando modelo de embeddings: ${this.model}...`);
            this.pipeline = (await pipeline("feature-extraction", this.model));
            console.log("✅ Modelo carregado!");
        }
        return this.pipeline;
    }
    async generateEmbedding(text) {
        const pipe = await this.initialize();
        const output = (await pipe(text, { pooling: "mean", normalize: true }));
        return Array.from(output.data);
    }
    async generateEmbeddings(chunks) {
        const pipe = await this.initialize();
        const texts = chunks.map((c) => c.text);
        // Processar em lote
        const outputs = (await pipe(texts, {
            pooling: "mean",
            normalize: true,
        }));
        // Adicionar embeddings aos chunks
        const result = chunks.map((chunk, i) => {
            const embedding = Array.from(outputs[i].data);
            console.log(`  📦 Chunk ${i + 1}: ${chunk.text.substring(0, 50)}... → embedding ${embedding.length}D`);
            return {
                ...chunk,
                embedding: embedding,
            };
        });
        return result;
    }
}
//# sourceMappingURL=embeddings.js.map