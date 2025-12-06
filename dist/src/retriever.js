/**
 * Retriever para busca de documentos
 */
export class Retriever {
    vectorDb;
    embeddingGenerator;
    constructor({ vectorDb, embeddingGenerator, }) {
        this.vectorDb = vectorDb;
        this.embeddingGenerator = embeddingGenerator;
    }
    async retrieve(query, { topK = 10, filter = null } = {}) {
        // Gerar embedding da query
        console.log(`🔢 Gerando embedding da query: "${query}"`);
        const queryEmbedding = await this.embeddingGenerator.generateEmbedding(query);
        console.log(`✅ Embedding gerado: ${queryEmbedding.length} dimensões`);
        // Buscar na Vector DB (aumentar topK para pegar mais contexto)
        const results = await this.vectorDb.search(queryEmbedding, { topK, filter });
        if (results.length > 0) {
            console.log(`📊 Similaridades encontradas: ${results.map((r) => r.similarity.toFixed(3)).join(", ")}`);
            console.log(`📄 Primeiros 3 resultados:`);
            results.slice(0, 3).forEach((r, i) => {
                console.log(`  ${i + 1}. Similaridade: ${r.similarity.toFixed(3)} | Texto: ${r.text.substring(0, 150)}...`);
            });
        }
        else {
            console.warn(`⚠️ Nenhum resultado encontrado na busca!`);
        }
        return results;
    }
}
//# sourceMappingURL=retriever.js.map