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
export function createTestQuery(text: string = "Qual é o conteúdo do documento?"): Query {
  return Query.fromString(text);
}

/**
 * Cria um SessionId de teste
 */
export function createTestSessionId(): SessionId {
  return SessionId.generate();
}

/**
 * Cria um DocumentId de teste
 */
export function createTestDocumentId(): DocumentId {
  return DocumentId.generate();
}

/**
 * Cria um FileSize de teste
 */
export function createTestFileSize(bytes: number = 1024): FileSize {
  return FileSize.fromBytes(bytes);
}

/**
 * Cria um FileLike de teste
 */
export function createTestFile(
  filename: string = "test.pdf",
  content: string = "Conteúdo de teste",
  mimeType: string = "application/pdf"
): FileLike {
  const buffer = Buffer.from(content);
  return {
    name: filename,
    size: buffer.length,
    type: mimeType,
    arrayBuffer: async () => buffer.buffer as ArrayBuffer,
  };
}

/**
 * Cria um FileLike com buffer customizado
 */
export function createTestFileWithBuffer(
  filename: string,
  buffer: Buffer,
  mimeType?: string
): FileLike {
  return {
    name: filename,
    size: buffer.length,
    type: mimeType || "application/pdf",
    arrayBuffer: async () => buffer.buffer as ArrayBuffer,
  };
}

/**
 * Cria um PDF mockado (apenas headers, não é um PDF válido)
 */
export function createMockPDFBuffer(pages: number = 1): Buffer {
  // PDF mínimo válido (apenas para testes)
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count ${pages} >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
trailer
<< /Size 4 /Root 1 0 R >>
startxref
100
%%EOF`;
  return Buffer.from(pdfContent);
}

/**
 * Cria um DOCX mockado (apenas estrutura mínima)
 */
export function createMockDOCXBuffer(): Buffer {
  // ZIP mínimo (DOCX é um ZIP)
  // Apenas para testes estruturais
  return Buffer.from("PK\x03\x04"); // ZIP header
}

/**
 * Cria dados de embedding de teste
 */
export function createTestEmbedding(dimensions: number = 384, value: number = 0.1): number[] {
  return new Array(dimensions).fill(value);
}

/**
 * Cria múltiplos embeddings de teste
 */
export function createTestEmbeddings(
  count: number,
  dimensions: number = 384,
  value: number = 0.1
): number[][] {
  return Array.from({ length: count }, () => createTestEmbedding(dimensions, value));
}

/**
 * Cria chunks de texto de teste
 */
export function createTestChunks(
  count: number = 3
): Array<{ text: string; metadata: { chunkIndex: number; totalChunks: number; source: string } }> {
  return Array.from({ length: count }, (_, i) => ({
    text: `Chunk ${i + 1} de texto de teste`,
    metadata: {
      chunkIndex: i,
      totalChunks: count,
      source: "test.pdf",
    },
  }));
}

/**
 * Cria resultado de busca vetorial de teste
 */
export function createTestSearchResults(count: number = 3): Array<{
  text: string;
  similarity: number;
  metadata: unknown;
}> {
  return Array.from({ length: count }, (_, i) => ({
    text: `Documento relevante ${i + 1}`,
    similarity: 0.95 - i * 0.1,
    metadata: {
      source: `test-${i}.pdf`,
      chunkIndex: i,
    },
  }));
}
