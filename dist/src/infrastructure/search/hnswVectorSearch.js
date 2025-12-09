/**
 * Busca vetorial usando HNSW (Hierarchical Navigable Small World)
 * Implementação otimizada para grandes volumes de dados
 * Fallback para busca sequencial se HNSW não estiver disponível
 */
import { logger } from "../../shared/logging/logger.js";
import { VectorSearch } from "./vectorSearch.js";
let HNSWLib = null;
let isHNSWAvailable = false;
// Tentar carregar HNSW (opcional)
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    HNSWLib = require("hnswlib-node");
    isHNSWAvailable = true;
    logger.info("HNSW index disponível - usando busca otimizada");
}
catch {
    logger.warn("HNSW não disponível - usando busca sequencial");
    isHNSWAvailable = false;
}
/**
 * Busca vetorial com HNSW index (quando disponível)
 * Fallback automático para busca sequencial
 */
export class HNSWVectorSearch {
    fallbackSearch;
    indexes = new Map(); // Cache de índices por coleção
    embeddingDimension = null;
    constructor() {
        this.fallbackSearch = new VectorSearch();
    }
    /**
     * Inicializa índice HNSW para uma coleção
     */
    async initializeIndex(collectionName, documents, dimension) {
        if (!isHNSWAvailable || documents.length === 0) {
            return;
        }
        try {
            // Verificar se já existe índice para esta coleção
            if (this.indexes.has(collectionName)) {
                return;
            }
            // Criar novo índice HNSW
            if (!HNSWLib) {
                return;
            }
            const index = new HNSWLib.HierarchicalNSW("cosine", dimension);
            const maxElements = Math.max(documents.length * 2, 1000); // Prever crescimento
            index.initIndex(maxElements);
            // Adicionar documentos ao índice
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];
                if (doc.embedding && doc.embedding.length === dimension) {
                    index.addPoint(doc.embedding, i);
                }
            }
            this.indexes.set(collectionName, {
                index,
                documents,
                dimension,
            });
            logger.info({ collectionName, documentCount: documents.length, dimension }, "Índice HNSW criado e populado");
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn({ error: errorMessage, collectionName }, "Erro ao criar índice HNSW, usando fallback");
            isHNSWAvailable = false;
        }
    }
    /**
     * Atualiza índice quando novos documentos são adicionados
     */
    async updateIndex(collectionName, newDocuments, dimension) {
        if (!isHNSWAvailable) {
            return;
        }
        const indexData = this.indexes.get(collectionName);
        if (!indexData) {
            // Criar novo índice
            await this.initializeIndex(collectionName, newDocuments, dimension);
            return;
        }
        try {
            const { index, documents } = indexData;
            const currentSize = documents.length;
            // Adicionar novos documentos ao índice existente
            for (let i = 0; i < newDocuments.length; i++) {
                const doc = newDocuments[i];
                if (doc.embedding && doc.embedding.length === dimension) {
                    index.addPoint(doc.embedding, currentSize + i);
                }
            }
            // Atualizar cache de documentos
            indexData.documents = [...documents, ...newDocuments];
            logger.debug({ collectionName, newDocs: newDocuments.length, totalDocs: indexData.documents.length }, "Índice HNSW atualizado");
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn({ error: errorMessage }, "Erro ao atualizar índice HNSW");
        }
    }
    /**
     * Busca usando HNSW (se disponível) ou fallback sequencial
     */
    async search(queryEmbedding, documents, options = {}) {
        const { topK = 5, filter = null } = options;
        if (documents.length === 0) {
            return [];
        }
        // Detectar dimensão do embedding
        const dimension = queryEmbedding.length;
        if (this.embeddingDimension === null) {
            this.embeddingDimension = dimension;
        }
        // Se HNSW não está disponível ou coleção é muito pequena, usar busca sequencial
        if (!isHNSWAvailable || documents.length < 100) {
            return this.fallbackSearch.search(queryEmbedding, documents, options);
        }
        // Usar HNSW para coleções maiores
        try {
            // Gerar nome de coleção baseado em hash dos documentos (simplificado)
            const collectionName = this.getCollectionName(documents);
            // Inicializar índice se necessário
            if (!this.indexes.has(collectionName)) {
                await this.initializeIndex(collectionName, documents, dimension);
            }
            const indexData = this.indexes.get(collectionName);
            if (!indexData) {
                // Fallback se índice não foi criado
                return this.fallbackSearch.search(queryEmbedding, documents, options);
            }
            const { index, documents: indexedDocs } = indexData;
            // Buscar usando HNSW
            const searchK = Math.min(topK * 10, indexedDocs.length); // Buscar mais para melhor precisão
            const result = index.searchKnn(queryEmbedding, searchK);
            // Converter resultados para formato esperado
            const results = [];
            for (let i = 0; i < result.neighbors.length; i++) {
                const idx = result.neighbors[i];
                const distance = result.distances[i];
                const doc = indexedDocs[idx];
                if (!doc)
                    continue;
                // Aplicar filtro se fornecido
                if (filter && this.shouldSkipDocument(doc, filter)) {
                    continue;
                }
                // Converter distância para similaridade (cosine distance -> similarity)
                const similarity = 1 - distance;
                results.push({
                    id: doc.id,
                    text: doc.text,
                    metadata: doc.metadata,
                    distance: distance,
                    similarity: similarity,
                });
                if (results.length >= topK) {
                    break;
                }
            }
            logger.debug({ collectionName, topK, resultsFound: results.length, totalDocs: indexedDocs.length }, "Busca HNSW concluída");
            return results;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn({ error: errorMessage }, "Erro na busca HNSW, usando fallback sequencial");
            return this.fallbackSearch.search(queryEmbedding, documents, options);
        }
    }
    /**
     * Gera nome de coleção baseado em hash simples dos documentos
     */
    getCollectionName(documents) {
        // Usar hash simples baseado no número de documentos e primeiro ID
        if (documents.length === 0) {
            return "empty";
        }
        return `collection-${documents.length}-${documents[0]?.id?.substring(0, 8) || "default"}`;
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
     * Limpa índices de uma coleção
     */
    clearIndex(collectionName) {
        this.indexes.delete(collectionName);
        logger.debug({ collectionName }, "Índice HNSW limpo");
    }
    /**
     * Limpa todos os índices
     */
    clearAllIndexes() {
        this.indexes.clear();
        logger.info("Todos os índices HNSW limpos");
    }
    /**
     * Verifica se HNSW está disponível
     */
    static isAvailable() {
        return isHNSWAvailable;
    }
}
//# sourceMappingURL=hnswVectorSearch.js.map