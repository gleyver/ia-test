/**
 * Tipos TypeScript compartilhados e Symbols para DI
 */
// ==================== SYMBOLS PARA DI ====================
/**
 * Symbols para identificação de dependências no container DI
 * Separado do container para evitar dependências circulares
 */
export const TYPES = {
    // Core
    DocumentProcessor: Symbol.for("DocumentProcessor"),
    TextChunker: Symbol.for("TextChunker"),
    EmbeddingGenerator: Symbol.for("EmbeddingGenerator"),
    ResponseGenerator: Symbol.for("ResponseGenerator"),
    Retriever: Symbol.for("Retriever"),
    VectorDB: Symbol.for("VectorDB"),
    SessionCleaner: Symbol.for("SessionCleaner"),
    // Services
    DocumentService: Symbol.for("DocumentService"),
    QueryService: Symbol.for("QueryService"),
    HealthCheckService: Symbol.for("HealthCheckService"),
    // Factories
    VectorDBFactory: Symbol.for("VectorDBFactory"),
    RetrieverFactory: Symbol.for("RetrieverFactory"),
    // Cache
    EmbeddingCache: Symbol.for("EmbeddingCache"),
};
//# sourceMappingURL=types.js.map