/**
 * Tipos TypeScript compartilhados e Symbols para DI
 */

// ==================== TIPOS DE DADOS ====================

export interface PDFInfo {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PDFMetadata {
  pages?: number;
  info?: PDFInfo;
  extension?: string;
  source?: string;
  filename?: string;
  [key: string]: string | number | boolean | PDFInfo | undefined;
}

export interface TransformersOutput {
  data: Float32Array | Float64Array | Int32Array;
  dims: number[];
}

export interface TransformersPipeline {
  (text: string, options?: { pooling?: string; normalize?: boolean }): Promise<TransformersOutput>;
  (
    texts: string[],
    options?: { pooling?: string; normalize?: boolean }
  ): Promise<TransformersOutput[]>;
}

export interface PDF2PicResult {
  buffer?: Buffer;
  name?: string;
  size?: number;
  path?: string;
}

export interface FileLike {
  name?: string;
  size: number;
  type?: string;
  tempPath?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export interface RequestHeaders {
  [key: string]: string | string[] | undefined;
  "content-type"?: string;
}

export interface BusboyFileInfo {
  filename: string;
  encoding: string;
  mimeType: string;
}

export type FilterValue = string | number | boolean | null | undefined;
export type DocumentFilter = Record<string, FilterValue> | null;

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
} as const;
