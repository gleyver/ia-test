/**
 * Implementação de busca vetorial
 * Separa lógica de busca da persistência
 */
import Heap from "heap-js";
import { cpus } from "os";
import { logger } from "../../shared/logging/logger.js";
import { calculateNorm, cosineSimilarity } from "../../shared/utils/utils.js";
/**
 * Busca vetorial usando cosine similarity
 */
export class VectorSearch {
    async search(queryEmbedding, documents, options = {}) {
        const { topK = 5, filter = null } = options;
        if (documents.length === 0) {
            return [];
        }
        // Pré-computar norm da query uma vez
        const queryNorm = calculateNorm(queryEmbedding);
        // Threshold mínimo de similaridade (ajustável)
        const minSimilarityThreshold = 0.1;
        // Se coleção for pequena, busca sequencial é mais eficiente
        const PARALLEL_THRESHOLD = 1000;
        const BATCH_SIZE = 500;
        if (documents.length <= PARALLEL_THRESHOLD) {
            return this.searchSequential(queryEmbedding, documents, queryNorm, topK, filter, minSimilarityThreshold);
        }
        // Para coleções grandes, usar busca paralela
        return this.searchParallel(queryEmbedding, documents, queryNorm, topK, filter, minSimilarityThreshold, BATCH_SIZE);
    }
    /**
     * Busca sequencial (para coleções pequenas)
     */
    searchSequential(queryEmbedding, documents, queryNorm, topK, filter, minSimilarityThreshold) {
        const heap = new Heap((a, b) => a.similarity - b.similarity);
        for (const doc of documents) {
            if (this.shouldSkipDocument(doc, filter)) {
                continue;
            }
            const similarity = cosineSimilarity(queryEmbedding, doc.embedding, queryNorm, doc.norm);
            if (similarity < minSimilarityThreshold && (heap.length || heap.size?.() || 0) >= topK) {
                continue;
            }
            this.addToHeap(heap, {
                id: doc.id,
                text: doc.text,
                metadata: doc.metadata,
                distance: 1 - similarity,
                similarity: similarity,
            }, topK);
        }
        return this.extractResults(heap);
    }
    /**
     * Busca paralela (para coleções grandes)
     */
    async searchParallel(queryEmbedding, documents, queryNorm, topK, filter, minSimilarityThreshold, batchSize) {
        const numCpus = cpus().length;
        const batches = [];
        // Dividir documentos em batches
        for (let i = 0; i < documents.length; i += batchSize) {
            batches.push(documents.slice(i, i + batchSize));
        }
        logger.debug({ totalBatches: batches.length, batchSize, numCpus }, "Buscando em paralelo");
        const batchResults = [];
        // Processar batches em paralelo (limitado por número de CPUs)
        for (let i = 0; i < batches.length; i += numCpus) {
            const parallelBatches = batches.slice(i, i + numCpus);
            const results = await Promise.all(parallelBatches.map((batch) => Promise.resolve(this.searchBatch(queryEmbedding, batch, queryNorm, topK, filter, minSimilarityThreshold))));
            batchResults.push(...results);
        }
        return this.mergeResults(batchResults, topK);
    }
    /**
     * Busca em um batch de documentos
     */
    searchBatch(queryEmbedding, documents, queryNorm, topK, filter, minSimilarityThreshold) {
        const heap = new Heap((a, b) => a.similarity - b.similarity);
        for (const doc of documents) {
            if (this.shouldSkipDocument(doc, filter)) {
                continue;
            }
            const similarity = cosineSimilarity(queryEmbedding, doc.embedding, queryNorm, doc.norm);
            if (similarity < minSimilarityThreshold && (heap.length || heap.size?.() || 0) >= topK) {
                continue;
            }
            this.addToHeap(heap, {
                id: doc.id,
                text: doc.text,
                metadata: doc.metadata,
                distance: 1 - similarity,
                similarity: similarity,
            }, topK);
        }
        return this.extractResults(heap);
    }
    /**
     * Verifica se documento deve ser pulado (filtro)
     */
    shouldSkipDocument(doc, filter) {
        if (!filter) {
            return false;
        }
        return !Object.entries(filter).every(([key, value]) => {
            const metadataValue = doc.metadata[key];
            return metadataValue === value;
        });
    }
    /**
     * Adiciona resultado ao heap mantendo top K
     */
    addToHeap(heap, result, topK) {
        const heapSize = heap.length || heap.size?.() || 0;
        if (heapSize < topK) {
            heap.push(result);
        }
        else {
            const minSimilarity = heap.peek()?.similarity || 0;
            if (result.similarity > minSimilarity) {
                heap.pop();
                heap.push(result);
            }
        }
    }
    /**
     * Extrai resultados do heap ordenados
     */
    extractResults(heap) {
        const results = [];
        const heapSize = heap.length || heap.size?.() || 0;
        for (let i = 0; i < heapSize; i++) {
            const item = heap.pop();
            if (item) {
                results.push(item);
            }
        }
        return results.reverse(); // Maior similaridade primeiro
    }
    /**
     * Mescla resultados de múltiplos batches mantendo top K
     */
    mergeResults(batchResults, topK) {
        const allResults = [];
        batchResults.forEach((results) => {
            allResults.push(...results);
        });
        // Ordenar por similaridade e pegar top K
        allResults.sort((a, b) => b.similarity - a.similarity);
        return allResults.slice(0, topK);
    }
}
//# sourceMappingURL=vectorSearch.js.map