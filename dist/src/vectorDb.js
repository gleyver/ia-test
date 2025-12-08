/**
 * Vector DB simples usando arquivos JSON (sem ChromaDB)
 * Armazena embeddings e documentos em arquivos locais
 * Refatorado para usar Repository Pattern e separar busca de persistência
 */
import { VectorSearch } from "./infrastructure/search/vectorSearch.js";
import { FileSystemStorage } from "./infrastructure/storage/fileSystemStorage.js";
import { JsonDocumentRepository } from "./infrastructure/storage/jsonDocumentRepository.js";
import { logger } from "./logger.js";
export class VectorDB {
    collectionName;
    documents;
    _initialized = false;
    repository;
    vectorSearch;
    constructor({ collectionName = "documents", path = "./vector_db", } = {}) {
        this.collectionName = collectionName;
        this.documents = [];
        // Inicializar dependências (composição)
        const storage = new FileSystemStorage();
        this.repository = new JsonDocumentRepository(storage, path);
        this.vectorSearch = new VectorSearch();
    }
    async initialize() {
        if (this._initialized) {
            return;
        }
        // Carregar documentos do repositório
        const loadedDocs = await this.repository.load(this.collectionName);
        // Pré-computar norms para documentos que não têm (migração)
        this.documents = loadedDocs.map((doc) => {
            if (!doc.norm && doc.embedding) {
                let sum = 0;
                for (let i = 0; i < doc.embedding.length; i++) {
                    sum += doc.embedding[i] * doc.embedding[i];
                }
                doc.norm = sum;
            }
            return doc;
        });
        logger.info({ collectionName: this.collectionName, documentCount: this.documents.length }, "Documentos carregados");
        this._initialized = true;
    }
    /**
     * @private
     * Salva documentos usando repositório
     */
    async save() {
        await this.repository.save(this.collectionName, this.documents);
        logger.debug({ collectionName: this.collectionName, documentCount: this.documents.length }, "Documentos salvos");
    }
    async addDocuments(chunks) {
        if (!this._initialized) {
            await this.initialize();
        }
        // Pré-computar norms durante criação (otimização)
        const { DocumentId } = await import("./domain/valueObjects/documentId.js");
        const newDocs = chunks.map((chunk) => {
            let norm = 0;
            for (let j = 0; j < chunk.embedding.length; j++) {
                norm += chunk.embedding[j] * chunk.embedding[j];
            }
            // Usar DocumentId para gerar IDs consistentes
            const docId = DocumentId.generate();
            return {
                id: docId.toString(),
                text: chunk.text,
                embedding: chunk.embedding,
                norm: norm,
                metadata: chunk.metadata || {},
            };
        });
        logger.debug({ newDocs: newDocs.length, currentDocs: this.documents.length }, "Adicionando documentos à coleção");
        this.documents.push(...newDocs);
        logger.debug({ totalDocs: this.documents.length }, "Total de documentos após adicionar");
        // Salvar usando repositório
        await this.save();
    }
    async search(queryEmbedding, { topK = 5, filter = null } = {}) {
        await this.initialize();
        if (this.documents.length === 0) {
            logger.warn("Vector DB está vazia! Nenhum documento indexado.");
            return [];
        }
        logger.debug({ documentCount: this.documents.length, topK }, "Iniciando busca na VectorDB");
        // Usar VectorSearch para buscar
        return this.vectorSearch.search(queryEmbedding, this.documents, { topK, filter });
    }
    async getCollectionInfo() {
        await this.initialize();
        return {
            collectionName: this.collectionName,
            documentCount: this.documents.length,
        };
    }
    async deleteCollection() {
        this.documents = [];
        await this.repository.delete(this.collectionName);
        this._initialized = false;
        logger.info({ collectionName: this.collectionName }, "Coleção deletada");
    }
}
//# sourceMappingURL=vectorDb.js.map