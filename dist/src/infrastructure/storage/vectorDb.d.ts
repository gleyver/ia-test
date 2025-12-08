/**
 * Vector DB simples usando arquivos JSON (sem ChromaDB)
 * Armazena embeddings e documentos em arquivos locais
 * Refatorado para usar Repository Pattern e separar busca de persistência
 */
import type { ChunkMetadata } from "../../domain/entities/chunker.js";
export interface Document {
  id: string;
  text: string;
  embedding: number[];
  norm?: number;
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
export declare class VectorDB {
  private collectionName;
  private documents;
  private _initialized;
  private repository;
  private vectorSearch;
  constructor({ collectionName, path }?: { collectionName?: string; path?: string });
  initialize(): Promise<void>;
  /**
   * @private
   * Salva documentos usando repositório
   */
  private save;
  addDocuments(
    chunks: Array<{
      text: string;
      embedding: number[];
      metadata: ChunkMetadata;
    }>
  ): Promise<void>;
  search(queryEmbedding: number[], { topK, filter }?: SearchOptions): Promise<SearchResult[]>;
  getCollectionInfo(): Promise<{
    collectionName: string;
    documentCount: number;
  }>;
  deleteCollection(): Promise<void>;
}
//# sourceMappingURL=vectorDb.d.ts.map
