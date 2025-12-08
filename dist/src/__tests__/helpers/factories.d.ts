/**
 * Factories para criar dados de teste
 * Facilita criação de objetos de teste consistentes
 */
import { DocumentId } from "../../domain/valueObjects/documentId.js";
import { FileSize } from "../../domain/valueObjects/fileSize.js";
import { Query } from "../../domain/valueObjects/query.js";
import { SessionId } from "../../domain/valueObjects/sessionId.js";
import type { FileLike } from "../../shared/types/types.js";
/**
 * Cria um Query de teste
 */
export declare function createTestQuery(text?: string): Query;
/**
 * Cria um SessionId de teste
 */
export declare function createTestSessionId(): SessionId;
/**
 * Cria um DocumentId de teste
 */
export declare function createTestDocumentId(): DocumentId;
/**
 * Cria um FileSize de teste
 */
export declare function createTestFileSize(bytes?: number): FileSize;
/**
 * Cria um FileLike de teste
 */
export declare function createTestFile(
  filename?: string,
  content?: string,
  mimeType?: string
): FileLike;
/**
 * Cria um FileLike com buffer customizado
 */
export declare function createTestFileWithBuffer(
  filename: string,
  buffer: Buffer,
  mimeType?: string
): FileLike;
/**
 * Cria um PDF mockado (apenas headers, não é um PDF válido)
 */
export declare function createMockPDFBuffer(pages?: number): Buffer;
/**
 * Cria um DOCX mockado (apenas estrutura mínima)
 */
export declare function createMockDOCXBuffer(): Buffer;
/**
 * Cria dados de embedding de teste
 */
export declare function createTestEmbedding(dimensions?: number, value?: number): number[];
/**
 * Cria múltiplos embeddings de teste
 */
export declare function createTestEmbeddings(
  count: number,
  dimensions?: number,
  value?: number
): number[][];
/**
 * Cria chunks de texto de teste
 */
export declare function createTestChunks(count?: number): Array<{
  text: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    source: string;
  };
}>;
/**
 * Cria resultado de busca vetorial de teste
 */
export declare function createTestSearchResults(count?: number): Array<{
  text: string;
  similarity: number;
  metadata: unknown;
}>;
//# sourceMappingURL=factories.d.ts.map
