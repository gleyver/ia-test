/**
 * Tipos compartilhados do sistema RAG
 */

// PDF Info e Metadata
export interface PDFInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: string;
  ModDate?: string;
  // Permitir propriedades adicionais
  [key: string]: string | number | boolean | undefined;
}

export interface PDFMetadata {
  info?: PDFInfo;
  // Permitir propriedades adicionais
  [key: string]: string | number | boolean | PDFInfo | undefined;
}

// Pipeline do Transformers
export interface TransformersOutput {
  data: Float32Array;
}

export interface TransformersPipeline {
  (text: string, options?: { pooling?: string; normalize?: boolean }): Promise<TransformersOutput>;
  (
    texts: string[],
    options?: { pooling?: string; normalize?: boolean }
  ): Promise<TransformersOutput[]>;
}

// PDF2Pic Result
export interface PDF2PicResult {
  buffer?: Buffer;
  name?: string;
  size?: number;
  path?: string;
}

// File-like object (para compatibilidade com File e objetos customizados)
export interface FileLike {
  name?: string;
  size: number;
  type?: string;
  tempPath?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

// Headers do Request
export interface RequestHeaders {
  [key: string]: string | string[] | undefined;
  "content-type"?: string;
}

// Busboy File Info
export interface BusboyFileInfo {
  filename: string;
  encoding: string;
  mimeType: string;
}

// PDF Text Content (tipos do pdfjs-dist)
// Nota: Estes tipos são aproximações, pois pdfjs-dist não exporta tipos completos

// Filter type (tipado estritamente, sem any)
export type FilterValue = string | number | boolean | null | undefined;
export type DocumentFilter = Record<string, FilterValue> | null;
