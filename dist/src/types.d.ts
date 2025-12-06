/**
 * Tipos compartilhados do sistema RAG
 */
export interface PDFInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: string;
  ModDate?: string;
  [key: string]: string | number | boolean | undefined;
}
export interface PDFMetadata {
  info?: PDFInfo;
  [key: string]: string | number | boolean | PDFInfo | undefined;
}
export interface TransformersOutput {
  data: Float32Array;
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
//# sourceMappingURL=types.d.ts.map
