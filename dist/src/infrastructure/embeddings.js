/**
 * Gerador de embeddings usando @xenova/transformers
 * Implementa Singleton Pattern + Cache para reduzir uso de memória e melhorar performance
 */
import { pipeline } from "@xenova/transformers";
import { createHash } from "crypto";
import { getDistributedEmbeddingCache } from "../cache/distributed.js";
import { embeddingCacheHits, embeddingCacheMisses, embeddingGenerationDuration, embeddingsGenerated, } from "../metrics/index.js";
import { logger } from "../shared/logging/logger.js";
export class EmbeddingGenerator {
    static instance = null;
    static sharedPipeline = null;
    static sharedModel = null;
    model;
    cache;
    maxCacheSize;
    hits = 0;
    misses = 0;
    distributedCache = getDistributedEmbeddingCache();
    constructor({ model = "Xenova/all-MiniLM-L6-v2" } = {}) {
        this.model = model;
        this.cache = new Map();
        this.maxCacheSize = 50000; // Aumentado para 50k embeddings (melhor performance)
    }
    /**
     * Singleton: retorna instância única do EmbeddingGenerator
     * Garante que apenas uma instância do modelo seja carregada em memória
     */
    static getInstance({ model = "Xenova/all-MiniLM-L6-v2" } = {}) {
        if (!EmbeddingGenerator.instance) {
            EmbeddingGenerator.instance = new EmbeddingGenerator({ model });
            logger.info("EmbeddingGenerator singleton criado");
        }
        return EmbeddingGenerator.instance;
    }
    async initialize() {
        // Se o modelo mudou, recarregar pipeline
        if (!EmbeddingGenerator.sharedPipeline ||
            EmbeddingGenerator.sharedModel !== this.model) {
            logger.info({ model: this.model }, "Carregando modelo de embeddings");
            EmbeddingGenerator.sharedPipeline = (await pipeline("feature-extraction", this.model));
            EmbeddingGenerator.sharedModel = this.model;
            logger.info("Modelo carregado (compartilhado entre todas as instâncias)");
        }
        return EmbeddingGenerator.sharedPipeline;
    }
    /**
     * Gera hash SHA256 do texto para usar como chave de cache
     * Usa apenas primeiros 16 caracteres para economizar memória
     */
    getCacheKey(text) {
        return createHash("sha256").update(text).digest("hex").substring(0, 16);
    }
    /**
     * Limpa cache quando atinge tamanho máximo (LRU real)
     * Remove 20% dos itens menos usados recentemente
     */
    evictCacheIfNeeded() {
        if (this.cache.size >= this.maxCacheSize) {
            // Ordenar por lastUsed e remover 20% mais antigos
            const entries = Array.from(this.cache.entries())
                .sort((a, b) => a[1].lastUsed - b[1].lastUsed)
                .slice(0, Math.floor(this.maxCacheSize * 0.2));
            entries.forEach(([key]) => this.cache.delete(key));
            logger.debug({
                removed: entries.length,
                remaining: this.cache.size,
                maxSize: this.maxCacheSize,
            }, "Cache LRU eviction executado");
        }
    }
    async generateEmbedding(text) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey(text);
        const now = Date.now();
        // Verificar cache distribuído primeiro (se disponível)
        const distributedCached = await this.distributedCache.get(text);
        if (distributedCached) {
            this.hits++;
            embeddingCacheHits.inc();
            const duration = (Date.now() - startTime) / 1000;
            embeddingGenerationDuration.observe(duration);
            logger.debug({ cacheKey: cacheKey.substring(0, 8) }, "Cache hit distribuído para embedding");
            return distributedCached;
        }
        // Verificar cache local
        const cached = this.cache.get(cacheKey);
        if (cached) {
            // Atualizar lastUsed para LRU
            cached.lastUsed = now;
            this.hits++;
            embeddingCacheHits.inc();
            const duration = (Date.now() - startTime) / 1000;
            embeddingGenerationDuration.observe(duration);
            logger.debug({ cacheKey: cacheKey.substring(0, 8) }, "Cache hit local para embedding");
            return cached.embedding;
        }
        // Gerar embedding
        this.misses++;
        embeddingCacheMisses.inc();
        const pipe = await this.initialize();
        const output = (await pipe(text, { pooling: "mean", normalize: true }));
        const embedding = Array.from(output.data);
        embeddingsGenerated.inc();
        // Cachear resultado (distribuído e local)
        await this.distributedCache.set(text, embedding);
        this.evictCacheIfNeeded();
        this.cache.set(cacheKey, {
            embedding,
            lastUsed: now,
        });
        const duration = (Date.now() - startTime) / 1000;
        embeddingGenerationDuration.observe(duration);
        logger.debug({ cacheKey: cacheKey.substring(0, 8) }, "Embedding gerado e cacheado");
        return embedding;
    }
    async generateEmbeddings(chunks) {
        const pipe = await this.initialize();
        // Verificar cache para cada chunk
        const textsToProcess = [];
        const cachedEmbeddings = new Map();
        const now = Date.now();
        // Verificar cache distribuído primeiro
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const cacheKey = this.getCacheKey(chunk.text);
            // Tentar cache distribuído
            const distributedCached = await this.distributedCache.get(chunk.text);
            if (distributedCached) {
                cachedEmbeddings.set(i, distributedCached);
                this.hits++;
                embeddingCacheHits.inc();
                continue;
            }
            // Tentar cache local
            const cached = this.cache.get(cacheKey);
            if (cached) {
                cached.lastUsed = now;
                cachedEmbeddings.set(i, cached.embedding);
                this.hits++;
                embeddingCacheHits.inc();
                logger.debug({ chunkIndex: i + 1 }, "Cache hit local para chunk");
            }
            else {
                this.misses++;
                embeddingCacheMisses.inc();
                textsToProcess.push({ text: chunk.text, index: i });
            }
        }
        // Processar em batches para evitar OOM (100 chunks por batch)
        const BATCH_SIZE = 100;
        if (textsToProcess.length > 0) {
            for (let i = 0; i < textsToProcess.length; i += BATCH_SIZE) {
                const batch = textsToProcess.slice(i, i + BATCH_SIZE);
                const textsToProcessArray = batch.map((t) => t.text);
                logger.debug({
                    batch: Math.floor(i / BATCH_SIZE) + 1,
                    totalBatches: Math.ceil(textsToProcess.length / BATCH_SIZE),
                    batchSize: batch.length,
                }, "Processando batch de embeddings");
                const outputs = (await pipe(textsToProcessArray, {
                    pooling: "mean",
                    normalize: true,
                }));
                // Garantir que outputs é um array
                const outputsArray = Array.isArray(outputs) ? outputs : [outputs];
                // Cachear novos embeddings (distribuído e local)
                const batchNow = Date.now();
                for (let idx = 0; idx < batch.length; idx++) {
                    const item = batch[idx];
                    const embedding = Array.from(outputsArray[idx].data);
                    const cacheKey = this.getCacheKey(item.text);
                    // Cachear distribuído
                    await this.distributedCache.set(item.text, embedding);
                    // Cachear local
                    this.evictCacheIfNeeded();
                    this.cache.set(cacheKey, {
                        embedding,
                        lastUsed: batchNow,
                    });
                    cachedEmbeddings.set(item.index, embedding);
                }
                embeddingsGenerated.inc(batch.length);
            }
        }
        // Adicionar embeddings aos chunks (usando cache ou recém-gerados)
        const result = chunks.map((chunk, i) => {
            const embedding = cachedEmbeddings.get(i);
            return {
                ...chunk,
                embedding: embedding,
            };
        });
        const cachedCount = cachedEmbeddings.size - textsToProcess.length;
        logger.info({
            cached: cachedCount,
            generated: textsToProcess.length,
            batches: Math.ceil(textsToProcess.length / BATCH_SIZE),
        }, "Embeddings processados");
        return result;
    }
    /**
     * Limpa cache manualmente (útil para testes ou quando necessário)
     */
    clearCache() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        logger.info("Cache de embeddings limpo");
    }
    /**
     * Retorna estatísticas do cache com hit rate
     */
    getCacheStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: total > 0 ? this.hits / total : 0,
            hits: this.hits,
            misses: this.misses,
            totalRequests: total,
        };
    }
}
//# sourceMappingURL=embeddings.js.map