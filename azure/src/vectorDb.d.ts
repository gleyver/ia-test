/**
 * Vector DB simples usando arquivos JSON (sem ChromaDB)
 * Armazena embeddings e documentos em arquivos locais
 */
import type { ChunkMetadata } from "./chunker.js";
export interface Document {
  id: string;
  text: string;
  embedding: number[];
  metadata: ChunkMetadata;
}
export interface SearchResult {
  id: string;
  text: string;
  metadata: ChunkMetadata;
  distance: number;
  similarity: number;
}
import type { DocumentFilter } from "./types.js";
export interface SearchOptions {
  topK?: number;
  filter?: DocumentFilter;
}
export declare class VectorDB {
  private collectionName;
  private dbPath;
  private collectionPath;
  private documents;
  constructor({ collectionName, path }?: { collectionName?: string; path?: string });
  initialize(): Promise<void>;
  save(): Promise<void>;
  addDocuments(
    chunks: Array<{
      text: string;
      embedding: number[];
      metadata?: ChunkMetadata;
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
