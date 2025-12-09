/**
 * Tipos TypeScript compartilhados e Symbols para DI
 */
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
  (
    text: string,
    options?: {
      pooling?: string;
      normalize?: boolean;
    }
  ): Promise<TransformersOutput>;
  (
    texts: string[],
    options?: {
      pooling?: string;
      normalize?: boolean;
    }
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
/**
 * Symbols para identificação de dependências no container DI
 * Separado do container para evitar dependências circulares
 */
export declare const TYPES: {
  readonly DocumentProcessor: symbol;
  readonly TextChunker: symbol;
  readonly EmbeddingGenerator: symbol;
  readonly ResponseGenerator: symbol;
  readonly Retriever: symbol;
  readonly VectorDB: symbol;
  readonly SessionCleaner: symbol;
  readonly DocumentService: symbol;
  readonly QueryService: symbol;
  readonly HealthCheckService: symbol;
  readonly VectorDBFactory: symbol;
  readonly RetrieverFactory: symbol;
  readonly EmbeddingCache: symbol;
};
//# sourceMappingURL=types.d.ts.map
