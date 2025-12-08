/**
 * Use Case: Processar e indexar documento
 * Encapsula lógica de negócio para processamento de documentos
 */
import { SessionId } from "../valueObjects/sessionId.js";
/**
 * Use Case para processar e indexar documento
 */
export class ProcessDocumentUseCase {
    documentProcessor;
    chunker;
    embeddingGenerator;
    createVectorDb;
    constructor(documentProcessor, chunker, embeddingGenerator, createVectorDb) {
        this.documentProcessor = documentProcessor;
        this.chunker = chunker;
        this.embeddingGenerator = embeddingGenerator;
        this.createVectorDb = createVectorDb;
    }
    async execute(command) {
        const sessionId = command.sessionId || SessionId.generate();
        // Processar documento (precisa do caminho do arquivo)
        const filePath = command.file.tempPath || command.file.name || "";
        const { text, metadata } = await this.documentProcessor.process(filePath);
        // Criar chunks
        const chunks = this.chunker.createChunks(text, metadata);
        // Gerar embeddings
        const chunksWithEmbeddings = await this.embeddingGenerator.generateEmbeddings(chunks);
        // Indexar na Vector DB
        const vectorDb = this.createVectorDb(sessionId.toString());
        await vectorDb.initialize();
        await vectorDb.addDocuments(chunksWithEmbeddings);
        return {
            sessionId,
            chunksCreated: chunks.length,
            metadata,
        };
    }
}
//# sourceMappingURL=processDocumentUseCase.js.map