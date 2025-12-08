/**
 * Implementação de busca vetorial
 * Separa lógica de busca da persistência
 */

import Heap from "heap-js";
import { cpus } from "os";
import type { IVectorSearch } from "../../domain/interfaces/vectorSearch.interface.js";
import { logger } from "../../shared/logging/logger.js";
import type { DocumentFilter } from "../../shared/types/types.js";
import { calculateNorm, cosineSimilarity } from "../../shared/utils/utils.js";
import type { Document, SearchOptions, SearchResult } from "../storage/vectorDb.js";

/**
 * Busca vetorial usando cosine similarity
 */
export class VectorSearch implements IVectorSearch {
  async search(
    queryEmbedding: number[],
    documents: Document[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
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
      return this.searchSequential(
        queryEmbedding,
        documents,
        queryNorm,
        topK,
        filter,
        minSimilarityThreshold
      );
    }

    // Para coleções grandes, usar busca paralela
    return this.searchParallel(
      queryEmbedding,
      documents,
      queryNorm,
      topK,
      filter,
      minSimilarityThreshold,
      BATCH_SIZE
    );
  }

  /**
   * Busca sequencial (para coleções pequenas)
   */
  private searchSequential(
    queryEmbedding: number[],
    documents: Document[],
    queryNorm: number,
    topK: number,
    filter: DocumentFilter | null,
    minSimilarityThreshold: number
  ): SearchResult[] {
    const heap = new Heap<SearchResult>(
      (a: SearchResult, b: SearchResult) => a.similarity - b.similarity
    );

    for (const doc of documents) {
      if (this.shouldSkipDocument(doc, filter)) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, doc.embedding, queryNorm, doc.norm);

      if (similarity < minSimilarityThreshold && (heap.length || heap.size?.() || 0) >= topK) {
        continue;
      }

      this.addToHeap(
        heap,
        {
          id: doc.id,
          text: doc.text,
          metadata: doc.metadata,
          distance: 1 - similarity,
          similarity: similarity,
        },
        topK
      );
    }

    return this.extractResults(heap);
  }

  /**
   * Busca paralela (para coleções grandes)
   */
  private async searchParallel(
    queryEmbedding: number[],
    documents: Document[],
    queryNorm: number,
    topK: number,
    filter: DocumentFilter | null,
    minSimilarityThreshold: number,
    batchSize: number
  ): Promise<SearchResult[]> {
    const numCpus = cpus().length;
    const batches: Document[][] = [];

    // Dividir documentos em batches
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }

    logger.debug({ totalBatches: batches.length, batchSize, numCpus }, "Buscando em paralelo");

    const batchResults: SearchResult[][] = [];

    // Processar batches em paralelo (limitado por número de CPUs)
    for (let i = 0; i < batches.length; i += numCpus) {
      const parallelBatches = batches.slice(i, i + numCpus);
      const results = await Promise.all(
        parallelBatches.map((batch) =>
          Promise.resolve(
            this.searchBatch(queryEmbedding, batch, queryNorm, topK, filter, minSimilarityThreshold)
          )
        )
      );
      batchResults.push(...results);
    }

    return this.mergeResults(batchResults, topK);
  }

  /**
   * Busca em um batch de documentos
   */
  private searchBatch(
    queryEmbedding: number[],
    documents: Document[],
    queryNorm: number,
    topK: number,
    filter: DocumentFilter | null,
    minSimilarityThreshold: number
  ): SearchResult[] {
    const heap = new Heap<SearchResult>(
      (a: SearchResult, b: SearchResult) => a.similarity - b.similarity
    );

    for (const doc of documents) {
      if (this.shouldSkipDocument(doc, filter)) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, doc.embedding, queryNorm, doc.norm);

      if (similarity < minSimilarityThreshold && (heap.length || heap.size?.() || 0) >= topK) {
        continue;
      }

      this.addToHeap(
        heap,
        {
          id: doc.id,
          text: doc.text,
          metadata: doc.metadata,
          distance: 1 - similarity,
          similarity: similarity,
        },
        topK
      );
    }

    return this.extractResults(heap);
  }

  /**
   * Verifica se documento deve ser pulado (filtro)
   */
  private shouldSkipDocument(doc: Document, filter: DocumentFilter | null): boolean {
    if (!filter) {
      return false;
    }

    return !Object.entries(filter).every(([key, value]) => {
      const metadataValue = (doc.metadata as Record<string, unknown>)[key];
      return metadataValue === value;
    });
  }

  /**
   * Adiciona resultado ao heap mantendo top K
   */
  private addToHeap(heap: Heap<SearchResult>, result: SearchResult, topK: number): void {
    const heapSize = heap.length || heap.size?.() || 0;

    if (heapSize < topK) {
      heap.push(result);
    } else {
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
  private extractResults(heap: Heap<SearchResult>): SearchResult[] {
    const results: SearchResult[] = [];
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
  private mergeResults(batchResults: SearchResult[][], topK: number): SearchResult[] {
    const allResults: SearchResult[] = [];
    batchResults.forEach((results) => {
      allResults.push(...results);
    });

    // Ordenar por similaridade e pegar top K
    allResults.sort((a, b) => b.similarity - a.similarity);
    return allResults.slice(0, topK);
  }
}
