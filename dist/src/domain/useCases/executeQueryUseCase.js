/**
 * Use Case: Executar query
 * Encapsula lógica de negócio para execução de queries
 */
/**
 * Use Case para executar query
 */
export class ExecuteQueryUseCase {
    createRetriever;
    responseGenerator;
    constructor(createRetriever, responseGenerator) {
        this.createRetriever = createRetriever;
        this.responseGenerator = responseGenerator;
    }
    async execute(command) {
        const queryString = command.query.toString();
        // Se tem arquivo e VectorDB, buscar contexto
        if (command.hasFile && command.vectorDb) {
            await command.vectorDb.initialize();
            const retriever = this.createRetriever(command.vectorDb);
            const retrievedDocs = await retriever.retrieve(queryString, { topK: 5 });
            if (retrievedDocs.length > 0) {
                // Gerar resposta com contexto
                const result = await this.responseGenerator.generate(queryString, retrievedDocs);
                return {
                    response: result.response,
                    sources: retrievedDocs.map((doc) => ({
                        text: doc.text,
                        similarity: doc.similarity,
                        metadata: doc.metadata,
                    })),
                    metadata: {
                        hasContext: true,
                        sourcesCount: retrievedDocs.length,
                    },
                };
            }
        }
        // Sem contexto ou sem documentos encontrados - usar conhecimento do modelo
        const result = await this.responseGenerator.generateWithoutContext(queryString);
        return {
            response: result.response,
            sources: [],
            metadata: {
                hasContext: false,
                sourcesCount: 0,
            },
        };
    }
}
//# sourceMappingURL=executeQueryUseCase.js.map