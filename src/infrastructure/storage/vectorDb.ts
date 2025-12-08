/**
 * Vector DB simples usando arquivos JSON (sem ChromaDB)
 * Armazena embeddings e documentos em arquivos locais
 * Refatorado para usar Repository Pattern e separar busca de persistência
 */

import type { ChunkMetadata } from "../../domain/entities/chunker.js";
import type { IDocumentRepository } from "../../domain/interfaces/documentRepository.interface.js";
import type { IVectorSearch } from "../../domain/interfaces/vectorSearch.interface.js";
import { logger } from "../../shared/logging/logger.js";
import { VectorSearch } from "../search/vectorSearch.js";
import { FileSystemStorage } from "./fileSystemStorage.js";
import { JsonDocumentRepository } from "./jsonDocumentRepository.js";

export interface Document {
  id: string;
  text: string;
  embedding: number[];
  norm?: number; // Norm pré-computado para otimização (sqrt(sum(embedding[i]^2)))
  metadata: ChunkMetadata;
}

export interface SearchResult {
  id: string;
  text: string;
  metadata: ChunkMetadata;
  distance: number;
  similarity: number;
}

import type { DocumentFilter } from "../../shared/types/types.js";

export interface SearchOptions {
  topK?: number;
  filter?: DocumentFilter;
}

export class VectorDB {
  private collectionName: string;
  private documents: Document[];
  private _initialized: boolean = false;
  private repository: IDocumentRepository;
  private vectorSearch: IVectorSearch;

  constructor({
    collectionName = "documents",
    path = "./vector_db",
  }: { collectionName?: string; path?: string } = {}) {
    this.collectionName = collectionName;
    this.documents = [];

    // Inicializar dependências (composição)
    const storage = new FileSystemStorage();
    this.repository = new JsonDocumentRepository(storage, path);
    this.vectorSearch = new VectorSearch();
  }

  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    // Carregar documentos do repositório
    const loadedDocs = await this.repository.load(this.collectionName);

    // Pré-computar norms para documentos que não têm (migração)
    this.documents = loadedDocs.map((doc: Document) => {
      if (!doc.norm && doc.embedding) {
        let sum = 0;
        for (let i = 0; i < doc.embedding.length; i++) {
          sum += doc.embedding[i] * doc.embedding[i];
        }
        doc.norm = sum;
      }
      return doc;
    });

    logger.info(
      { collectionName: this.collectionName, documentCount: this.documents.length },
      "Documentos carregados"
    );

    this._initialized = true;
  }

  /**
   * @private
   * Salva documentos usando repositório
   */
  private async save(): Promise<void> {
    await this.repository.save(this.collectionName, this.documents);
    logger.debug(
      { collectionName: this.collectionName, documentCount: this.documents.length },
      "Documentos salvos"
    );
  }

  async addDocuments(
    chunks: Array<{ text: string; embedding: number[]; metadata: ChunkMetadata }>
  ): Promise<void> {
    if (!this._initialized) {
      await this.initialize();
    }

    // Pré-computar norms durante criação (otimização)
    const { DocumentId } = await import("../../domain/valueObjects/documentId.js");

    const newDocs: Document[] = chunks.map((chunk) => {
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
        metadata: chunk.metadata,
      };
    });

    logger.debug(
      { newDocs: newDocs.length, currentDocs: this.documents.length },
      "Adicionando documentos à coleção"
    );
    this.documents.push(...newDocs);
    logger.debug({ totalDocs: this.documents.length }, "Total de documentos após adicionar");

    // Salvar usando repositório
    await this.save();
  }

  async search(
    queryEmbedding: number[],
    { topK = 5, filter = null }: SearchOptions = {}
  ): Promise<SearchResult[]> {
    await this.initialize();

    if (this.documents.length === 0) {
      logger.warn("Vector DB está vazia! Nenhum documento indexado.");
      return [];
    }

    logger.debug({ documentCount: this.documents.length, topK }, "Iniciando busca na VectorDB");

    // Usar VectorSearch para buscar
    return this.vectorSearch.search(queryEmbedding, this.documents, { topK, filter });
  }

  async getCollectionInfo(): Promise<{ collectionName: string; documentCount: number }> {
    await this.initialize();
    return {
      collectionName: this.collectionName,
      documentCount: this.documents.length,
    };
  }

  async deleteCollection(): Promise<void> {
    this.documents = [];
    await this.repository.delete(this.collectionName);
    this._initialized = false;
    logger.info({ collectionName: this.collectionName }, "Coleção deletada");
  }
}
