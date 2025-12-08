/**
 * Retriever para busca de documentos
 * Implementa IRetriever
 */
import { logger } from "../../shared/logging/logger.js";
export class Retriever {
    vectorDb;
    embeddingGenerator;
    constructor({ vectorDb, embeddingGenerator, }) {
        this.vectorDb = vectorDb;
        this.embeddingGenerator = embeddingGenerator;
    }
    async retrieve(query, { topK = 10, filter = null } = {}) {
        // Gerar embedding da query
        logger.debug({ query }, "Gerando embedding da query");
        const queryEmbedding = await this.embeddingGenerator.generateEmbedding(query);
        logger.debug({ dimensions: queryEmbedding.length }, "Embedding gerado");
        // Buscar na Vector DB (aumentar topK para pegar mais contexto)
        const results = await this.vectorDb.search(queryEmbedding, { topK, filter });
        if (results.length > 0) {
            logger.debug({
                resultsCount: results.length,
                similarities: results.map((r) => r.similarity.toFixed(3)),
            }, "Resultados encontrados");
        }
        else {
            logger.warn("Nenhum resultado encontrado na busca");
        }
        return results;
    }
}
//# sourceMappingURL=retriever.js.map